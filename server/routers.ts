import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { sendInquiryNotification, sendApprovalNotification, sendRejectionNotification } from "./notifications";
import { storageGetSignedUrl, storagePut } from "./storage";
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
import { calculatePlanningAnalysis, planningAnalysisKinds } from "../shared/planning";
import { randomUUID } from "node:crypto";
import { consumeRateLimit, getClientAddress, logSecurityEvent } from "./_core/security";
import { decodeAndValidateUpload, SAFE_DOCUMENT_TYPES, SAFE_IMAGE_TYPES, SAFE_VIDEO_TYPES } from "./_core/uploadSecurity";

function enforceOperationRateLimit(
  ctx: { req: any; user: { id: number } | null },
  scope: string,
  limit: number,
  windowMs: number,
) {
  const subject = ctx.user ? `user:${ctx.user.id}` : `ip:${getClientAddress(ctx.req)}`;
  const result = consumeRateLimit(`${scope}:${subject}`, limit, windowMs);
  if (result.allowed) return;
  logSecurityEvent("rate_limit.blocked", ctx.req, { scope, authenticated: Boolean(ctx.user) });
  throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many ${scope} requests. Please try again later.` });
}

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
        history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(800) })).max(6).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      enforceOperationRateLimit(ctx, "ai_assistant", 30, 60 * 60 * 1000);
      const firstName = ctx.user.name?.trim().split(/\s+/)[0]?.slice(0, 60) || "there";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              `You are Nyumba 360 AI, a warm, helpful general assistant and Kenyan property guide. The signed-in client is named ${firstName}. You may use only this first name for a natural greeting or an optional, respectful check-in such as “How are you feeling today, ${firstName}?” Do not claim to know their emotions, disclose profile data, ask for sensitive information, or repeat their name excessively. You can answer ordinary everyday questions, explain concepts, brainstorm, write, and converse naturally, in addition to helping with property searches in Kenya. For health, legal, financial, or other high-stakes questions, give general educational information, avoid diagnosis or personalised instructions, and encourage appropriate qualified support when needed. Classify as property_search only when the client is clearly requesting homes, land, rentals, listings, or property recommendations. Otherwise classify as general. For property searches, parse only clearly expressed filters. Property types are house, apartment, villa, land, commercial, townhouse, studio, penthouse. Listing types are sale, rent, or any. Return JSON only.`,
          },
          ...(input.history ?? []).map((message) => ({ role: message.role, content: message.content })),
          { role: "user", content: input.message },
        ],
        model: "gpt-5-mini",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "nyumba_assistant_response",
            strict: true,
            schema: {
              type: "object",
              properties: {
                intent: { type: "string", enum: ["general", "property_search"] },
                reply: { type: "string", description: "Helpful, concise answer for the client" },
                location: { type: "string", description: "City/area mentioned, empty string if none" },
                propertyType: { type: "string", description: "Property type or empty string" },
                listingType: { type: "string", description: "sale or rent or any" },
                minBedrooms: { type: "integer", description: "Minimum bedrooms, 0 if not mentioned" },
                maxPrice: { type: "integer", description: "Maximum budget in KES, 0 if not mentioned" },
              },
              required: ["intent", "reply", "location", "propertyType", "listingType", "minBedrooms", "maxPrice"],
              additionalProperties: false,
            },
          },
        },
      });
      const parsed = JSON.parse((response as any).choices?.[0]?.message?.content || "{}");
      if (parsed.intent !== "property_search") {
        return { summary: parsed.reply || `Hi ${firstName}! How can I help today?`, filters: {}, results: [], total: 0, intent: "general" as const };
      }
      const filters: any = { status: "approved", limit: 12 };
      if (parsed.location) filters.location = parsed.location;
      if (parsed.propertyType) filters.propertyType = parsed.propertyType;
      if (parsed.listingType && parsed.listingType !== "any") filters.listingType = parsed.listingType;
      if (parsed.minBedrooms > 0) filters.bedrooms = parsed.minBedrooms;
      if (parsed.maxPrice > 0) filters.maxPrice = parsed.maxPrice;
      const { items, total } = await db.getProperties(filters);
      return { summary: parsed.reply || "Here are the listings that match your request.", filters, results: items, total, intent: "property_search" as const };
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
    .query(async ({ ctx, input }) => {
      enforceOperationRateLimit(ctx, "nearby_places", 12, 10 * 60 * 1000);
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
      .input(z.object({ fileName: z.string().trim().min(3).max(120), contentType: z.string().max(100), data: z.string().min(1).max(4_200_000) }))
      .mutation(async ({ ctx, input }) => {
        enforceOperationRateLimit(ctx, "profile_upload", 12, 60 * 60 * 1000);
        const { bytes, extension } = decodeAndValidateUpload({ ...input, allowedTypes: SAFE_IMAGE_TYPES, maxBytes: 3 * 1024 * 1024 });
        const key = `profile-pictures/${ctx.user.id}/${Date.now()}.${extension}`;
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
            location: z.string().trim().max(120).optional(),
            propertyType: z.string().optional(),
            listingType: z.string().optional(),
            minPrice: z.number().finite().min(0).max(10_000_000_000).optional(),
            maxPrice: z.number().finite().min(0).max(10_000_000_000).optional(),
            bedrooms: z.number().int().min(0).max(30).optional(),
            bathrooms: z.number().int().min(0).max(30).optional(),
            page: z.number().int().min(1).max(10_000).optional(),
            limit: z.number().int().min(1).max(50).optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return db.getPublicProperties(input ?? {});
      }),

    featured: publicProcedure.query(async () => {
      return db.getPublicFeaturedProperties();
    }),

    latest: publicProcedure.query(async () => {
      return db.getPublicLatestProperties(8);
    }),

    byId: publicProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
      if (ctx.user) {
        const privateProperty = await db.getPropertyById(input);
        if (
          privateProperty &&
          (ctx.user.role === "admin" || privateProperty.userId === ctx.user.id)
        ) {
          return privateProperty;
        }
      }
      const property = await db.getPublicPropertyById(input);
      if (!property) return null;
      await db.incrementPropertyViews(input);
      return property;
    }),

    photos: publicProcedure.input(z.number().int().positive()).query(async ({ ctx, input }) => {
      if (ctx.user) {
        const privateProperty = await db.getPropertyById(input);
        if (
          privateProperty &&
          (ctx.user.role === "admin" || privateProperty.userId === ctx.user.id)
        ) {
          return db.getPropertyPhotos(input);
        }
      }
      const publicPhotos = await db.getPublicPropertyPhotos(input);
      return publicPhotos ?? null;
    }),

    seller: publicProcedure.input(z.number().int().positive()).query(async ({ input }) => {
      const publicSeller = await db.getPublicSellerByPropertyId(input);
      return publicSeller ?? null;
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

    dashboardOverview: adminProcedure
      .input(z.object({ range: z.union([z.literal(7), z.literal(30), z.literal(90), z.literal(365)]).default(7) }).optional())
      .query(async ({ input }) => db.getAdminDashboardOverview(input?.range ?? 7)),

    commandCenter: adminProcedure
      .input(z.object({ query: z.string().trim().max(80).default("") }).optional())
      .query(async ({ input }) => db.getAdminCommandCenter(input?.query ?? "")),

    operationsHub: adminProcedure
      .input(z.object({ page: z.number().int().positive().default(1), limit: z.number().int().min(5).max(25).default(10) }).optional())
      .query(async ({ input }) => db.getAdminOperationsHub(input ?? {})),

    moderationQueue: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"), query: z.string().trim().max(80).default(""), page: z.number().int().positive().default(1), limit: z.number().int().min(5).max(25).default(10) }).optional())
      .query(async ({ input }) => db.getAdminModerationQueue(input ?? {})),

    agencyDirectory: adminProcedure
      .input(z.object({ verification: z.enum(["verified", "unverified", "all"]).default("all"), query: z.string().trim().max(80).default(""), page: z.number().int().positive().default(1), limit: z.number().int().min(5).max(25).default(10) }).optional())
      .query(async ({ input }) => db.getAdminAgencyDirectory(input ?? {})),

    setAgencyVerification: adminProcedure
      .input(z.object({ agencyId: z.number().int().positive(), verified: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const agency = await db.getAgencyProfileById(input.agencyId);
        if (!agency) throw new TRPCError({ code: "NOT_FOUND", message: "Agency profile not found" });
        await db.setAgencyVerification(input.agencyId, input.verified);
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: input.verified ? "agency.verify" : "agency.unverify", resourceType: "agency", resourceId: input.agencyId, metadata: { agencyUserId: agency.userId, verified: input.verified } });
        return { success: true };
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
      .mutation(async ({ ctx, input }) => {
        await db.approveProperty(input);
        const property = await db.getPropertyById(input);
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "moderation.approve", resourceType: "property", resourceId: input, propertyId: input, metadata: { status: "approved" } });
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
      .mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input);
        await db.rejectProperty(input);
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "moderation.reject", resourceType: "property", resourceId: input, propertyId: input, metadata: { status: "rejected" } });
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
          propertyId: z.number().int().positive(),
          name: z.string().trim().min(2).max(160),
          email: z.string().trim().toLowerCase().email().max(320),
          phone: z.string().trim().max(40).optional(),
          message: z.string().trim().min(10).max(2_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        enforceOperationRateLimit(ctx, "public_inquiry", 5, 30 * 60 * 1000);
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.status !== "approved") {
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
        logSecurityEvent("inquiry.created", ctx.req, { propertyId: input.propertyId, authenticated: Boolean(ctx.user) });
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

  // ─── Engagement: collections reference existing favourites only ─────────────
  collections: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getWishlistCollections(ctx.user.id)),
    create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(280).optional() })).mutation(async ({ ctx, input }) => {
      const collection = await db.createWishlistCollection({ ownerUserId: ctx.user.id, name: input.name, description: input.description || null });
      if (!collection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "wishlist_collection.create", resourceType: "wishlistCollection", resourceId: collection.id, propertyId: null, metadata: {} });
      return collection;
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().trim().min(2).max(120), description: z.string().trim().max(280).nullable().optional() })).mutation(async ({ ctx, input }) => {
      const collection = await db.getWishlistCollectionById(input.id);
      if (!collection || collection.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const updated = await db.updateWishlistCollection(collection.id, { name: input.name, ...(input.description !== undefined ? { description: input.description } : {}) });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "wishlist_collection.update", resourceType: "wishlistCollection", resourceId: collection.id, propertyId: null, metadata: {} });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const collection = await db.getWishlistCollectionById(input.id);
      if (!collection || collection.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const deleted = await db.deleteWishlistCollection(collection.id);
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "wishlist_collection.delete", resourceType: "wishlistCollection", resourceId: collection.id, propertyId: null, metadata: {} });
      return { success: true };
    }),
    addProperty: protectedProcedure.input(z.object({ collectionId: z.number().int().positive(), propertyId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const collection = await db.getWishlistCollectionById(input.collectionId);
      if (!collection || collection.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (!(await db.isFavorite(ctx.user.id, input.propertyId))) throw new TRPCError({ code: "BAD_REQUEST", message: "Only properties already saved to your favourites can be added to a collection." });
      await db.addWishlistCollectionItem({ collectionId: collection.id, propertyId: input.propertyId });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "wishlist_collection.add_property", resourceType: "wishlistCollection", resourceId: collection.id, propertyId: input.propertyId, metadata: {} });
      return { success: true };
    }),
    removeProperty: protectedProcedure.input(z.object({ collectionId: z.number().int().positive(), propertyId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const collection = await db.getWishlistCollectionById(input.collectionId);
      if (!collection || collection.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.removeWishlistCollectionItem(collection.id, input.propertyId);
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "wishlist_collection.remove_property", resourceType: "wishlistCollection", resourceId: collection.id, propertyId: input.propertyId, metadata: {} });
      return { success: true };
    }),
  }),

  // ─── Property identity: immutable ID, public resolution only for approved listings ──
  propertyIdentity: router({
    owned: protectedProcedure.query(async ({ ctx }) => {
      const properties = await db.getUserProperties(ctx.user.id);
      const identifiers = await db.getPropertyIdentifiersByPropertyIds(properties.map((property) => property.id));
      const byPropertyId = new Map(identifiers.map((identifier) => [identifier.propertyId, identifier]));
      return properties.map((property) => ({ property, identifier: byPropertyId.get(property.id) ?? null }));
    }),
    ensure: protectedProcedure.input(z.object({ propertyId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || (property.userId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const existing = await db.getPropertyIdentifierByPropertyId(property.id);
      if (existing) return existing;
      const locationToken = property.location?.match(/[A-Za-z]+/)?.[0]?.slice(0, 3).toUpperCase() || "KEN";
      const identifier = `N360-${locationToken}-${String(property.id).padStart(6, "0")}`;
      const record = await db.createPropertyIdentifier({ propertyId: property.id, identifier, createdByUserId: ctx.user.id });
      if (!record) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "property_identifier.create", resourceType: "propertyIdentifier", resourceId: record.id, propertyId: property.id, metadata: { identifier: record.identifier } });
      return record;
    }),
    lookup: publicProcedure.input(z.object({ identifier: z.string().trim().regex(/^N360-[A-Z]{3}-\d{6}$/) })).query(async ({ input }) => {
      const found = await db.getPublicPropertyByIdentifier(input.identifier);
      if (!found) throw new TRPCError({ code: "NOT_FOUND" });
      const { userId: _userId, ...publicProperty } = found.property;
      return { identifier: found.identifier, property: publicProperty };
    }),
  }),

  // ─── Referrals and rewards: explicit claims; earned points require an audit trail ──
  referralRewards: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      let profile = await db.getReferralProfile(ctx.user.id);
      if (!profile) {
        for (let attempt = 0; attempt < 3 && !profile; attempt += 1) {
          const code = `N360-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
          try { profile = await db.createReferralProfile(ctx.user.id, code); } catch { /* retry a statistically unique code */ }
        }
        if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create a referral code." });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "referral_profile.create", resourceType: "referralProfile", resourceId: profile.id, propertyId: null, metadata: {} });
      }
      return db.getReferralRewardsDashboard(ctx.user.id);
    }),
    claim: protectedProcedure.input(z.object({ referralCode: z.string().trim().toUpperCase().regex(/^N360-[A-Z0-9]{8}$/) })).mutation(async ({ ctx, input }) => {
      const existing = await db.getReferralClaimByReferredUserId(ctx.user.id);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "A referral code has already been claimed for this account." });
      const profile = await db.getReferralProfileByCode(input.referralCode);
      if (!profile || !profile.active || profile.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "This referral code cannot be applied." });
      const claim = await db.createReferralClaim({ referralProfileId: profile.id, referrerUserId: profile.userId, referredUserId: ctx.user.id, status: "pending" });
      if (!claim) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "referral_claim.create", resourceType: "referralClaim", resourceId: claim.id, propertyId: null, metadata: { referrerUserId: profile.userId } });
      return claim;
    }),
  }),

  // ─── Property sharing: public QR resolution is gated by an enabled record + approval ──
  propertySharing: router({
    owned: protectedProcedure.query(async ({ ctx }) => {
      const properties = await db.getUserProperties(ctx.user.id);
      const [identifiers, shares] = await Promise.all([
        db.getPropertyIdentifiersByPropertyIds(properties.map((property) => property.id)),
        db.getPropertyShareRecordsByPropertyIds(properties.map((property) => property.id)),
      ]);
      const identifiersByPropertyId = new Map(identifiers.map((identifier) => [identifier.propertyId, identifier]));
      const sharesByPropertyId = new Map(shares.map((share) => [share.propertyId, share]));
      return properties.map((property) => ({ property, identifier: identifiersByPropertyId.get(property.id) ?? null, share: sharesByPropertyId.get(property.id) ?? null }));
    }),
    ensure: protectedProcedure.input(z.object({ propertyId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || (property.userId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      if (property.status !== "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "Only approved listings can have public QR sharing." });
      let identifier = await db.getPropertyIdentifierByPropertyId(property.id);
      if (!identifier) {
        const locationToken = property.location?.match(/[A-Za-z]+/)?.[0]?.slice(0, 3).toUpperCase() || "KEN";
        identifier = await db.createPropertyIdentifier({ propertyId: property.id, identifier: `N360-${locationToken}-${String(property.id).padStart(6, "0")}`, createdByUserId: ctx.user.id });
      }
      if (!identifier) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await db.getPropertyShareRecordByPropertyId(property.id);
      if (existing) return { share: existing, identifier: identifier.identifier };
      const share = await db.createPropertyShareRecord({ propertyId: property.id, propertyIdentifierId: identifier.id, enabled: true, createdByUserId: ctx.user.id });
      if (!share) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "property_share.create", resourceType: "propertyShareRecord", resourceId: share.id, propertyId: property.id, metadata: { identifier: identifier.identifier } });
      return { share, identifier: identifier.identifier };
    }),
    setEnabled: protectedProcedure.input(z.object({ propertyId: z.number().int().positive(), enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || (property.userId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
      const share = await db.getPropertyShareRecordByPropertyId(property.id);
      if (!share) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await db.setPropertyShareEnabled(share.id, input.enabled);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "property_share.set_enabled", resourceType: "propertyShareRecord", resourceId: share.id, propertyId: property.id, metadata: { enabled: input.enabled } });
      return { success: true };
    }),
    publicLookup: publicProcedure.input(z.object({ identifier: z.string().trim().regex(/^N360-[A-Z]{3}-\d{6}$/) })).query(async ({ input }) => {
      const share = await db.getPublicPropertyShare(input.identifier);
      if (!share) throw new TRPCError({ code: "NOT_FOUND" });
      return share;
    }),
  }),

  adminRewards: router({
    claims: adminProcedure.input(z.object({ status: z.enum(["pending", "qualified", "rewarded", "rejected"]).optional() }).optional()).query(async ({ input }) => db.getReferralClaims(input?.status)),
    reviewClaim: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["qualified", "rewarded", "rejected"]) })).mutation(async ({ ctx, input }) => {
      const claim = await db.getReferralClaimById(input.id);
      if (!claim) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await db.reviewReferralClaim(claim.id, input.status, ctx.user.id);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "referral_claim.review", resourceType: "referralClaim", resourceId: claim.id, propertyId: null, metadata: { status: input.status } });
      return { success: true };
    }),
    addPoints: adminProcedure.input(z.object({ userId: z.number().int().positive(), points: z.number().int().min(-100000).max(100000).refine((value) => value !== 0), status: z.enum(["pending", "earned"]), note: z.string().trim().min(3).max(280), referralClaimId: z.number().int().positive().optional() })).mutation(async ({ ctx, input }) => {
      const targetUser = await db.getUserById(input.userId);
      if (!targetUser) throw new TRPCError({ code: "NOT_FOUND", message: "Reward recipient not found." });
      if (input.referralClaimId) {
        const claim = await db.getReferralClaimById(input.referralClaimId);
        if (!claim || claim.referrerUserId !== input.userId) throw new TRPCError({ code: "BAD_REQUEST", message: "Referral reward recipient must match the referral claim." });
      }
      const entry = await db.createRewardLedgerEntry({ userId: input.userId, referralClaimId: input.referralClaimId ?? null, points: input.points, type: input.referralClaimId ? "referral" : "admin_adjustment", status: input.status, note: input.note, createdByUserId: ctx.user.id });
      if (!entry) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "reward_ledger.create", resourceType: "rewardLedger", resourceId: entry.id, propertyId: null, metadata: { userId: input.userId, points: input.points, status: input.status } });
      return entry;
    }),
  }),

  // ─── File Upload ─────────────────────────────────────────────────────────

  upload: protectedProcedure
    .input(
      z.object({
        file: z.string().min(1).max(7_000_000), // base64 encoded file
        fileName: z.string().trim().min(3).max(120),
        contentType: z.string().max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      enforceOperationRateLimit(ctx, "property_photo_upload", 36, 60 * 60 * 1000);
      const { bytes: fileBuffer, extension } = decodeAndValidateUpload({
        fileName: input.fileName,
        contentType: input.contentType,
        data: input.file,
        allowedTypes: SAFE_IMAGE_TYPES,
        maxBytes: 5 * 1024 * 1024,
      });
      const fileKey = `property-photos/${ctx.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
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
      .input(z.object({ planId: z.number(), method: z.enum(["mpesa", "card", "bank_transfer"]).default("mpesa"), reference: z.string().max(255).optional() }))
      .mutation(async ({ ctx, input }) => {
        if (input.method === "mpesa") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Live M-Pesa is not connected. Administrators can use the separate mock M-Pesa sandbox for safe checkout testing." });
        }
        const plan = await db.getSubscriptionPlanById(input.planId);
        if (!plan || !plan.active) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

        // Create payment record (simulated payment — M-Pesa/Card handled offline by admin in MVP)
        const payment = await db.createPaymentRecord({
          userId: ctx.user.id,
          amount: plan.price,
          currency: plan.currency,
          method: input.method,
          reference: input.reference,
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

    mockMpesaCheckout: adminProcedure
      .input(z.object({ planId: z.number().int().positive(), outcome: z.enum(["pending", "success", "failure"]) }))
      .mutation(async ({ ctx, input }) => {
        enforceOperationRateLimit(ctx, "mock_mpesa_checkout", 12, 10 * 60 * 1000);
        const plan = await db.getSubscriptionPlanById(input.planId);
        if (!plan || !plan.active) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

        const paymentStatus = input.outcome === "success" ? "completed" : input.outcome === "failure" ? "failed" : "pending";
        const reference = `MOCK-MPESA-${input.outcome.toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
        const payment = await db.createPaymentRecord({
          userId: ctx.user.id,
          amount: plan.price,
          currency: plan.currency,
          method: "mpesa",
          reference,
          status: paymentStatus,
          type: "subscription",
          description: `Mock M-Pesa sandbox (${input.outcome}) — no live transaction`,
        });
        if (!payment) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create mock payment record" });

        let subscription: Awaited<ReturnType<typeof db.createSubscriptionRecord>> | null = null;
        if (input.outcome === "success") {
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + (plan.period === "annual" ? 12 : 1));
          subscription = await db.createSubscriptionRecord({ userId: ctx.user.id, planId: plan.id, endDate });
          if (!subscription) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to activate mock subscription" });
        }

        return { sandbox: true as const, outcome: input.outcome, payment, subscription, plan };
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
        propertyId: z.number().int().positive(),
        fileName: z.string().trim().min(3).max(120),
        contentType: z.string().max(100),
        data: z.string().min(1).max(34_000_000), // base64
      }))
      .mutation(async ({ ctx, input }) => {
        enforceOperationRateLimit(ctx, "property_video_upload", 8, 60 * 60 * 1000);
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
        const { bytes, extension } = decodeAndValidateUpload({ ...input, allowedTypes: SAFE_VIDEO_TYPES, maxBytes: 25 * 1024 * 1024 });
        const key = `property-videos/${input.propertyId}/${Date.now()}.${extension}`;
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
        fileName: z.string().trim().min(3).max(120),
        contentType: z.string().max(100),
        data: z.string().min(1).max(7_000_000),
        assetType: z.enum(["logo", "banner"]),
      }))
      .mutation(async ({ ctx, input }) => {
        enforceOperationRateLimit(ctx, "agency_asset_upload", 12, 60 * 60 * 1000);
        const { bytes, extension } = decodeAndValidateUpload({ ...input, allowedTypes: SAFE_IMAGE_TYPES, maxBytes: 5 * 1024 * 1024 });
        const key = `agency-assets/${ctx.user.id}/${input.assetType}-${Date.now()}.${extension}`;
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
  // ─── Planning Studio (user-owned financial planning scenarios) ───────────────
  planning: router({
    calculate: protectedProcedure
      .input(z.object({
        kind: z.enum(planningAnalysisKinds),
        inputs: z.record(z.string(), z.number().finite().min(0)).superRefine((inputs, ctx) => {
          for (const [key, value] of Object.entries(inputs)) {
            if (key.endsWith("Rate") && value > 100) ctx.addIssue({ code: "custom", message: `${key} cannot exceed 100%` });
          }
        }),
      }))
      .mutation(async ({ input }) => {
        if ((await db.isPlatformModuleEnabled("planning")) === false) throw new TRPCError({ code: "FORBIDDEN", message: "Planning Studio is temporarily unavailable." });
        return { result: calculatePlanningAnalysis(input.kind, input.inputs) };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      if ((await db.isPlatformModuleEnabled("planning")) === false) throw new TRPCError({ code: "FORBIDDEN", message: "Planning Studio is temporarily unavailable." });
      return db.getUserPlanningAnalyses(ctx.user.id);
    }),
    assumptionTemplates: protectedProcedure.input(z.object({ kind: z.enum(planningAnalysisKinds).optional() }).optional()).query(async ({ input }) => {
      if ((await db.isPlatformModuleEnabled("planning")) === false) throw new TRPCError({ code: "FORBIDDEN", message: "Planning Studio is temporarily unavailable." });
      return db.getPlanningAssumptionTemplates(input?.kind, true);
    }),
    save: protectedProcedure
      .input(z.object({
        kind: z.enum(planningAnalysisKinds),
        name: z.string().trim().min(2).max(160),
        propertyId: z.number().int().positive().optional(),
        inputs: z.record(z.string(), z.number().finite().min(0)).superRefine((inputs, ctx) => {
          for (const [key, value] of Object.entries(inputs)) {
            if (key.endsWith("Rate") && value > 100) ctx.addIssue({ code: "custom", message: `${key} cannot exceed 100%` });
          }
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        if ((await db.isPlatformModuleEnabled("planning")) === false) throw new TRPCError({ code: "FORBIDDEN", message: "Planning Studio is temporarily unavailable." });
        if (input.propertyId) {
          const property = await db.getPropertyById(input.propertyId);
          if (!property || property.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only link a scenario to your own property." });
        }
        const results = calculatePlanningAnalysis(input.kind, input.inputs);
        const analysis = await db.createPlanningAnalysis({ ...input, userId: ctx.user.id, results });
        return { analysis, result: results };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if ((await db.isPlatformModuleEnabled("planning")) === false) throw new TRPCError({ code: "FORBIDDEN", message: "Planning Studio is temporarily unavailable." });
        const deleted = await db.deletePlanningAnalysis(input.id, ctx.user.id);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
        return { success: true };
    }),
  }),
  // ─── Administrator controls: only admin users can govern the planning module ──
  adminModuleControls: router({
    planning: adminProcedure.query(async () => ({ setting: await db.getPlatformModuleSetting("planning"), templates: await db.getPlanningAssumptionTemplates() })),
    setPlanningEnabled: adminProcedure.input(z.object({ enabled: z.boolean() })).mutation(async ({ ctx, input }) => {
      const setting = await db.setPlatformModuleEnabled("planning", input.enabled, ctx.user.id);
      if (!setting) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "module_setting.planning", resourceType: "platformModuleSetting", resourceId: setting.id, propertyId: null, metadata: { enabled: input.enabled } });
      return setting;
    }),
    createPlanningTemplate: adminProcedure.input(z.object({
      name: z.string().trim().min(2).max(160), description: z.string().trim().max(400).optional(), kind: z.enum(planningAnalysisKinds), active: z.boolean().default(true),
      inputs: z.record(z.string(), z.number().finite().min(0)).superRefine((inputs, validation) => { for (const [key, value] of Object.entries(inputs)) if (key.endsWith("Rate") && value > 100) validation.addIssue({ code: "custom", message: `${key} cannot exceed 100%` }); }),
    })).mutation(async ({ ctx, input }) => {
      const template = await db.createPlanningAssumptionTemplate({ ...input, inputs: input.inputs, createdByUserId: ctx.user.id, updatedByUserId: ctx.user.id });
      if (!template) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "planning_template.create", resourceType: "planningAssumptionTemplate", resourceId: template.id, propertyId: null, metadata: { kind: template.kind, active: template.active } });
      return template;
    }),
    updatePlanningTemplate: adminProcedure.input(z.object({
      id: z.number().int().positive(), name: z.string().trim().min(2).max(160).optional(), description: z.string().trim().max(400).nullable().optional(), active: z.boolean().optional(),
      inputs: z.record(z.string(), z.number().finite().min(0)).optional(),
    })).mutation(async ({ ctx, input }) => {
      const template = await db.getPlanningAssumptionTemplateById(input.id);
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      const updated = await db.updatePlanningAssumptionTemplate(template.id, { ...(input.name !== undefined ? { name: input.name } : {}), ...(input.description !== undefined ? { description: input.description } : {}), ...(input.active !== undefined ? { active: input.active } : {}), ...(input.inputs !== undefined ? { inputs: input.inputs } : {}), updatedByUserId: ctx.user.id });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "planning_template.update", resourceType: "planningAssumptionTemplate", resourceId: template.id, propertyId: null, metadata: { active: input.active ?? template.active } });
      return { success: true };
    }),
  }),
  // ─── Agent Operations: agent-owned CRM and transaction workspaces ───────────
  agentOperations: router({
    summary: protectedProcedure.query(async ({ ctx }) => db.getAgentOperationsSummary(ctx.user.id)),
    contacts: router({
      list: protectedProcedure.input(z.object({ stage: z.enum(["new", "contacted", "qualified", "viewing", "negotiating", "won", "lost"]).optional() }).optional()).query(async ({ ctx, input }) => db.getAgentContacts(ctx.user.id, input?.stage)),
      create: protectedProcedure.input(z.object({
        propertyId: z.number().int().positive().optional(),
        name: z.string().trim().min(2).max(160),
        email: z.string().trim().email().max(320).optional(),
        phone: z.string().trim().max(48).optional(),
        source: z.enum(["marketplace", "inquiry", "manual", "referral"]).default("manual"),
        notes: z.string().trim().max(2000).optional(),
        nextFollowUpAt: z.date().optional(),
      })).mutation(async ({ ctx, input }) => {
        if (input.propertyId) {
          const property = await db.getPropertyById(input.propertyId);
          if (!property || property.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only link CRM contacts to your own property." });
        }
        const contact = await db.createAgentContact({ ...input, ownerUserId: ctx.user.id, stage: "new" });
        if (!contact) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "agent_contact.create", resourceType: "agentContact", resourceId: contact.id, propertyId: contact.propertyId, metadata: { source: contact.source } });
        return contact;
      }),
      updateStage: protectedProcedure.input(z.object({ id: z.number().int().positive(), stage: z.enum(["new", "contacted", "qualified", "viewing", "negotiating", "won", "lost"]), nextFollowUpAt: z.date().nullable().optional() })).mutation(async ({ ctx, input }) => {
        const contact = await db.getAgentContactById(input.id);
        if (!contact || contact.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const updated = await db.updateAgentContact(contact.id, { stage: input.stage, ...(input.nextFollowUpAt !== undefined ? { nextFollowUpAt: input.nextFollowUpAt } : {}) });
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        await db.createLeadActivity({ contactId: contact.id, agentUserId: ctx.user.id, type: "stage_change", body: `Pipeline moved from ${contact.stage} to ${input.stage}.`, fromStage: contact.stage, toStage: input.stage, activityAt: new Date() });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "agent_contact.stage_update", resourceType: "agentContact", resourceId: contact.id, propertyId: contact.propertyId, metadata: { previousStage: contact.stage, nextStage: input.stage } });
        return { success: true };
      }),
      activities: protectedProcedure.input(z.object({ contactId: z.number().int().positive() })).query(async ({ ctx, input }) => {
        const contact = await db.getAgentContactById(input.contactId);
        if (!contact || contact.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        return db.getLeadActivities(contact.id);
      }),
      addActivity: protectedProcedure.input(z.object({ contactId: z.number().int().positive(), type: z.enum(["note", "call", "email", "whatsapp", "viewing"]), body: z.string().trim().min(2).max(2000), activityAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
        const contact = await db.getAgentContactById(input.contactId);
        if (!contact || contact.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const activity = await db.createLeadActivity({ ...input, agentUserId: ctx.user.id, activityAt: input.activityAt ?? new Date(), fromStage: null, toStage: null });
        if (!activity) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "agent_contact.activity_create", resourceType: "leadActivity", resourceId: activity.id, propertyId: contact.propertyId, metadata: { type: input.type, contactId: contact.id } });
        return activity;
      }),
    }),
    templates: router({
      list: protectedProcedure.query(async ({ ctx }) => db.getListingTemplates(ctx.user.id)),
      create: protectedProcedure.input(z.object({ name: z.string().trim().min(2).max(160), category: z.enum(["sale", "rent", "general"]).default("general"), templateData: z.object({ title: z.string().trim().max(160).optional(), description: z.string().trim().max(3000).optional(), amenities: z.array(z.string().trim().min(1).max(80)).max(30).optional() }) })).mutation(async ({ ctx, input }) => {
        const template = await db.createListingTemplate({ ...input, ownerUserId: ctx.user.id, active: true });
        if (!template) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "listing_template.create", resourceType: "listingTemplate", resourceId: template.id, propertyId: null, metadata: { category: template.category } });
        return template;
      }),
      remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
        const template = await db.getListingTemplateById(input.id);
        if (!template || template.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const deleted = await db.deleteListingTemplate(template.id);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "listing_template.delete", resourceType: "listingTemplate", resourceId: template.id, propertyId: null, metadata: { category: template.category } });
        return { success: true };
      }),
    }),
    transactions: router({
      list: protectedProcedure.query(async ({ ctx }) => db.getAgentTransactions(ctx.user.id)),
      create: protectedProcedure.input(z.object({ propertyId: z.number().int().positive(), title: z.string().trim().min(3).max(255), counterpartyName: z.string().trim().max(160).optional(), counterpartyContact: z.string().trim().max(160).optional(), amount: z.number().finite().min(0).optional(), notes: z.string().trim().max(2000).optional() })).mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "You can only create a transaction for your own property." });
        const transaction = await db.createAgentTransaction({ ...input, ownerUserId: ctx.user.id, amount: input.amount !== undefined ? String(input.amount) : null, stage: "intake", status: "active" });
        if (!transaction) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "property_transaction.create", resourceType: "propertyTransaction", resourceId: transaction.id, propertyId: transaction.propertyId, metadata: { stage: transaction.stage } });
        return transaction;
      }),
      updateStage: protectedProcedure.input(z.object({ id: z.number().int().positive(), stage: z.enum(["intake", "listing", "viewing", "offer", "negotiation", "contract", "completed", "cancelled"]), status: z.enum(["active", "on_hold", "completed", "cancelled"]) })).mutation(async ({ ctx, input }) => {
        const transaction = await db.getAgentTransactionById(input.id);
        if (!transaction || transaction.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const completedAt = input.status === "completed" || input.stage === "completed" ? new Date() : null;
        const updated = await db.updateAgentTransaction(transaction.id, { stage: input.stage, status: input.status, completedAt });
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "property_transaction.stage_update", resourceType: "propertyTransaction", resourceId: transaction.id, propertyId: transaction.propertyId, metadata: { previousStage: transaction.stage, nextStage: input.stage, previousStatus: transaction.status, nextStatus: input.status } });
        return { success: true };
      }),
    }),
  }),
  // ─── Property Operations: access-controlled document vault ──────────────────
  operations: router({
    documents: router({
      list: protectedProcedure.input(z.object({ propertyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || (property.userId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        return db.getPropertyDocuments(input.propertyId);
      }),
      upload: protectedProcedure.input(z.object({
        propertyId: z.number().int().positive(),
        name: z.string().trim().min(1).max(255),
        category: z.enum(["ownership", "lease", "sale", "receipt", "inspection", "certificate", "other"]),
        mimeType: z.enum(["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]),
        data: z.string().min(1).max(7_000_000),
      })).mutation(async ({ ctx, input }) => {
        enforceOperationRateLimit(ctx, "property_document_upload", 18, 60 * 60 * 1000);
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "Only the property owner can upload documents." });
        const { bytes, extension } = decodeAndValidateUpload({ fileName: input.name, contentType: input.mimeType, data: input.data, allowedTypes: SAFE_DOCUMENT_TYPES, maxBytes: 5 * 1024 * 1024 });
        const { key } = await storagePut(`property-documents/${ctx.user.id}/${input.propertyId}/${Date.now()}.${extension}`, bytes, input.mimeType);
        const document = await db.createPropertyDocument({ propertyId: input.propertyId, uploadedByUserId: ctx.user.id, name: input.name, category: input.category, fileKey: key, mimeType: input.mimeType, sizeBytes: bytes.length });
        if (!document) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Document metadata could not be saved." });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "document.upload", resourceType: "propertyDocument", resourceId: document.id, propertyId: input.propertyId, metadata: { category: input.category, mimeType: input.mimeType, sizeBytes: bytes.length } });
        return document;
      }),
      download: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
        const document = await db.getPropertyDocumentById(input.id);
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        const property = await db.getPropertyById(document.propertyId);
        const isOwner = property?.userId === ctx.user.id;
        const isUploader = document.uploadedByUserId === ctx.user.id;
        const grant = !isOwner && !isUploader && ctx.user.role !== "admin" ? await db.getDocumentAccess(document.id, ctx.user.id) : undefined;
        if (!isOwner && !isUploader && ctx.user.role !== "admin" && (!grant || grant.permission !== "download")) throw new TRPCError({ code: "FORBIDDEN" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "document.download", resourceType: "propertyDocument", resourceId: document.id, propertyId: document.propertyId, metadata: { via: grant ? "access-grant" : "owner-or-uploader" } });
        return { url: await storageGetSignedUrl(document.fileKey), name: document.name };
      }),
      grantAccess: protectedProcedure.input(z.object({ id: z.number().int().positive(), userId: z.number().int().positive(), permission: z.enum(["view", "download"]) })).mutation(async ({ ctx, input }) => {
        const document = await db.getPropertyDocumentById(input.id);
        const property = document ? await db.getPropertyById(document.propertyId) : undefined;
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        if (property?.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const grantId = await db.grantDocumentAccess(document.id, input.userId, input.permission, ctx.user.id);
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "document.access_grant", resourceType: "propertyDocument", resourceId: document.id, propertyId: document.propertyId, metadata: { recipientUserId: input.userId, permission: input.permission } });
        return { id: grantId };
      }),
      remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
        const document = await db.getPropertyDocumentById(input.id);
        const property = document ? await db.getPropertyById(document.propertyId) : undefined;
        if (!document) throw new TRPCError({ code: "NOT_FOUND" });
        if (property?.userId !== ctx.user.id && document.uploadedByUserId !== ctx.user.id && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        const deleted = await db.softDeletePropertyDocument(document.id);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "document.delete", resourceType: "propertyDocument", resourceId: document.id, propertyId: document.propertyId, metadata: { category: document.category } });
        return { success: true };
      }),
      activity: protectedProcedure.input(z.object({ propertyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || (property.userId !== ctx.user.id && ctx.user.role !== "admin")) throw new TRPCError({ code: "FORBIDDEN" });
        return db.getPropertyAuditLogs(input.propertyId);
      }),
    }),
    records: router({
      list: protectedProcedure.input(z.object({ propertyId: z.number().int().positive().optional(), type: z.enum(["lease", "inspection", "maintenance", "rent", "vacancy"]).optional() }).optional()).query(async ({ ctx, input }) => {
        if (input?.propertyId) {
          const property = await db.getPropertyById(input.propertyId);
          if (!property || property.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getOwnerPropertyOperationRecords(ctx.user.id, input);
      }),
      summary: protectedProcedure.query(async ({ ctx }) => db.getOwnerPropertyOperationSummary(ctx.user.id)),
      create: protectedProcedure.input(z.object({
        propertyId: z.number().int().positive(),
        type: z.enum(["lease", "inspection", "maintenance", "rent", "vacancy"]),
        title: z.string().trim().min(3).max(255),
        status: z.string().trim().min(2).max(64),
        priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
        participantName: z.string().trim().max(160).optional(),
        participantContact: z.string().trim().max(160).optional(),
        tenantUserId: z.number().int().positive().optional(),
        amount: z.number().finite().min(0).optional(),
        dueDate: z.date().optional(),
        details: z.string().trim().max(1500).optional(),
      })).mutation(async ({ ctx, input }) => {
        const property = await db.getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (input.tenantUserId && !(await db.hasActiveTenantAssignment(input.propertyId, input.tenantUserId))) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected tenant does not have an active assignment for this property." });
        const record = await db.createPropertyOperationRecord({ ...input, ownerUserId: ctx.user.id, amount: input.amount !== undefined ? String(input.amount) : null, details: input.details ? { notes: input.details } : null });
        if (!record) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: `operations.${input.type}.create`, resourceType: "propertyOperation", resourceId: record.id, propertyId: input.propertyId, metadata: { status: input.status, priority: input.priority } });
        return record;
      }),
      updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.string().trim().min(2).max(64) })).mutation(async ({ ctx, input }) => {
        const record = await db.getPropertyOperationRecordById(input.id);
        if (!record || record.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        const completed = ["completed", "closed", "paid", "resolved"].includes(input.status) ? new Date() : null;
        const updated = await db.updatePropertyOperationRecord(record.id, { status: input.status, completedAt: completed });
        if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
        await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: `operations.${record.type}.status_update`, resourceType: "propertyOperation", resourceId: record.id, propertyId: record.propertyId, metadata: { previousStatus: record.status, nextStatus: input.status } });
        return { success: true };
      }),
    }),
  }),
  // ─── Tenant identity: explicit owner invitation, acceptance, and scoped dashboard ──
  tenantAccess: router({
    ownerAssignments: protectedProcedure.query(async ({ ctx }) => {
      const assignments = await db.getOwnerPropertyTenantAssignments(ctx.user.id);
      const properties = await db.getUserProperties(ctx.user.id);
      const byId = new Map(properties.map((property) => [property.id, property]));
      return assignments.map((assignment) => ({ assignment, property: byId.get(assignment.propertyId) ?? null }));
    }),
    createInvitation: protectedProcedure.input(z.object({ propertyId: z.number().int().positive(), unitLabel: z.string().trim().max(120).optional(), expiresAt: z.date().optional() })).mutation(async ({ ctx, input }) => {
      const property = await db.getPropertyById(input.propertyId);
      if (!property || property.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.expiresAt && input.expiresAt <= new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation expiry must be in the future." });
      let assignment;
      for (let attempt = 0; attempt < 3 && !assignment; attempt += 1) {
        const invitationCode = `N360-T-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
        try { assignment = await db.createPropertyTenantAssignment({ propertyId: property.id, ownerUserId: ctx.user.id, invitationCode, status: "pending", unitLabel: input.unitLabel ?? null, expiresAt: input.expiresAt ?? null }); } catch { /* retry a cryptographically unique invitation code */ }
      }
      if (!assignment) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not create a tenant invitation." });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "tenant_assignment.create", resourceType: "propertyTenantAssignment", resourceId: assignment.id, propertyId: property.id, metadata: { unitLabel: assignment.unitLabel, expiresAt: assignment.expiresAt } });
      return assignment;
    }),
    endAssignment: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["ended", "revoked"]) })).mutation(async ({ ctx, input }) => {
      const assignment = await db.getPropertyTenantAssignmentById(input.id);
      if (!assignment || assignment.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      const updated = await db.endPropertyTenantAssignment(assignment.id, input.status);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "tenant_assignment.end", resourceType: "propertyTenantAssignment", resourceId: assignment.id, propertyId: assignment.propertyId, metadata: { status: input.status } });
      return { success: true };
    }),
    linkOperation: protectedProcedure.input(z.object({ operationId: z.number().int().positive(), tenantUserId: z.number().int().positive().nullable() })).mutation(async ({ ctx, input }) => {
      const record = await db.getPropertyOperationRecordById(input.operationId);
      if (!record || record.ownerUserId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (input.tenantUserId && !(await db.hasActiveTenantAssignment(record.propertyId, input.tenantUserId))) throw new TRPCError({ code: "BAD_REQUEST", message: "Tenant must hold an active assignment for this property." });
      const updated = await db.updatePropertyOperationRecord(record.id, { tenantUserId: input.tenantUserId });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "tenant_assignment.link_operation", resourceType: "propertyOperation", resourceId: record.id, propertyId: record.propertyId, metadata: { tenantUserId: input.tenantUserId } });
      return { success: true };
    }),
    claimInvitation: protectedProcedure.input(z.object({ invitationCode: z.string().trim().toUpperCase().regex(/^N360-T-[A-Z0-9]{8}$/) })).mutation(async ({ ctx, input }) => {
      const assignment = await db.getPropertyTenantAssignmentByInvitation(input.invitationCode);
      if (!assignment || assignment.status !== "pending" || assignment.tenantUserId || (assignment.expiresAt && assignment.expiresAt < new Date())) throw new TRPCError({ code: "BAD_REQUEST", message: "This tenant invitation is unavailable." });
      if (assignment.ownerUserId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "An owner cannot accept their own tenant invitation." });
      const activated = await db.activatePropertyTenantAssignment(assignment.id, ctx.user.id);
      if (!activated) throw new TRPCError({ code: "CONFLICT", message: "This tenant invitation has already been claimed." });
      await db.createModuleAuditLog({ actorUserId: ctx.user.id, action: "tenant_assignment.claim", resourceType: "propertyTenantAssignment", resourceId: assignment.id, propertyId: assignment.propertyId, metadata: {} });
      return { success: true };
    }),
    dashboard: protectedProcedure.query(async ({ ctx }) => db.getTenantDashboard(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
