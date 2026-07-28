import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { notifyOwner } from "./_core/notification";
import { sendInquiryNotification, sendApprovalNotification, sendRejectionNotification } from "./notifications";
import { storagePut } from "./storage";
import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  router,
} from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

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
            .array(z.object({ fileKey: z.string(), url: z.string() }))
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
            .array(z.object({ fileKey: z.string(), url: z.string() }))
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
});

export type AppRouter = typeof appRouter;
