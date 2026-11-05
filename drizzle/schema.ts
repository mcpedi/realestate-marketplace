import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  doublePrecision,
  boolean,
  jsonb,
  smallint,
  index,
  decimal,
  uniqueIndex,
} from "drizzle-orm/pg-core";

type SchemaEnum1 = 'user' | 'admin';
type SchemaEnum2 = 'house' | 'apartment' | 'villa' | 'land' | 'commercial' | 'townhouse' | 'studio' | 'penthouse';
type SchemaEnum3 = 'sale' | 'rent';
type SchemaEnum4 = 'pending' | 'approved' | 'rejected' | 'sold' | 'rented';
type SchemaEnum5 = 'none' | 'low' | 'medium' | 'high';
type SchemaEnum6 = 'new' | 'contacted' | 'viewing' | 'negotiating' | 'closed' | 'lost';
type SchemaEnum7 = 'monthly' | 'annual';
type SchemaEnum8 = 'active' | 'cancelled' | 'expired' | 'past_due';
type SchemaEnum9 = 'mpesa' | 'card' | 'bank_transfer' | 'free';
type SchemaEnum10 = 'pending' | 'completed' | 'failed' | 'refunded';
type SchemaEnum11 = 'subscription' | 'featured_listing' | 'video_upload';
type SchemaEnum12 = 'sale' | 'rent' | 'any';
type SchemaEnum13 = 'instant' | 'priceDrop';
type SchemaEnum14 = 'virtual' | 'physical';
type SchemaEnum15 = 'pending' | 'confirmed' | 'cancelled' | 'completed';
type SchemaEnum16 = 'view' | 'save' | 'search';
type SchemaEnum17 = 'roi' | 'rental_yield' | 'construction' | 'development';
type SchemaEnum18 = 'ownership' | 'lease' | 'sale' | 'receipt' | 'inspection' | 'certificate' | 'other';
type SchemaEnum19 = 'view' | 'download';
type SchemaEnum20 = 'lease' | 'inspection' | 'maintenance' | 'rent' | 'vacancy';
type SchemaEnum21 = 'low' | 'normal' | 'high' | 'urgent';
type SchemaEnum22 = 'pending' | 'active' | 'ended' | 'revoked';
type SchemaEnum23 = 'planning';
type SchemaEnum24 = 'new' | 'contacted' | 'qualified' | 'viewing' | 'negotiating' | 'won' | 'lost';
type SchemaEnum25 = 'marketplace' | 'inquiry' | 'manual' | 'referral';
type SchemaEnum26 = 'note' | 'call' | 'email' | 'whatsapp' | 'viewing' | 'stage_change';
type SchemaEnum27 = 'sale' | 'rent' | 'general';
type SchemaEnum28 = 'intake' | 'listing' | 'viewing' | 'offer' | 'negotiation' | 'contract' | 'completed' | 'cancelled';
type SchemaEnum29 = 'active' | 'on_hold' | 'completed' | 'cancelled';
type SchemaEnum30 = 'pending' | 'qualified' | 'rewarded' | 'rejected';
type SchemaEnum31 = 'referral' | 'admin_adjustment' | 'redemption' | 'reversal';
type SchemaEnum32 = 'pending' | 'earned' | 'spent' | 'reversed';

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: text("role").$type<SchemaEnum1>().default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  location: text("location"),
  bio: text("bio"),
  profilePicture: text("profilePicture"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const properties = pgTable("properties", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  propertyType: text("propertyType").$type<SchemaEnum2>().notNull(),
  listingType: text("listingType").$type<SchemaEnum3>().notNull(),
  bedrooms: integer("bedrooms").default(0),
  bathrooms: integer("bathrooms").default(0),
  landSize: doublePrecision("landSize"),
  floorArea: doublePrecision("floorArea"),
  amenities: jsonb("amenities"),
  status: text("status").$type<SchemaEnum4>()
    .default("pending")
    .notNull(),
  featured: boolean("featured").default(false),
  viewsCount: integer("viewsCount").default(0),
  inquiriesCount: integer("inquiriesCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ─── AI-assisted property moderation signals ──────────────────────────────────
// A signal is a limited review aid, not a moderation decision. The source listing
// text is never duplicated here; only the structured current outcome is retained.
export const propertyModerationSignals = pgTable("propertyModerationSignals", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull().unique(),
  riskLevel: text("riskLevel").$type<SchemaEnum5>().default("none").notNull(),
  categories: jsonb("categories").notNull(),
  summary: varchar("summary", { length: 600 }).notNull(),
  confidence: integer("confidence").notNull(),
  model: varchar("model", { length: 96 }).notNull(),
  inputFingerprint: varchar("inputFingerprint", { length: 64 }).notNull(),
  analyzedByUserId: integer("analyzedByUserId").notNull(),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("moderation_signal_level_updated_idx").on(table.riskLevel, table.updatedAt),
]);
export type PropertyModerationSignal = typeof propertyModerationSignals.$inferSelect;
export type InsertPropertyModerationSignal = typeof propertyModerationSignals.$inferInsert;

export const propertyPhotos = pgTable("propertyPhotos", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  sortOrder: integer("sortOrder").default(0),
  is360: smallint("is360").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyPhoto = typeof propertyPhotos.$inferSelect;
export type InsertPropertyPhoto = typeof propertyPhotos.$inferInsert;

export const inquiries = pgTable("inquiries", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  userId: integer("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  message: text("message").notNull(),
  leadStatus: text("leadStatus").$type<SchemaEnum6>().default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

export const favorites = pgTable("favorites", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  propertyId: integer("propertyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

export const testimonials = pgTable("testimonials", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 128 }),
  content: text("content").notNull(),
  rating: integer("rating").default(5),
  avatarUrl: varchar("avatarUrl", { length: 512 }),
  featured: boolean("featured").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = typeof testimonials.$inferInsert;

export const blogPosts = pgTable("blogPosts", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImage: varchar("coverImage", { length: 512 }),
  authorId: integer("authorId"),
  published: boolean("published").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

export const postCategories = pgTable("postCategories", {
  postId: integer("postId").notNull(),
  categoryId: integer("categoryId").notNull(),
});

// ─── Premium subscription plans ──────────────────────────────────────────────

export const subscriptionPlans = pgTable("subscriptionPlans", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  price: doublePrecision("price").notNull(),
  currency: varchar("currency", { length: 8 }).default("KES").notNull(),
  period: text("period").$type<SchemaEnum7>().notNull(),
  maxImages: integer("maxImages").default(5),
  maxVideos: integer("maxVideos").default(0),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// ─── User subscriptions ──────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  status: text("status").$type<SchemaEnum8>()
    .default("active")
    .notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  autoRenew: boolean("autoRenew").default(true),
  lastPaymentDate: timestamp("lastPaymentDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Payment history ─────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  subscriptionId: integer("subscriptionId"),
  propertyId: integer("propertyId"),
  amount: doublePrecision("amount").notNull(),
  currency: varchar("currency", { length: 8 }).default("KES").notNull(),
  method: text("method").$type<SchemaEnum9>()
    .default("free")
    .notNull(),
  reference: varchar("reference", { length: 255 }),
  status: text("status").$type<SchemaEnum10>()
    .default("pending")
    .notNull(),
  type: text("type").$type<SchemaEnum11>().notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── Featured listings ───────────────────────────────────────────────────────

export const featuredListings = pgTable("featuredListings", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  userId: integer("userId").notNull(),
  paymentId: integer("paymentId"),
  featuredUntil: timestamp("featuredUntil").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeaturedListing = typeof featuredListings.$inferSelect;
export type InsertFeaturedListing = typeof featuredListings.$inferInsert;

// ─── Property videos ─────────────────────────────────────────────────────────

export const propertyVideos = pgTable("propertyVideos", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  url: varchar("url", { length: 512 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyVideo = typeof propertyVideos.$inferSelect;
export type InsertPropertyVideo = typeof propertyVideos.$inferInsert;

// ─── Agency profiles ─────────────────────────────────────────────────────────

export const agencyProfiles = pgTable("agencyProfiles", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  agencyName: varchar("agencyName", { length: 255 }).notNull(),
  logoUrl: text("logoUrl"),
  bannerUrl: text("bannerUrl"),
  description: text("description"),
  website: varchar("website", { length: 512 }),
  socialMedia: jsonb("socialMedia"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AgencyProfile = typeof agencyProfiles.$inferSelect;
export type InsertAgencyProfile = typeof agencyProfiles.$inferInsert;

// ─── User preferences (match engine) ──────────────────────────────────────────
export const userPreferences = pgTable("userPreferences", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  budgetMin: doublePrecision("budgetMin"),
  budgetMax: doublePrecision("budgetMax"),
  preferredLocations: jsonb("preferredLocations"),
  preferredTypes: jsonb("preferredTypes"),
  minBedrooms: integer("minBedrooms").default(0),
  listingType: text("listingType").$type<SchemaEnum12>().default("any"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

// ─── Property alerts (instant + price drop) ───────────────────────────────────
export const propertyAlerts = pgTable("propertyAlerts", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  type: text("type").$type<SchemaEnum13>().notNull(),
  // For instant alerts: search criteria JSON
  criteria: jsonb("criteria"),
  // For price-drop alerts: watched property
  propertyId: integer("propertyId"),
  // Whether alert is active
  active: boolean("active").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PropertyAlert = typeof propertyAlerts.$inferSelect;
export type InsertPropertyAlert = typeof propertyAlerts.$inferInsert;

// ─── In-app account notifications ────────────────────────────────────────────
export const accountNotifications = pgTable("accountNotifications", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
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
export const viewingBookings = pgTable("viewingBookings", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  buyerId: integer("buyerId").notNull(),
  scheduledAt: timestamp("scheduledAt").notNull(),
  type: text("type").$type<SchemaEnum14>().notNull(),
  status: text("status").$type<SchemaEnum15>().default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ViewingBooking = typeof viewingBookings.$inferSelect;
export type InsertViewingBooking = typeof viewingBookings.$inferInsert;

// ─── Property scores (Pedi Wa Property Score) ─────────────────────────────────
export const propertyScores = pgTable("propertyScores", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull().unique(),
  score: integer("score").notNull(),
  valueScore: integer("valueScore").notNull(),
  locationScore: integer("locationScore").notNull(),
  amenitiesScore: integer("amenitiesScore").notNull(),
  accessibilityScore: integer("accessibilityScore").notNull(),
  breakdown: jsonb("breakdown"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PropertyScore = typeof propertyScores.$inferSelect;
export type InsertPropertyScore = typeof propertyScores.$inferInsert;

// ─── Viewings count / search activity for recommendations ─────────────────────
export const propertyActivity = pgTable("propertyActivity", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  propertyId: integer("propertyId").notNull(),
  eventType: text("eventType").$type<SchemaEnum16>().notNull(),
  // search keywords used for search events
  keywords: jsonb("keywords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PropertyActivity = typeof propertyActivity.$inferSelect;
export type InsertPropertyActivity = typeof propertyActivity.$inferInsert;

// ─── Planning Studio scenarios ───────────────────────────────────────────────
export const planningAnalyses = pgTable("planningAnalyses", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  propertyId: integer("propertyId"),
  kind: text("kind").$type<SchemaEnum17>().notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  inputs: jsonb("inputs").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("planning_user_created_idx").on(table.userId, table.createdAt),
  index("planning_property_idx").on(table.propertyId),
]);
export type PlanningAnalysis = typeof planningAnalyses.$inferSelect;
export type InsertPlanningAnalysis = typeof planningAnalyses.$inferInsert;

// ─── Property Operations: secure documents and audit trail ────────────────────
export const propertyDocuments = pgTable("propertyDocuments", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  uploadedByUserId: integer("uploadedByUserId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: text("category").$type<SchemaEnum18>().default("other").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  sizeBytes: integer("sizeBytes").notNull(),
  deletedAt: timestamp("deletedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("property_document_property_idx").on(table.propertyId, table.createdAt),
  index("property_document_uploader_idx").on(table.uploadedByUserId, table.createdAt),
]);
export type PropertyDocument = typeof propertyDocuments.$inferSelect;
export type InsertPropertyDocument = typeof propertyDocuments.$inferInsert;

export const propertyDocumentAccess = pgTable("propertyDocumentAccess", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  documentId: integer("documentId").notNull(),
  userId: integer("userId").notNull(),
  permission: text("permission").$type<SchemaEnum19>().default("view").notNull(),
  grantedByUserId: integer("grantedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("document_access_document_idx").on(table.documentId),
  index("document_access_user_idx").on(table.userId),
]);
export type PropertyDocumentAccess = typeof propertyDocumentAccess.$inferSelect;
export type InsertPropertyDocumentAccess = typeof propertyDocumentAccess.$inferInsert;

export const moduleAuditLogs = pgTable("moduleAuditLogs", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  actorUserId: integer("actorUserId").notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  resourceId: integer("resourceId").notNull(),
  propertyId: integer("propertyId"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("module_audit_resource_idx").on(table.resourceType, table.resourceId),
  index("module_audit_property_idx").on(table.propertyId, table.createdAt),
  index("module_audit_actor_idx").on(table.actorUserId, table.createdAt),
]);
export type ModuleAuditLog = typeof moduleAuditLogs.$inferSelect;
export type InsertModuleAuditLog = typeof moduleAuditLogs.$inferInsert;

// ─── Property Operations: typed workflow records ──────────────────────────────
export const propertyOperationRecords = pgTable("propertyOperationRecords", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  ownerUserId: integer("ownerUserId").notNull(),
  type: text("type").$type<SchemaEnum20>().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  priority: text("priority").$type<SchemaEnum21>().default("normal").notNull(),
  participantName: varchar("participantName", { length: 160 }),
  participantContact: varchar("participantContact", { length: 160 }),
  tenantUserId: integer("tenantUserId"),
  amount: decimal("amount", { precision: 14, scale: 2 }),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  details: jsonb("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("operation_property_type_idx").on(table.propertyId, table.type),
  index("operation_owner_status_idx").on(table.ownerUserId, table.status),
  index("operation_tenant_status_idx").on(table.tenantUserId, table.status),
  index("operation_due_date_idx").on(table.dueDate),
]);
export type PropertyOperationRecord = typeof propertyOperationRecords.$inferSelect;
export type InsertPropertyOperationRecord = typeof propertyOperationRecords.$inferInsert;

// ─── Explicit tenant identity: claimable owner-created property assignments ─────
export const propertyTenantAssignments = pgTable("propertyTenantAssignments", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  ownerUserId: integer("ownerUserId").notNull(),
  tenantUserId: integer("tenantUserId"),
  invitationCode: varchar("invitationCode", { length: 32 }).notNull().unique(),
  status: text("status").$type<SchemaEnum22>().default("pending").notNull(),
  unitLabel: varchar("unitLabel", { length: 120 }),
  expiresAt: timestamp("expiresAt"),
  acceptedAt: timestamp("acceptedAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("tenant_assignment_owner_property_idx").on(table.ownerUserId, table.propertyId),
  index("tenant_assignment_tenant_status_idx").on(table.tenantUserId, table.status),
  index("tenant_assignment_property_status_idx").on(table.propertyId, table.status),
]);
export type PropertyTenantAssignment = typeof propertyTenantAssignments.$inferSelect;
export type InsertPropertyTenantAssignment = typeof propertyTenantAssignments.$inferInsert;

// ─── Administrator controls: planning defaults are explicit, editable, and auditable ──
export const platformModuleSettings = pgTable("platformModuleSettings", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  moduleKey: text("moduleKey").$type<SchemaEnum23>().notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  updatedByUserId: integer("updatedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PlatformModuleSetting = typeof platformModuleSettings.$inferSelect;
export type InsertPlatformModuleSetting = typeof platformModuleSettings.$inferInsert;

export const planningAssumptionTemplates = pgTable("planningAssumptionTemplates", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 160 }).notNull(),
  description: varchar("description", { length: 400 }),
  kind: text("kind").$type<SchemaEnum17>().notNull(),
  inputs: jsonb("inputs").notNull(),
  active: boolean("active").default(true).notNull(),
  createdByUserId: integer("createdByUserId").notNull(),
  updatedByUserId: integer("updatedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("planning_template_kind_active_idx").on(table.kind, table.active, table.updatedAt),
  index("planning_template_creator_idx").on(table.createdByUserId, table.createdAt),
]);
export type PlanningAssumptionTemplate = typeof planningAssumptionTemplates.$inferSelect;
export type InsertPlanningAssumptionTemplate = typeof planningAssumptionTemplates.$inferInsert;

// ─── Agent Operations: CRM, reusable listing templates, and transaction workspaces ──
export const agentContacts = pgTable("agentContacts", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  ownerUserId: integer("ownerUserId").notNull(),
  inquiryId: integer("inquiryId"),
  propertyId: integer("propertyId"),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 48 }),
  stage: text("stage").$type<SchemaEnum24>().default("new").notNull(),
  source: text("source").$type<SchemaEnum25>().default("manual").notNull(),
  notes: text("notes"),
  nextFollowUpAt: timestamp("nextFollowUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("agent_contact_owner_stage_idx").on(table.ownerUserId, table.stage),
  index("agent_contact_owner_followup_idx").on(table.ownerUserId, table.nextFollowUpAt),
  index("agent_contact_inquiry_idx").on(table.inquiryId),
]);
export type AgentContact = typeof agentContacts.$inferSelect;
export type InsertAgentContact = typeof agentContacts.$inferInsert;

export const leadActivities = pgTable("leadActivities", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  contactId: integer("contactId").notNull(),
  agentUserId: integer("agentUserId").notNull(),
  type: text("type").$type<SchemaEnum26>().default("note").notNull(),
  body: text("body").notNull(),
  fromStage: varchar("fromStage", { length: 32 }),
  toStage: varchar("toStage", { length: 32 }),
  activityAt: timestamp("activityAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("lead_activity_contact_idx").on(table.contactId, table.activityAt),
  index("lead_activity_agent_idx").on(table.agentUserId, table.activityAt),
]);
export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;

export const listingTemplates = pgTable("listingTemplates", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  ownerUserId: integer("ownerUserId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  category: text("category").$type<SchemaEnum27>().default("general").notNull(),
  templateData: jsonb("templateData").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("listing_template_owner_active_idx").on(table.ownerUserId, table.active),
]);
export type ListingTemplate = typeof listingTemplates.$inferSelect;
export type InsertListingTemplate = typeof listingTemplates.$inferInsert;

export const propertyTransactions = pgTable("propertyTransactions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull(),
  ownerUserId: integer("ownerUserId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  stage: text("stage").$type<SchemaEnum28>().default("intake").notNull(),
  status: text("status").$type<SchemaEnum29>().default("active").notNull(),
  counterpartyName: varchar("counterpartyName", { length: 160 }),
  counterpartyContact: varchar("counterpartyContact", { length: 160 }),
  amount: decimal("amount", { precision: 14, scale: 2 }),
  notes: text("notes"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("property_transaction_owner_stage_idx").on(table.ownerUserId, table.stage),
  index("property_transaction_property_idx").on(table.propertyId, table.createdAt),
]);
export type PropertyTransaction = typeof propertyTransactions.$inferSelect;
export type InsertPropertyTransaction = typeof propertyTransactions.$inferInsert;

// ─── Engagement and identity: collections extend favourites; IDs identify listings ──
export const wishlistCollections = pgTable("wishlistCollections", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  ownerUserId: integer("ownerUserId").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: varchar("description", { length: 280 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("wishlist_collection_owner_updated_idx").on(table.ownerUserId, table.updatedAt),
]);
export type WishlistCollection = typeof wishlistCollections.$inferSelect;
export type InsertWishlistCollection = typeof wishlistCollections.$inferInsert;

export const wishlistCollectionItems = pgTable("wishlistCollectionItems", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  collectionId: integer("collectionId").notNull(),
  propertyId: integer("propertyId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("wishlist_collection_property_unique").on(table.collectionId, table.propertyId),
  index("wishlist_item_property_idx").on(table.propertyId),
]);
export type WishlistCollectionItem = typeof wishlistCollectionItems.$inferSelect;
export type InsertWishlistCollectionItem = typeof wishlistCollectionItems.$inferInsert;

export const propertyIdentifiers = pgTable("propertyIdentifiers", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull().unique(),
  identifier: varchar("identifier", { length: 48 }).notNull().unique(),
  createdByUserId: integer("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("property_identifier_creator_idx").on(table.createdByUserId, table.createdAt),
]);
export type PropertyIdentifier = typeof propertyIdentifiers.$inferSelect;
export type InsertPropertyIdentifier = typeof propertyIdentifiers.$inferInsert;

// ─── Public sharing: QR and social surfaces derive only from approved listings ──
export const propertyShareRecords = pgTable("propertyShareRecords", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  propertyId: integer("propertyId").notNull().unique(),
  propertyIdentifierId: integer("propertyIdentifierId").notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  createdByUserId: integer("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("property_share_enabled_idx").on(table.enabled, table.updatedAt),
  index("property_share_creator_idx").on(table.createdByUserId, table.createdAt),
]);
export type PropertyShareRecord = typeof propertyShareRecords.$inferSelect;
export type InsertPropertyShareRecord = typeof propertyShareRecords.$inferInsert;

// ─── Referrals and rewards: explicit attribution, no inferred or fabricated credit ──
export const referralProfiles = pgTable("referralProfiles", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull().unique(),
  referralCode: varchar("referralCode", { length: 32 }).notNull().unique(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ReferralProfile = typeof referralProfiles.$inferSelect;
export type InsertReferralProfile = typeof referralProfiles.$inferInsert;

export const referralClaims = pgTable("referralClaims", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  referralProfileId: integer("referralProfileId").notNull(),
  referrerUserId: integer("referrerUserId").notNull(),
  referredUserId: integer("referredUserId").notNull().unique(),
  status: text("status").$type<SchemaEnum30>().default("pending").notNull(),
  reviewedByUserId: integer("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("referral_claim_referrer_status_idx").on(table.referrerUserId, table.status),
  index("referral_claim_profile_created_idx").on(table.referralProfileId, table.createdAt),
]);
export type ReferralClaim = typeof referralClaims.$inferSelect;
export type InsertReferralClaim = typeof referralClaims.$inferInsert;

export const rewardLedger = pgTable("rewardLedger", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("userId").notNull(),
  referralClaimId: integer("referralClaimId"),
  points: integer("points").notNull(),
  type: text("type").$type<SchemaEnum31>().notNull(),
  status: text("status").$type<SchemaEnum32>().default("pending").notNull(),
  note: varchar("note", { length: 280 }),
  createdByUserId: integer("createdByUserId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("reward_ledger_user_status_created_idx").on(table.userId, table.status, table.createdAt),
  index("reward_ledger_referral_idx").on(table.referralClaimId),
]);
export type RewardLedgerEntry = typeof rewardLedger.$inferSelect;
export type InsertRewardLedgerEntry = typeof rewardLedger.$inferInsert;
