import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  double,
  boolean,
  json,
  tinyint,
  index,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  location: text("location"),
  bio: text("bio"),
  profilePicture: text("profilePicture"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: double("price").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  latitude: double("latitude"),
  longitude: double("longitude"),
  propertyType: mysqlEnum("propertyType", [
    "house",
    "apartment",
    "villa",
    "land",
    "commercial",
    "townhouse",
    "studio",
    "penthouse",
  ]).notNull(),
  listingType: mysqlEnum("listingType", ["sale", "rent"]).notNull(),
  bedrooms: int("bedrooms").default(0),
  bathrooms: int("bathrooms").default(0),
  landSize: double("landSize"),
  floorArea: double("floorArea"),
  amenities: json("amenities"),
  status: mysqlEnum("status", [
    "pending",
    "approved",
    "rejected",
    "sold",
    "rented",
  ])
    .default("pending")
    .notNull(),
  featured: boolean("featured").default(false),
  viewsCount: int("viewsCount").default(0),
  inquiriesCount: int("inquiriesCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

export const propertyPhotos = mysqlTable("propertyPhotos", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  sortOrder: int("sortOrder").default(0),
  is360: tinyint("is360").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyPhoto = typeof propertyPhotos.$inferSelect;
export type InsertPropertyPhoto = typeof propertyPhotos.$inferInsert;

export const inquiries = mysqlTable("inquiries", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  message: text("message").notNull(),
  leadStatus: mysqlEnum("leadStatus", ["new", "contacted", "viewing", "negotiating", "closed", "lost"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export const testimonials = mysqlTable("testimonials", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 128 }),
  content: text("content").notNull(),
  rating: int("rating").default(5),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  featured: boolean("featured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export const blogPosts = mysqlTable("blogPosts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: varchar("coverImage", { length: 512 }),
  authorId: int("authorId"),
  published: boolean("published").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const postCategories = mysqlTable("postCategories", {
  postId: int("postId").notNull(),
  categoryId: int("categoryId").notNull(),
});

// ─── Premium subscription plans ──────────────────────────────────────────────

export const subscriptionPlans = mysqlTable("subscriptionPlans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  price: double("price").notNull(),
  currency: varchar("currency", { length: 8 }).default("KES").notNull(),
  period: mysqlEnum("period", ["monthly", "annual"]).notNull(),
  maxImages: int("maxImages").default(5),
  maxVideos: int("maxVideos").default(0),
  featured: boolean("featured").default(false),
  prioritySearch: boolean("prioritySearch").default(false),
  aiDescriptions: boolean("aiDescriptions").default(false),
  aiPriceRecommendations: boolean("aiPriceRecommendations").default(false),
  leadManagement: boolean("leadManagement").default(false),
  verifiedBadge: boolean("verifiedBadge").default(false),
  agencyBranding: boolean("agencyBranding").default(false),
  socialSharing: boolean("socialSharing").default(false),
  prioritySupport: boolean("prioritySupport").default(false),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// ─── User subscriptions ──────────────────────────────────────────────────────

export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "past_due"])
    .default("active")
    .notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  autoRenew: boolean("autoRenew").default(true),
  lastPaymentDate: timestamp("lastPaymentDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Payment history ─────────────────────────────────────────────────────────

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  propertyId: int("propertyId"),
  amount: double("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("KES").notNull(),
  method: mysqlEnum("method", ["mpesa", "card", "bank_transfer", "free"])
    .default("free")
    .notNull(),
  reference: varchar("reference", { length: 255 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"])
    .default("pending")
    .notNull(),
  type: mysqlEnum("type", ["subscription", "featured_listing", "video_upload"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Featured listings ───────────────────────────────────────────────────────

export const featuredListings = mysqlTable("featuredListings", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  userId: int("userId").notNull(),
  paymentId: int("paymentId"),
  featuredUntil: timestamp("featuredUntil").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeaturedListing = typeof featuredListings.$inferSelect;
export type InsertFeaturedListing = typeof featuredListings.$inferInsert;

// ─── Property videos ─────────────────────────────────────────────────────────

export const propertyVideos = mysqlTable("propertyVideos", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyVideo = typeof propertyVideos.$inferSelect;
export type InsertPropertyVideo = typeof propertyVideos.$inferInsert;

// ─── Agency profiles ─────────────────────────────────────────────────────────

export const agencyProfiles = mysqlTable("agencyProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agencyName: varchar("agencyName", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  socialMedia: json("socialMedia"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgencyProfile = typeof agencyProfiles.$inferSelect;
export type InsertAgencyProfile = typeof agencyProfiles.$inferInsert;

// ─── User preferences (match engine) ──────────────────────────────────────────
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  budgetMin: double("budgetMin"),
  budgetMax: double("budgetMax"),
  preferredLocations: json("preferredLocations"),
  preferredTypes: json("preferredTypes"),
  minBedrooms: int("minBedrooms").default(0),
  listingType: mysqlEnum("listingType", ["sale", "rent", "any"]).default("any"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

// ─── Property alerts (instant + price drop) ───────────────────────────────────
export const propertyAlerts = mysqlTable("propertyAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["instant", "priceDrop"]).notNull(),
  // For instant alerts: search criteria JSON
  criteria: json("criteria"),
  // For price-drop alerts: watched property
  propertyId: int("propertyId"),
  // Whether alert is active
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PropertyAlert = typeof propertyAlerts.$inferSelect;
export type InsertPropertyAlert = typeof propertyAlerts.$inferInsert;

// ─── In-app account notifications ────────────────────────────────────────────
export const accountNotifications = mysqlTable("accountNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  href: varchar("href", { length: 512 }),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AccountNotification = typeof accountNotifications.$inferSelect;
export type InsertAccountNotification = typeof accountNotifications.$inferInsert;

// ─── Viewing bookings ─────────────────────────────────────────────────────────
export const viewingBookings = mysqlTable("viewingBookings", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  buyerId: int("buyerId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  type: mysqlEnum("type", ["virtual", "physical"]).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled", "completed"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ViewingBooking = typeof viewingBookings.$inferSelect;
export type InsertViewingBooking = typeof viewingBookings.$inferInsert;

// ─── Property scores (Pedi Wa Property Score) ─────────────────────────────────
export const propertyScores = mysqlTable("propertyScores", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().unique(),
  score: int("score").notNull(),
  valueScore: int("valueScore").notNull(),
  locationScore: int("locationScore").notNull(),
  amenitiesScore: int("amenitiesScore").notNull(),
  accessibilityScore: int("accessibilityScore").notNull(),
  breakdown: json("breakdown"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PropertyScore = typeof propertyScores.$inferSelect;
export type InsertPropertyScore = typeof propertyScores.$inferInsert;

// ─── Viewings count / search activity for recommendations ─────────────────────
export const propertyActivity = mysqlTable("propertyActivity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId").notNull(),
  eventType: mysqlEnum("eventType", ["view", "save", "search"]).notNull(),
  // search keywords used for search events
  keywords: json("keywords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PropertyActivity = typeof propertyActivity.$inferSelect;
export type InsertPropertyActivity = typeof propertyActivity.$inferInsert;

// ─── Planning Studio scenarios ───────────────────────────────────────────────
export const planningAnalyses = mysqlTable("planningAnalyses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  propertyId: int("propertyId"),
  kind: mysqlEnum("kind", ["roi", "rental_yield", "construction", "development"]).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  inputs: json("inputs").notNull(),
  results: json("results").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("planning_user_created_idx").on(table.userId, table.createdAt),
  index("planning_property_idx").on(table.propertyId),
]);
export type PlanningAnalysis = typeof planningAnalyses.$inferSelect;
export type InsertPlanningAnalysis = typeof planningAnalyses.$inferInsert;
