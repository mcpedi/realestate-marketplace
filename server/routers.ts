import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { sendInquiryNotification, sendApprovalNotification, sendRejectionNotification } from "./notifications";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import { invokeLLM } from "./_core/llm";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  router,
} from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { users as usersTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Modern Features (AI assistant, recommendations, alerts, bookings, scores) ──

function computeMatchScore(
  property: { price: number | null; bedrooms: number | null; propertyType: string | null; listingType: string | null; location: string | null },
  prefs: { budgetMin: number | null; budgetMax: number | null; minBedrooms: number | null; listingType: string | null; preferredTypes: string[]; preferredLocations: string[] },
): { score: number; weights: Array<{ name: string; weight: number; earned: number }> } {
  let score = 0;
  const weights: { name: string; weight: number; earned: number }[] = [];
  const price = property.price ?? 0;
  // Budget fit (35 points)
  if (prefs.budgetMin !== null && prefs.budgetMax !== null && price > 0) {
    const inRange = price >= prefs.budgetMin && price <= prefs.budgetMax * 1.1; // 10% buffer above max
    const nearMid = 1 - Math.min(Math.abs(price - (prefs.budgetMin + prefs.budgetMax) / 2) / (prefs.budgetMax - prefs.budgetMin + 1), 1);
    const budgetPoints = inRange ? Math.round(20 + 15 * nearMid) : price <= prefs.budgetMax * 1.2 ? 10 : 0;
    score += budgetPoints;
    weights.push({ name: "Budget", weight: 35, earned: budgetPoints });
  } else {
    score += 25;
    weights.push({ name: "Budget", weight: 35, earned: 25 });
  }
  // Location match (25 points)
  if (prefs.preferredLocations.length > 0 && property.location) {
    const loc = (property.location || "").toLowerCase();
    const matched = prefs.preferredLocations.some((l) => loc.includes(l.toLowerCase()));
    const points = matched ? 25 : 5;
    score += points;
    weights.push({ name: "Location", weight: 25, earned: points });
  } else {
    score += 15;
    weights.push({ name: "Location", weight: 25, earned: 15 });
  }
  // Property type (15 points)
  if (prefs.preferredTypes.length > 0 && property.propertyType) {
    const matched = prefs.preferredTypes.includes(property.propertyType);
    const points = matched ? 15 : 3;
    score += points;
    weights.push({ name: "Type", weight: 15, earned: points });
  } else {
    score += 8;
    weights.push({ name: "Type", weight: 15, earned: 8 });
  }
  // Bedrooms (10 points)
  if ((prefs.minBedrooms ?? 0) > 0 && property.bedrooms !== null) {
    const points = (property.bedrooms ?? 0) >= (prefs.minBedrooms ?? 0) ? 10 : 0;
    score += points;
    weights.push({ name: "Bedrooms", weight: 10, earned: points });
  } else {
    score += 5;
    weights.push({ name: "Bedrooms", weight: 10, earned: 5 });
  }
  // Listing type (15 points)
  if (prefs.listingType && prefs.listingType !== "any" && property.listingType) {
    const points = property.listingType === prefs.listingType ? 15 : 0;
    score += points;
    weights.push({ name: "Listing type", weight: 15, earned: points });
  } else {
    score += 8;
    weights.push({ name: "Listing type", weight: 15, earned: 8 });
  }
  return { score: Math.min(100, Math.max(0, score)), weights };
}

function computePropertyScore(p: {
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  amenities: string | null;
  location: string | null;
  featured: boolean | null;
}) {
  // Value (40): price relative to size (price per bedroom proxy)
  const price = typeof p.price === "number" ? p.price : 0;
  const beds = typeof p.bedrooms === "number" ? p.bedrooms : 1;
  const baths = typeof p.bathrooms === "number" ? p.bathrooms : 1;
  const amenityText = typeof p.amenities === "string" ? p.amenities : "";
  const featured = p.featured === true;
  const locationText = typeof p.location === "string" ? p.location : null;
  let valueScore = 60;
  if (price > 0 && beds > 0) {
    const perBed = price / beds;
    if (perBed < 5_000_000) valueScore = 90;
    else if (perBed < 10_000_000) valueScore = 80;
    else if (perBed < 20_000_000) valueScore = 70;
    else if (perBed < 40_000_000) valueScore = 60;
    else if (perBed < 80_000_000) valueScore = 45;
    else valueScore = 30;
  }
  // Amenities (25)
  const amenityCount = amenityText.split(",").filter((a) => a.trim()).length;
  const amenitiesScore = Math.min(25, Math.round((amenityCount / 8) * 25));
  // Location (20): rough proxy — location provided + featured status
  const locationScore = locationText ? (featured ? 20 : 15) : 5;
  // Accessibility (15): rooms balance (bed/bath ratio)
  const ratio = beds > 0 ? baths / beds : 0.5;
  const accessibilityScore = ratio >= 0.5 && ratio <= 1.2 ? 15 : ratio >= 0.3 ? 10 : 6;
  const score = valueScore + amenitiesScore + locationScore + accessibilityScore;
  return {
    score: Math.min(100, Math.max(0, score)),
    valueScore,
    locationScore,
    amenitiesScore,
    accessibilityScore,
    breakdown: {
      pricePerBedroom: price > 0 && beds > 0 ? Math.round(price / beds) : null,
      amenityCount,
      bedBathRatio: baths > 0 ? Math.round((beds / baths) * 10) / 10 : null,
    },
  };
}

const modernRouter = router({
  // ── Preferences ─────────────────────────────────────────────────────────────
  preferencesGet: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserPreferences(ctx.user.id);
  }),
  preferencesSet: protectedProcedure
    .input(
      z.object({
        budgetMin: z.number().nullable(),
        budgetMax: z.number().nullable(),
        preferredLocations: z.array(z.string()),
        preferredTypes: z.array(z.string()),
        minBedrooms: z.number().min(0).max(10),
        listingType: z.enum(["sale", "rent", "any"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.upsertUserPreferences(ctx.user.id, input);
      return { success: true };
    }),

  // ── Persistent account navigation counts ───────────────────────────────────
  accountActivitySummary: protectedProcedure.query(async ({ ctx }) => {
    return db.getAccountActivitySummary(ctx.user.id);
  }),
  profileHubSummary: protectedProcedure.query(async ({ ctx }) => {
    return db.getProfileHubSummary(ctx.user.id);
  }),
  notificationsList: protectedProcedure.query(async ({ ctx }) => {
    return db.getAccountNotifications(ctx.user.id);
  }),
  notificationMarkRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await db.markAccountNotificationRead(input.id, ctx.user.id);
      if (!success) throw new TRPCError({ code: "NOT_FOUND" });
      return { success };
    }),

  // ── Match scoring ───────────────────────────────────────────────────────────
  matchScore: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const prefs = await db.getUserPreferences(ctx.user.id);
      const property = await db.getPropertyById(input.propertyId);
      if (!property) throw new TRPCError({ code: "NOT_FOUND" });
      if (!prefs) return { score: 0, weights: [] };
      // Activity signals: viewing/saving other properties in the same location or of the same
      // type adds a modest affinity boost to the match score.
      const activity = await db.getUserActivity(ctx.user.id, undefined, 50);
      const activityPropertyIds = activity.map((a) => a.propertyId).filter((id): id is number => !!id);
      let affinityBoost = 0;
      if (activityPropertyIds.length > 0) {
        const related = await Promise.all(activityPropertyIds.slice(0, 10).map((id) => db.getPropertyById(id)));
        const norm = (s: string) => String(s || "").toLowerCase();
        const locMatch = related.some(
          (p) => p && (norm(property.location).includes(norm(p.location)) || norm(p.location).includes(norm(property.location))),
        );
        const typeMatch = related.some((p) => p && p.propertyType === property.propertyType);
        if (locMatch) affinityBoost += 5;
        if (typeMatch) affinityBoost += 3;
      }
      const types = prefs.preferredTypes ? (JSON.parse(JSON.stringify(prefs.preferredTypes)) as string[]) : [];
      const locs = prefs.preferredLocations ? (JSON.parse(JSON.stringify(prefs.preferredLocations)) as string[]) : [];
      // Blend in the activity-based affinity boost, capped at 100
      const base = computeMatchScore(
        { price: property.price, bedrooms: property.bedrooms, propertyType: property.propertyType, listingType: property.listingType, location: property.location },
        { budgetMin: prefs.budgetMin ?? null, budgetMax: prefs.budgetMax ?? null, minBedrooms: prefs.minBedrooms ?? null, listingType: prefs.listingType ?? null, preferredTypes: types, preferredLocations: locs },
      );
      return { ...base, score: Math.min(100, (base.score ?? 0) + affinityBoost) };
    }),

  // ── Recommendations ("Picked for You") ──────────────────────────────────────
  recommendations: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(24).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 8;
      const prefs = await db.getUserPreferences(ctx.user.id);
      const favorites = await db.getFavoriteProperties(ctx.user.id);
      const favTypes = Array.from(new Set(favorites.map((f) => f.propertyType).filter(Boolean)));
      const favLocs = Array.from(new Set(favorites.map((f) => f.location).filter(Boolean)));
      const types =
        (prefs?.preferredTypes ? (JSON.parse(JSON.stringify(prefs.preferredTypes)) as string[]) : favTypes).length > 0
          ? (prefs?.preferredTypes ? (JSON.parse(JSON.stringify(prefs.preferredTypes)) as string[]) : favTypes)
          : undefined;
      const loc = prefs?.preferredLocations
        ? (JSON.parse(JSON.stringify(prefs.preferredLocations)) as string[])[0]
        : favLocs[0];
      const { items } = await db.getProperties({
        status: "approved",
        limit: 60,
        ...(loc ? { location: loc } : {}),
        ...(types && types.length ? { propertyType: types[0] } : {}),
        ...(prefs?.budgetMax ? { maxPrice: prefs.budgetMax } : {}),
        ...(prefs?.budgetMin ? { minPrice: prefs.budgetMin } : {}),
      });
      const favIds = new Set(favorites.map((f) => f.id));
      const ranked = items.filter((i) => !favIds.has(i.id));
      return { items: ranked.slice(0, limit) };
    }),

  // ── Activity tracking ───────────────────────────────────────────────────────
  recordActivity: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        eventType: z.enum(["view", "save", "search"]),
        keywords: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.recordPropertyActivity({
        userId: ctx.user.id,
        propertyId: input.propertyId,
        eventType: input.eventType,
        keywords: input.keywords ? JSON.stringify(input.keywords) : null,
      } as any);
      return { success: true };
    }),

  // ── AI Property Assistant ───────────────────────────────────────────────────
  aiAssistant: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ask the LLM to parse the natural-language query into structured filters.
      const parseResp = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You parse natural-language property search queries from buyers in Kenya into structured filters. Property types are: house, apartment, villa, land, commercial, townhouse, studio, penthouse. Listing types are: sale, rent. Locations are Kenyan cities/counties (e.g., Nairobi, Kisumu, Mombasa, Migori, Nakuru, Eldoret, Machakos). Return JSON.",
          },
          { role: "user", content: input.message },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "search_filters",
            strict: true,
            schema: {
              type: "object",
              properties: {
                location: { type: "string", description: "City/area mentioned, empty string if none" },
                propertyType: { type: "string", description: "Property type or empty string" },
                listingType: { type: "string", description: "sale or rent or any" },
                minBedrooms: { type: "integer", description: "Minimum bedrooms, 0 if not mentioned" },
                maxPrice: { type: "integer", description: "Maximum budget in KES, 0 if not mentioned" },
                summary: { type: "string", description: "Short confirmation of what the buyer asked for" },
              },
              required: ["location", "propertyType", "listingType", "minBedrooms", "maxPrice", "summary"],
              additionalProperties: false,
            },
          },
        },
      });
      const parsed = JSON.parse((parseResp as any).choices?.[0]?.message?.content || "{}");
      const filters: any = { status: "approved", limit: 12 };
      if (parsed.location) filters.location = parsed.location;
      if (parsed.propertyType) filters.propertyType = parsed.propertyType;
      if (parsed.listingType && parsed.listingType !== "any") filters.listingType = parsed.listingType;
      if (parsed.minBedrooms > 0) filters.bedrooms = parsed.minBedrooms;
      if (parsed.maxPrice > 0) filters.maxPrice = parsed.maxPrice;
      const { items, total } = await db.getProperties(filters);
      return { summary: parsed.summary, filters, results: items, total };
    }),

  // ── Alerts ──────────────────────────────────────────────────────────────────
  alertCreate: protectedProcedure
    .input(
      z.object({
        type: z.enum(["instant", "priceDrop"]),
        propertyId: z.number().nullable(),
        criteria: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.createAlert({
        userId: ctx.user.id,
        type: input.type,
        propertyId: input.propertyId,
        criteria: input.criteria ? JSON.stringify(input.criteria) : null,
      } as any);
      return { success: true };
    }),
  alertList: protectedProcedure.query(async ({ ctx }) => {
    return db.getUserAlerts(ctx.user.id);
  }),
  alertDelete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteAlert(input.id, ctx.user.id);
      return { success: true };
    }),
  alertToggle: protectedProcedure
    .input(z.object({ id: z.number(), active: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.updateAlertStatus(input.id, ctx.user.id, input.active);
      return { success: true };
    }),
  checkPriceDrops: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const drops = await db.checkPriceDrops();
    return { drops };
  }),

  // ── Viewing bookings ────────────────────────────────────────────────────────
  bookingCreate: protectedProcedure
    .input(
      z.object({
        propertyId: z.number(),
        scheduledAt: z.number().min(Date.now()),
        type: z.enum(["virtual", "physical"]),
        notes: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || property.status !== "approved") throw new TRPCError({ code: "NOT_FOUND" });
      if (input.scheduledAt < Date.now()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Viewings cannot be scheduled in the past" });
      }
      await db.createViewingBooking({
        propertyId: input.propertyId,
        buyerId: ctx.user.id,
        scheduledAt: new Date(input.scheduledAt),
        type: input.type,
        notes: input.notes ?? null,
      } as any);
      await db.createAccountNotification({
        userId: property.userId,
        type: "viewing_request",
        title: "New viewing request",
        message: `${ctx.user.name || "A buyer"} requested a ${input.type} viewing for ${property.title}.`,
        href: "/seller/viewings",
      } as any);
      return { success: true };
    }),
  myBookings: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.getBuyerBookings(ctx.user.id);
    return rows.map((b) => ({ ...b, scheduledAt: b.scheduledAt.getTime() }));
  }),
  bookingUpdate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ok = await db.updateBookingStatus(input.id, ctx.user.id, input.status);
      if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
      return { success: true };
    }),
  sellerBookings: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db.getSellerPendingBookings(ctx.user.id);
    return rows.map((b) => ({ ...b, scheduledAt: b.scheduledAt.getTime() }));
  }),
  sellerBookingUpdate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const rows = await db.getSellerPendingBookings(ctx.user.id);
      const match = rows.find((b) => b.id === input.id);
      if (!match) throw new TRPCError({ code: "NOT_FOUND" });
      await db.updateBookingStatusBySeller(input.id, input.status);
      const property = await db.getPropertyById(match.propertyId);
      await db.createAccountNotification({
        userId: match.buyerId,
        type: "viewing_update",
        title: "Viewing status updated",
        message: `${property?.title || "Your property viewing"} is now ${input.status}.`,
        href: "/bookings",
      } as any);
      return { success: true };
    }),
  buyerInfo: protectedProcedure
    .input(z.object({ buyerId: z.number() }))
    .query(async ({ ctx, input }) => {
      const rows = await db.getSellerPendingBookings(ctx.user.id);
      const match = rows.find((b) => b.id && b.buyerId === input.buyerId);
      if (!match) {
        const byId = rows.find((b) => b.buyerId === input.buyerId);
        if (!byId) throw new TRPCError({ code: "NOT_FOUND" });
      }
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const users = await dbInstance.select().from(usersTable).where(eq(usersTable.id, input.buyerId)).limit(1);
      const u = users[0];
      if (!u) throw new TRPCError({ code: "NOT_FOUND" });
      return { id: u.id, name: u.name, phone: u.phone ?? null, email: u.email ?? null };
    }),

  // ── Property score ──────────────────────────────────────────────────────────
  propertyScore: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(async ({ ctx, input }) => {
      let score = await db.getPropertyScore(input.propertyId);
      if (!score) {
        const property = await db.getPropertyById(input.propertyId);
        if (!property) throw new TRPCError({ code: "NOT_FOUND" });
        const computed = computePropertyScore({
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          amenities: typeof property.amenities === "string" ? property.amenities : null,
          location: property.location,
          featured: property.featured,
        });
        await db.upsertPropertyScore(input.propertyId, computed as any);
        score = await db.getPropertyScore(input.propertyId);
      }
      return score;
    }),
  propertyScoreCompute: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property) throw new TRPCError({ code: "NOT_FOUND" });
      const computed = computePropertyScore({
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        amenities: typeof property.amenities === "string" ? property.amenities : null,
        location: property.location,
        featured: property.featured,
      });
      await db.upsertPropertyScore(input.propertyId, computed as any);
      return computed;
    }),

  // ── Nearby points of interest ───────────────────────────────────────────────
  nearbyPois: publicProcedure
    .input(
      z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        category: z.enum(["school", "hospital", "shopping_mall", "transit_station", "restaurant", "park"]),
        radius: z.number().min(100).max(50000).optional(),
      }),
    )
    .query(async ({ input }) => {
      const { makeRequest } = await import("./_core/map");
      try {
        const result = (await makeRequest("/maps/api/place/nearbysearch/json", {
          location: `${input.lat},${input.lng}`,
          radius: input.radius ?? 3000,
          type: input.category,
        })) as { results?: Array<{ name: string; rating?: number; geometry?: { location: { lat: number; lng: number } }; vicinity?: string }> };
        const results = (result?.results || []) as Array<{
          name: string;
          rating?: number;
          geometry?: { location: { lat: number; lng: number } };
          vicinity?: string;
        }>;
        return results.slice(0, 12).map((r) => ({
          name: r.name,
          rating: r.rating ?? null,
          vicinity: r.vicinity ?? null,
          lat: r.geometry?.location?.lat ?? null,
          lng: r.geometry?.location?.lng ?? null,
        }));
      } catch {
        return [];
      }
    }),
});



export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Profile ────────────────────────────────────────────────────────────

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserById(ctx.user.id);
    }),
    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          location: z.string().optional(),
          bio: z.string().optional(),
          profilePicture: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        // Return updated user
        const updated = await db.getUserById(ctx.user.id);
        return { success: true, user: updated };
      }),
    uploadPicture: protectedProcedure
      .input(z.object({ fileName: z.string(), contentType: z.string(), data: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const bytes = Buffer.from(input.data, "base64");
        const key = `profile-pictures/${ctx.user.id}/${Date.now()}-${input.fileName}`;
        const result = await storagePut(key, bytes, input.contentType);
        // Update user profile picture
        await db.updateUserProfile(ctx.user.id, { profilePicture: result.url });
        const updated = await db.getUserById(ctx.user.id);
        return { url: result.url, user: updated };
      }),
  }),

  // ─── Properties ──────────────────────────────────────────────────────────

  property: router({
    list: publicProcedure
      .input(
        z
          .object({
            location: z.string().optional(),
            propertyType: z.string().optional(),
            listingType: z.string().optional(),
            minPrice: z.number().optional(),
            maxPrice: z.number().optional(),
            bedrooms: z.number().optional(),
            bathrooms: z.number().optional(),
            page: z.number().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.getProperties({ ...input, status: "approved" });
      }),

    featured: publicProcedure.query(async () => {
      return db.getFeaturedProperties();
    }),

    latest: publicProcedure.query(async () => {
      return db.getLatestProperties(8);
    }),

    byId: publicProcedure.input(z.number()).query(async ({ input }) => {
      const property = await db.getPropertyById(input);
      if (!property) return null;
      await db.incrementPropertyViews(input);
      return property;
    }),

    photos: publicProcedure.input(z.number()).query(async ({ input }) => {
      return db.getPropertyPhotos(input);
    }),

    seller: publicProcedure.input(z.number()).query(async ({ input }) => {
      const property = await db.getPropertyById(input);
      if (!property) return null;
      return db.getUserById(property.userId);
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(3),
          description: z.string().min(10),
          price: z.number().min(0),
          location: z.string().min(2),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          propertyType: z.enum([
            "house",
            "apartment",
            "villa",
            "land",
            "commercial",
            "townhouse",
            "studio",
            "penthouse",
          ]),
          listingType: z.enum(["sale", "rent"]),
          bedrooms: z.number().default(0),
          bathrooms: z.number().default(0),
          landSize: z.number().optional(),
          floorArea: z.number().optional(),
          amenities: z.array(z.string()).optional(),
          photos: z
            .array(z.object({ fileKey: z.string(), url: z.string(), is360: z.boolean().optional() }))
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createProperty({
          ...input,
          userId: ctx.user.id,
          status: "pending",
        });
        if (input.photos && input.photos.length > 0) {
          const propertyId = result[0].insertId;
          for (let i = 0; i < input.photos.length; i++) {
            await db.createPropertyPhoto({
              propertyId,
              url: input.photos[i].url,
              fileKey: input.photos[i].fileKey,
              sortOrder: i,
              is360: input.photos[i].is360 ? 1 : 0,
            });
          }
        }
        return { id: result[0].insertId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(3),
          description: z.string().min(10),
          price: z.number().min(0),
          location: z.string().min(2),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
          propertyType: z.enum([
            "house",
            "apartment",
            "villa",
            "land",
            "commercial",
            "townhouse",
            "studio",
            "penthouse",
          ]),
          listingType: z.enum(["sale", "rent"]),
          bedrooms: z.number().default(0),
          bathrooms: z.number().default(0),
          landSize: z.number().optional(),
          floorArea: z.number().optional(),
          amenities: z.array(z.string()).optional(),
          photos: z
            .array(z.object({ fileKey: z.string(), url: z.string(), is360: z.boolean().optional() }))
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.id);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const { id: _id, photos: _photos, ...updateData } = input;
        await db.updateProperty(input.id, updateData);
        if (input.photos) {
          await db.deleteAllPropertyPhotos(input.id);
          for (let i = 0; i < input.photos.length; i++) {
            await db.createPropertyPhoto({
              propertyId: input.id,
              url: input.photos[i].url,
              fileKey: input.photos[i].fileKey,
              sortOrder: i,
              is360: input.photos[i].is360 ? 1 : 0,
            });
          }
        }
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.deleteProperty(input);
        return { success: true };
      }),

    myProperties: protectedProcedure.query(async ({ ctx }) => {
      const properties = await db.getUserProperties(ctx.user.id);
      return Promise.all(
        properties.map(async (p) => {
          const photos = await db.getPropertyPhotos(p.id);
          const inqCount = await db.getPropertyInquiries(p.id);
          return { ...p, photos, inquiriesCount: inqCount.length };
        })
      );
    }),
  }),

  // ─── Admin Property ──────────────────────────────────────────────────────

  admin: router({
    stats: adminProcedure.query(async () => {
      return db.getDashboardStats();
    }),

    pendingProperties: adminProcedure.query(async () => {
      const props = await db.getPendingProperties();
      return Promise.all(
        props.map(async (p) => {
          const photos = await db.getPropertyPhotos(p.id);
          const user = await db.getUserById(p.userId);
          return { ...p, photos, seller: user };
        })
      );
    }),

    allProperties: adminProcedure
      .input(
        z
          .object({
            page: z.number().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.getProperties({ page: input?.page, limit: input?.limit });
      }),

    approveProperty: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.approveProperty(input);
        const property = await db.getPropertyById(input);
        await sendApprovalNotification(property?.title || "Property", input);
        if (property) {
          const computed = computePropertyScore({
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            amenities: typeof property.amenities === "string" ? property.amenities : null,
            location: property.location,
            featured: property.featured,
          });
          await db.upsertPropertyScore(input, computed as any).catch(() => undefined);
        }
        return { success: true };
      }),

    rejectProperty: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const property = await db.getPropertyById(input);
        await db.rejectProperty(input);
        await sendRejectionNotification(property?.title || "Property", input);
        return { success: true };
      }),

    allUsers: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),

    deleteUser: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteUser(input);
        return { success: true };
      }),

    allInquiries: adminProcedure.query(async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) return [];
      const allProps = await db.getProperties({});
      const allInquiries = [];
      for (const p of allProps.items) {
        const inq = await db.getPropertyInquiries(p.id);
        if (inq.length > 0) {
          const prop = await db.getPropertyById(p.id);
          allInquiries.push(
            ...inq.map((i) => ({ ...i, propertyTitle: prop?.title || "" }))
          );
        }
      }
      return allInquiries;
    }),

    testimonials: adminProcedure.query(async () => {
      return db.getTestimonials();
    }),

    addTestimonial: adminProcedure
      .input(
        z.object({
          name: z.string().min(2),
          role: z.string().optional(),
          content: z.string().min(10),
          rating: z.number().min(1).max(5).default(5),
          featured: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        await db.createTestimonial(input);
        return { success: true };
      }),

    deleteTestimonial: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteTestimonial(input);
        return { success: true };
      }),

    blogPosts: adminProcedure.query(async () => {
      return db.getAllBlogPosts();
    }),

    blogPostBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return db.getBlogPostBySlug(input);
      }),

    createBlogPost: adminProcedure
      .input(
        z.object({
          title: z.string().min(3),
          slug: z.string().min(3),
          excerpt: z.string().optional(),
          content: z.string().min(10),
          coverImage: z.string().optional(),
          published: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        await db.createBlogPost(input);
        return { success: true };
      }),

    updateBlogPost: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(3),
          slug: z.string().min(3),
          excerpt: z.string().optional(),
          content: z.string().min(10),
          coverImage: z.string().optional(),
          published: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateBlogPost(id, data);
        return { success: true };
      }),

    deleteBlogPost: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteBlogPost(input);
        return { success: true };
      }),

    categories: adminProcedure.query(async () => {
      return db.getCategories();
    }),

    createCategory: adminProcedure
      .input(
        z.object({
          name: z.string().min(2),
          slug: z.string().min(2),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await db.createCategory(input);
        return { success: true };
      }),

    deleteCategory: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deleteCategory(input);
        return { success: true };
      }),
  }),

  // ─── Inquiries ───────────────────────────────────────────────────────────

  inquiry: router({
    create: publicProcedure
      .input(
        z.object({
          propertyId: z.number(),
          name: z.string().min(2),
          email: z.string().email(),
          phone: z.string().optional(),
          message: z.string().min(10),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        await db.createInquiry({
          ...input,
          userId: ctx.user?.id || null,
        });
        // Increment inquiry count on property
        await db.updateProperty(input.propertyId, {
          inquiriesCount: (property.inquiriesCount || 0) + 1,
        });
        await db.createAccountNotification({
          userId: property.userId,
          type: "inquiry",
          title: "New buyer inquiry",
          message: `${input.name} sent an inquiry about ${property.title}.`,
          href: "/leads",
        } as any);
        await sendInquiryNotification(property.title, input.name, input.email, input.message);
        return { success: true };
      }),

    forProperty: protectedProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return db.getPropertyInquiries(input);
      }),

    myInquiries: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserInquiries(ctx.user.id);
    }),
  }),

  // ─── Favorites ───────────────────────────────────────────────────────────

  favorite: router({
    toggle: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        return db.toggleFavorite(ctx.user.id, input);
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getFavoriteProperties(ctx.user.id);
    }),

    check: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        return db.isFavorite(ctx.user.id, input);
      }),
  }),

  // ─── File Upload ─────────────────────────────────────────────────────────

  upload: protectedProcedure
    .input(
      z.object({
        file: z.string(), // base64 encoded file
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fileBuffer = Buffer.from(input.file, "base64");
      const ext = input.fileName.split(".").pop() || "jpg";
      const fileKey = `property-photos/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { key, url } = await storagePut(
        fileKey,
        fileBuffer,
        input.contentType
      );
      return { key, url };
    }),

  // ─── Public Pages ────────────────────────────────────────────────────────

  public: router({
    testimonials: publicProcedure.query(async () => {
      return db.getFeaturedTestimonials();
    }),
    allTestimonials: publicProcedure.query(async () => {
      return db.getTestimonials();
    }),
    blogPosts: publicProcedure.query(async () => {
      return db.getPublishedBlogPosts();
    }),
    blogPostBySlug: publicProcedure
      .input(z.string())
      .query(async ({ input }) => {
        return db.getBlogPostBySlug(input);
    }),
    categories: publicProcedure.query(async () => {
      return db.getCategories();
    }),
  }),

  // ─── Testimonial (public) ────────────────────────────────────────────────

  testimonial: router({
    list: publicProcedure.query(async () => {
      return db.getFeaturedTestimonials();
    }),
  }),

  // ─── Blog (public) ───────────────────────────────────────────────────────

  blog: router({
    list: publicProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            category: z.string().optional(),
            page: z.number().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.getPublishedBlogPosts(input);
      }),

    bySlug: publicProcedure.input(z.string()).query(async ({ input }) => {
      return db.getBlogPostBySlug(input);
    }),

    categories: publicProcedure.query(async () => {
      return db.getCategories();
    }),
  }),

  // ─── Premium / Subscription ─────────────────────────────────────────────

  subscription: router({
    plans: publicProcedure.query(async () => {
      return db.getSubscriptionPlans();
    }),

    mySubscription: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSubscription(ctx.user.id);
    }),

    isPremium: protectedProcedure.query(async ({ ctx }) => {
      return { isPremium: await db.isUserPremium(ctx.user.id) || ctx.user.role === "admin" };
    }),

    subscribe: protectedProcedure
      .input(z.object({ planId: z.number(), method: z.enum(["mpesa", "card", "bank_transfer"]).default("mpesa") }))
      .mutation(async ({ ctx, input }) => {
        const plan = await db.getSubscriptionPlanById(input.planId);
        if (!plan || !plan.active) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

        // Create payment record (simulated payment — M-Pesa/Card handled offline by admin in MVP)
        const payment = await db.createPaymentRecord({
          userId: ctx.user.id,
          amount: plan.price,
          currency: plan.currency,
          method: input.method,
          status: "completed",
          type: "subscription",
          description: `${plan.name} plan - ${plan.period} subscription`,
        });

        // Create subscription with correct end date
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (plan.period === "annual" ? 12 : 1));
        const sub = await db.createSubscriptionRecord({
          userId: ctx.user.id,
          planId: input.planId,
          endDate,
        });
        if (!sub) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create subscription" });

        return { subscription: sub.subscription, plan: sub.plan, payment };
      }),

    cancel: protectedProcedure
      .input(z.object({ subscriptionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const sub = await db.getSubscriptionById(input.subscriptionId);
        if (!sub || sub.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your subscription" });
        }
        await db.cancelSubscriptionRecord(input.subscriptionId);
        return { success: true };
      }),

    paymentHistory: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPayments(ctx.user.id);
    }),

    featuredListings: protectedProcedure.query(async ({ ctx }) => {
      const listings = await db.getUserFeaturedListings(ctx.user.id);
      return Promise.all(
        listings.map(async (l) => {
          const property = await db.getPropertyById(l.propertyId);
          return { ...l, propertyTitle: property?.title || "Deleted property" };
        })
      );
    }),

    featureProperty: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        duration: z.enum(["7_days", "14_days", "30_days"]).default("30_days"),
        paymentMethod: z.enum(["mpesa", "card"]).default("mpesa"),
      }))
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your property" });
        }
        const existing = await db.getActiveFeaturedListingForProperty(input.propertyId);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "This property is already featured. Wait until it expires or deactivate it first." });
        }

        const days = input.duration === "7_days" ? 7 : input.duration === "14_days" ? 14 : 30;
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + days);

        const amount = days === 7 ? 500 : days === 14 ? 900 : 1500;
        const payment = await db.createPaymentRecord({
          userId: ctx.user.id,
          propertyId: input.propertyId,
          amount,
          currency: "KES",
          method: input.paymentMethod,
          status: "completed",
          type: "featured_listing",
          description: `Featured listing - ${days} days`,
        });

        const featured = await db.createFeaturedListingRecord({
          propertyId: input.propertyId,
          userId: ctx.user.id,
          paymentId: payment?.id,
          featuredUntil,
          active: true,
        });

        return { featured, payment };
      }),
  }),

  // ─── Listing Analytics (Premium) ──────────────────────────────────────────

  analytics: router({
    allStats: protectedProcedure.query(async ({ ctx }) => {
      const myProps = await db.getUserProperties(ctx.user.id);
      return Promise.all(
        myProps.map(async (p) => {
          const saves = await db.countPropertySaves(p.id);
          return {
            propertyId: p.id,
            title: p.title,
            views: p.viewsCount || 0,
            inquiries: p.inquiriesCount || 0,
            saves,
            status: p.status,
          };
        })
      );
    }),

    propertyStats: protectedProcedure
      .input(z.number())
      .query(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your property" });
        }
        const saves = await db.countPropertySaves(input);
        const recentInquiries = await db.getPropertyInquiries(input);
        const last7Days = recentInquiries.filter((i) => {
          const diff = Date.now() - new Date(i.createdAt).getTime();
          return diff <= 7 * 24 * 60 * 60 * 1000;
        });
        return {
          propertyId: input,
          views: property.viewsCount || 0,
          inquiries: property.inquiriesCount || 0,
          saves,
          recentInquiriesCount: last7Days.length,
        };
      }),
  }),

  // ─── AI Tools (Premium) ──────────────────────────────────────────────────

  ai: router({
    generateDescription: protectedProcedure
      .input(z.object({
        propertyType: z.string(),
        listingType: z.string(),
        location: z.string(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        price: z.number().optional(),
        features: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isPremium = await db.isUserPremium(ctx.user.id);
        if (!isPremium && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "AI description generation requires a Premium subscription. Upgrade to unlock!" });
        }
        const prompt = `Generate a professional real estate listing description for a property listed for ${input.listingType}. Property type: ${input.propertyType}. Location: ${input.location}. Bedrooms: ${input.bedrooms !== undefined ? input.bedrooms : "N/A"}. Bathrooms: ${input.bathrooms !== undefined ? input.bathrooms : "N/A"}. Price: ${input.price ? `KES ${input.price.toLocaleString()}` : "Contact for price"}. Features: ${input.features || "Various amenities"}. Write a compelling 2-3 paragraph description suitable for a real estate listing website. Engaging and professional.`;
        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
          });
          const content = response.choices?.[0]?.message?.content;
          let description: string;
          if (Array.isArray(content)) {
            description = content.map((c: any) => (c.type === "text" ? c.text : "")).join("");
          } else if (typeof content === "string") {
            description = content;
          } else {
            description = "Could not generate description.";
          }
          return { description: description.trim() };
        } catch (error) {
          console.error("[AI] Description generation failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate AI description. Please try again." });
        }
      }),

    recommendPrice: protectedProcedure
      .input(z.object({
        propertyType: z.string(),
        listingType: z.string(),
        location: z.string(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
        landSize: z.number().optional(),
        floorArea: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const isPremium = await db.isUserPremium(ctx.user.id);
        if (!isPremium && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "AI price recommendations require a Premium subscription." });
        }
        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: `Provide a recommended sale price in Kenyan Shillings (KES) for this property: ${input.listingType}, ${input.propertyType} in ${input.location}. Bedrooms: ${input.bedrooms !== undefined ? input.bedrooms : "N/A"}. Bathrooms: ${input.bathrooms !== undefined ? input.bathrooms : "N/A"}. Land size: ${input.landSize ? `${input.landSize} sq meters` : "N/A"}. Floor area: ${input.floorArea ? `${input.floorArea} sq meters` : "N/A"}. Consider typical Kenyan market rates. Return ONLY a JSON object: {"recommendedPrice": number, "lowEstimate": number, "highEstimate": number, "reasoning": "string"}` }],
          });
          const content = response.choices?.[0]?.message?.content;
          let text: string;
          if (Array.isArray(content)) {
            text = content.map((c: any) => (c.type === "text" ? c.text : "")).join("");
          } else if (typeof content === "string") {
            text = content;
          } else {
            text = "{}";
          }
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          let parsed: any;
          try {
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
          } catch {
            parsed = { recommendedPrice: 0, reasoning: "Could not parse price recommendation." };
          }
          return parsed;
        } catch (error) {
          console.error("[AI] Price recommendation failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to generate price recommendation. Please try again." });
        }
      }),
  }),

  // ─── Property Videos (Premium) ───────────────────────────────────────────

  propertyVideo: router({
    list: publicProcedure.input(z.number()).query(async ({ input }) => {
      return db.getPropertyVideos(input);
    }),

    upload: protectedProcedure
      .input(z.object({
        propertyId: z.number(),
        fileName: z.string(),
        contentType: z.string(),
        data: z.string(), // base64
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify ownership
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your property" });
        }
        // Check premium limit
        const maxVideos = await db.getUserMaxVideos(ctx.user.id);
        const existing = await db.getPropertyVideos(input.propertyId);
        if (existing.length >= maxVideos) {
          throw new TRPCError({ code: "FORBIDDEN", message: `Video upload limit reached (${maxVideos}). Upgrade to Premium for more videos.` });
        }
        const bytes = Buffer.from(input.data, "base64");
        const ext = input.fileName.split(".").pop() || "mp4";
        const key = `property-videos/${input.propertyId}/${Date.now()}.${ext}`;
        const { url } = await storagePut(key, bytes, input.contentType);
        return db.addPropertyVideo({
          propertyId: input.propertyId,
          url,
          fileKey: key,
        });
      }),

    delete: protectedProcedure
      .input(z.number())
      .mutation(async ({ ctx, input }) => {
        const video = await db.getPropertyVideoById(input);
        if (!video) throw new TRPCError({ code: "NOT_FOUND", message: "Video not found" });
        const property = await db.getPropertyById(video.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not your property" });
        }
        await db.deletePropertyVideoRecord(input);
        return { success: true };
      }),
  }),

  // ─── Admin: Premium Management ────────────────────────────────────────────

  adminPremium: router({
    plans: adminProcedure.query(async () => db.getSubscriptionPlans()),
    revenue: adminProcedure.query(async () => db.getSubscriptionRevenue()),
    allSubscriptions: adminProcedure.query(async () => db.getAllSubscriptions()),
    updatePlan: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        price: z.number().optional(),
        maxImages: z.number().optional(),
        maxVideos: z.number().optional(),
        active: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const existingPlan = await db.getSubscriptionPlanById(input.id);
        if (!existingPlan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });
        await db.updateSubscriptionPlan(input.id, input);
        return { success: true };
      }),
    verifyUser: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        return db.grantPremiumSubscription(input.userId);
      }),
    deactivateFeatured: adminProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        await db.deactivateFeaturedListingRecord(input);
        return { success: true };
      }),
    allFeatured: adminProcedure.query(async () => {
      const listings = await db.getAllFeaturedListings();
      return Promise.all(
        listings.map(async (l) => {
          const property = await db.getPropertyById(l.propertyId);
          return { ...l, propertyTitle: property?.title || "Deleted property" };
        })
      );
    }),
  }),

  // ─── Agency ─────────────────────────────────────────────────────────────

  agency: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getAgencyProfile(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        agencyName: z.string().min(2),
        description: z.string().optional(),
        website: z.string().url().optional(),
        socialMedia: z.record(z.string(), z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getAgencyProfile(ctx.user.id);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Agency profile already exists" });
        await db.createAgencyProfileRecord({ userId: ctx.user.id, ...input });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        agencyName: z.string().min(2).optional(),
        description: z.string().optional(),
        website: z.string().url().optional(),
        socialMedia: z.record(z.string(), z.string()).optional(),
        logoUrl: z.string().optional(),
        bannerUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateAgencyProfileRecord(ctx.user.id, input);
        return { success: true };
      }),

    uploadAsset: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        contentType: z.string(),
        data: z.string(),
        assetType: z.enum(["logo", "banner"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const bytes = Buffer.from(input.data, "base64");
        const key = `agency-assets/${ctx.user.id}/${input.assetType}-${Date.now()}.${input.fileName.split(".").pop() || "png"}`;
        const { url } = await storagePut(key, bytes, input.contentType);
        await db.updateAgencyProfileRecord(ctx.user.id,
          input.assetType === "logo" ? { logoUrl: url } : { bannerUrl: url }
        );
        return { url };
      }),
  }),
  // ─── Modern (AI assistant, recommendations, alerts, bookings, scores) ──────
  modern: modernRouter,
  // ─── Leads (agent inquiry management) ────────────────────────────────────────
  leads: router({
    myLeads: protectedProcedure.query(async ({ ctx }) => {
      return db.getSellerLeads(ctx.user.id);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getLeadStats(ctx.user.id);
    }),
    updateStatus: protectedProcedure
      .input(z.object({
        leadId: z.number(),
        status: z.enum(["new", "contacted", "viewing", "negotiating", "closed", "lost"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const ok = await db.updateLeadStatus(input.leadId, ctx.user.id, input.status);
        if (!ok) throw new TRPCError({ code: "NOT_FOUND" });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
