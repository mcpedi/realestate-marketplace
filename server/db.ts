import { eq, desc, asc, and, like, sql, count, inArray, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  properties,
  propertyPhotos,
  inquiries,
  favorites,
  testimonials,
  blogPosts,
  categories,
  postCategories,
  subscriptionPlans,
  subscriptions,
  payments,
  featuredListings,
  propertyVideos,
  agencyProfiles,
  type InsertProperty,
  type InsertPropertyPhoto,
  type InsertInquiry,
  type InsertFavorite,
  type InsertTestimonial,
  type InsertBlogPost,
  type InsertPayment,
  type InsertFeaturedListing,
  type InsertPropertyVideo,
  type InsertAgencyProfile,
  userPreferences,
  propertyAlerts,
  accountNotifications,
  viewingBookings,
  propertyScores,
  propertyActivity,
  type InsertUserPreference,
  type InsertPropertyAlert,
  type InsertAccountNotification,
  type InsertViewingBooking,
  type InsertPropertyScore,
  type InsertPropertyActivity,
  planningAnalyses,
  type InsertPlanningAnalysis,
  propertyDocuments,
  propertyDocumentAccess,
  moduleAuditLogs,
  type InsertPropertyDocument,
  type InsertModuleAuditLog,
  propertyOperationRecords,
  type InsertPropertyOperationRecord,
  agentContacts,
  leadActivities,
  listingTemplates,
  propertyTransactions,
  type InsertAgentContact,
  type InsertLeadActivity,
  type InsertListingTemplate,
  type InsertPropertyTransaction,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "phone"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      (values as any)[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
  profilePicture?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const set: Record<string, unknown> = {};
  if (data.name !== undefined) set.name = data.name;
  if (data.email !== undefined) set.email = data.email;
  if (data.phone !== undefined) set.phone = data.phone;
  if (data.location !== undefined) set.location = data.location;
  if (data.bio !== undefined) set.bio = data.bio;
  if (data.profilePicture !== undefined) set.profilePicture = data.profilePicture;
  if (Object.keys(set).length === 0) return;
  await db.update(users).set(set as any).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(users).where(eq(users.id, id));
  return true;
}

// ─── Properties ──────────────────────────────────────────────────────────────

export async function createProperty(data: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(properties).values(data);
  return result;
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function incrementPropertyViews(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(properties).set({ viewsCount: sql`${properties.viewsCount} + 1` }).where(eq(properties.id, id));
}

export async function updateProperty(id: number, data: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) return;
  await db.update(properties).set(data as any).where(eq(properties.id, id));
}

export async function deleteProperty(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(propertyPhotos).where(eq(propertyPhotos.propertyId, id));
  await db.delete(inquiries).where(eq(inquiries.propertyId, id));
  await db.delete(favorites).where(eq(favorites.propertyId, id));
  await db.delete(properties).where(eq(properties.id, id));
  return true;
}

export interface PropertyFilters {
  location?: string;
  propertyType?: string;
  listingType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getProperties(filters: PropertyFilters = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  const conditions = [];
  if (filters.status) conditions.push(eq(properties.status, filters.status as any));
  if (filters.location) conditions.push(like(properties.location, `%${filters.location}%`));
  if (filters.propertyType) conditions.push(eq(properties.propertyType, filters.propertyType as any));
  if (filters.listingType) conditions.push(eq(properties.listingType, filters.listingType as any));
  if (filters.minPrice !== undefined) conditions.push(sql`${properties.price} >= ${filters.minPrice}`);
  if (filters.maxPrice !== undefined) conditions.push(sql`${properties.price} <= ${filters.maxPrice}`);
  if (filters.bedrooms !== undefined) conditions.push(sql`${properties.bedrooms} >= ${filters.bedrooms}`);
  if (filters.bathrooms !== undefined) conditions.push(sql`${properties.bathrooms} >= ${filters.bathrooms}`);
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const offset = (page - 1) * limit;
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalResult] = await db.select({ count: count() }).from(properties).where(whereClause);
  // Collect premium featured placements (from featuredListings) so they rank first.
  let featuredPropertyIds: Set<number>;
  try {
    const activeFeatured = await db
      .select()
      .from(featuredListings)
      .where(and(eq(featuredListings.active, true), gt(featuredListings.featuredUntil, new Date())));
    featuredPropertyIds = new Set(activeFeatured.map((f) => f.propertyId));
  } catch {
    featuredPropertyIds = new Set();
  }
  const rawItems = await db
    .select()
    .from(properties)
    .where(whereClause)
    .orderBy(desc(properties.featured), desc(properties.createdAt))
    .limit(limit)
    .offset(offset);
  const items = await Promise.all(rawItems.map(async (p) => {
    const photos = await db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, p.id)).orderBy(asc(propertyPhotos.sortOrder)).limit(1);
    return {
      ...p,
      featured: featuredPropertyIds.has(p.id) || p.featured,
      photos: photos.map((ph) => ({ url: ph.url })),
    };
  }));
  const featuredItems = items.filter((i) => i.featured);
  const regularItems = items.filter((i) => !i.featured);
  return { items: [...featuredItems, ...regularItems], total: totalResult?.count || 0 };
}

export async function getFeaturedProperties() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(properties)
    .where(and(eq(properties.featured, true), eq(properties.status, "approved")))
    .orderBy(desc(properties.createdAt))
    .limit(8);
  return Promise.all(rows.map(async (p) => {
    const photos = await db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, p.id)).orderBy(asc(propertyPhotos.sortOrder)).limit(1);
    return { ...p, photos: photos.map((ph) => ({ url: ph.url })) };
  }));
}

export async function getLatestProperties(limit = 8) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.status, "approved"))
    .orderBy(desc(properties.featured), desc(properties.createdAt))
    .limit(limit);
  const rowsWithPhotos = await Promise.all(rows.map(async (p) => {
    const photos = await db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, p.id)).orderBy(asc(propertyPhotos.sortOrder)).limit(1);
    return { ...p, photos: photos.map((ph) => ({ url: ph.url })) };
  }));
  const featuredItems = rowsWithPhotos.filter((i) => i.featured);
  const regularItems = rowsWithPhotos.filter((i) => !i.featured);
  return [...featuredItems, ...regularItems];
}

export async function getUserProperties(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(properties).where(eq(properties.userId, userId)).orderBy(desc(properties.createdAt));
  return Promise.all(rows.map(async (p) => {
    const photos = await db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, p.id)).orderBy(asc(propertyPhotos.sortOrder)).limit(1);
    return { ...p, photos: photos.map((ph) => ({ url: ph.url })) };
  }));
}

export async function getPendingProperties() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(properties).where(eq(properties.status, "pending")).orderBy(desc(properties.createdAt));
}

export async function approveProperty(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(properties).set({ status: "approved" }).where(eq(properties.id, id));
}

export async function rejectProperty(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(properties).set({ status: "rejected" }).where(eq(properties.id, id));
}

// ─── Property Photos ─────────────────────────────────────────────────────────

export async function createPropertyPhoto(data: InsertPropertyPhoto) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(propertyPhotos).values(data);
  return result;
}

export async function getPropertyPhotos(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, propertyId)).orderBy(asc(propertyPhotos.sortOrder));
}

export async function deletePropertyPhoto(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(propertyPhotos).where(eq(propertyPhotos.id, id));
  return true;
}

export async function deleteAllPropertyPhotos(propertyId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(propertyPhotos).where(eq(propertyPhotos.propertyId, propertyId));
  return true;
}

// ─── Inquiries ───────────────────────────────────────────────────────────────

export async function createInquiry(data: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inquiries).values(data);
  return result;
}

export async function getPropertyInquiries(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(inquiries).where(eq(inquiries.propertyId, propertyId)).orderBy(desc(inquiries.createdAt));
}

export async function getUserInquiries(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const props = await getUserProperties(userId);
  const propIds = props.map((p) => p.id);
  if (propIds.length === 0) return [];
  return db.select().from(inquiries).where(inArray(inquiries.propertyId, propIds)).orderBy(desc(inquiries.createdAt));
}

// ─── Favorites ───────────────────────────────────────────────────────────────

export async function toggleFavorite(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) return { isFavorite: false };
  const existing = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId))).limit(1);
  if (existing.length > 0) {
    await db.delete(favorites).where(eq(favorites.id, existing[0].id));
    return { isFavorite: false };
  }
  await db.insert(favorites).values({ userId, propertyId });
  return { isFavorite: true };
}

export async function getFavoriteProperties(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const favs = await db.select().from(favorites).where(eq(favorites.userId, userId));
  const propIds = favs.map((f) => f.propertyId);
  if (propIds.length === 0) return [];
  return db.select().from(properties).where(inArray(properties.id, propIds)).orderBy(desc(properties.createdAt));
}

export async function isFavorite(userId: number, propertyId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(favorites).where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId))).limit(1);
  return result.length > 0;
}

// ─── Testimonials ────────────────────────────────────────────────────────────

export async function getTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
}

export async function getFeaturedTestimonials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(testimonials).where(eq(testimonials.featured, true)).limit(6);
}

export async function createTestimonial(data: InsertTestimonial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(testimonials).values(data);
  return result;
}

export async function deleteTestimonial(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(testimonials).where(eq(testimonials.id, id));
  return true;
}

// ─── Blog Posts ──────────────────────────────────────────────────────────────

export async function getPublishedBlogPosts(input?: { search?: string; category?: string; page?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };
  
  const allPosts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.published, true))
    .orderBy(desc(blogPosts.createdAt));
  
  const total = allPosts.length;
  const page = input?.page || 1;
  const limit = input?.limit || 9;
  const offset = (page - 1) * limit;
  
  let items = allPosts.slice(offset, offset + limit);
  
  if (input?.search) {
    const search = input.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(search) ||
        p.content.toLowerCase().includes(search) ||
        p.excerpt?.toLowerCase().includes(search)
    );
  }
  
  return { items, total };
}

export async function getBlogPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getBlogPostById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllBlogPosts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
}

export async function createBlogPost(data: InsertBlogPost) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(blogPosts).values(data);
  return result;
}

export async function updateBlogPost(id: number, data: Partial<InsertBlogPost>) {
  const db = await getDb();
  if (!db) return;
  await db.update(blogPosts).set(data as any).where(eq(blogPosts.id, id));
}

export async function deleteBlogPost(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(postCategories).where(eq(postCategories.postId, id));
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  return true;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function getCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function createCategory(data: { name: string; slug: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(categories).values(data);
  return result;
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(postCategories).where(eq(postCategories.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  return true;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalProperties: 0, pendingProperties: 0, approvedProperties: 0, totalUsers: 0, totalInquiries: 0, totalTestimonials: 0 };
  const [totalProps] = await db.select({ count: count() }).from(properties);
  const [pendingProps] = await db.select({ count: count() }).from(properties).where(eq(properties.status, "pending"));
  const [approvedProps] = await db.select({ count: count() }).from(properties).where(eq(properties.status, "approved"));
  const [totalUsers] = await db.select({ count: count() }).from(users);
  const [totalInq] = await db.select({ count: count() }).from(inquiries);
  const [totalTest] = await db.select({ count: count() }).from(testimonials);
  return {
    totalProperties: totalProps?.count || 0,
    pendingProperties: pendingProps?.count || 0,
    approvedProperties: approvedProps?.count || 0,
    totalUsers: totalUsers?.count || 0,
    totalInquiries: totalInq?.count || 0,
    totalTestimonials: totalTest?.count || 0,
  };
}

// ─── Premium: Subscription Plans ─────────────────────────────────────────────

export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
}

export async function getSubscriptionPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result[0];
}

// ─── Premium: Subscriptions ──────────────────────────────────────────────────

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const subs = await db
    .select()
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  if (subs.length === 0) return undefined;
  return {
    subscription: subs[0].subscriptions,
    plan: subs[0].subscriptionPlans,
  };
}

export async function isUserPremium(userId: number): Promise<boolean> {
  const sub = await getUserSubscription(userId);
  return !!sub && !!sub.plan;
}

export async function createSubscriptionRecord(data: {
  userId: number;
  planId: number;
  endDate: Date;
}) {
  const db = await getDb();
  if (!db) return undefined;
  const now = new Date();
  const [result] = await db
    .insert(subscriptions)
    .values({
      userId: data.userId,
      planId: data.planId,
      status: "active",
      startDate: now,
      endDate: data.endDate,
      autoRenew: true,
      lastPaymentDate: now,
    })
    .$returningId();
  if (!result) return undefined;
  return getUserSubscriptionById(result.id);
}

export async function getUserSubscriptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .where(eq(subscriptions.id, id))
    .limit(1);
  if (rows.length === 0) return undefined;
  return { subscription: rows[0].subscriptions, plan: rows[0].subscriptionPlans };
}

export async function getSubscriptionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);
  return result[0];
}

export async function cancelSubscriptionRecord(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(subscriptions).set({ status: "cancelled" }).where(eq(subscriptions.id, id));
  return true;
}

export async function getUserMaxImages(userId: number): Promise<number> {
  const sub = await getUserSubscription(userId);
  if (sub?.plan) return sub.plan.maxImages ?? 10;
  return 10; // Free tier default
}

export async function getUserMaxVideos(userId: number): Promise<number> {
  const sub = await getUserSubscription(userId);
  if (sub?.plan) return sub.plan.maxVideos ?? 0;
  return 0; // Free tier: no videos
}

export async function getAllSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(subscriptions)
    .innerJoin(subscriptionPlans, eq(subscriptions.planId, subscriptionPlans.id))
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(100);
}

// ─── Premium: Payments ───────────────────────────────────────────────────────

export async function createPaymentRecord(payment: Omit<InsertPayment, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(payments).values(payment).$returningId();
  if (!result) return undefined;
  const rows = await db.select().from(payments).where(eq(payments.id, result.id)).limit(1);
  return rows[0];
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)).limit(50);
}

export async function updateSubscriptionPlan(id: number, data: { name?: string; price?: number; maxImages?: number; maxVideos?: number; active?: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptionPlans).set(data).where(eq(subscriptionPlans.id, id));
}

export async function grantPremiumSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  // Find or create the Premium plan
  let plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, "Premium")).limit(1);
  if (!plan[0]) {
    await db.insert(subscriptionPlans).values({
      name: "Premium",
      price: 1500,
      currency: "KES",
      period: "monthly",
      maxImages: 20,
      maxVideos: 2,
      description: "Full premium benefits",
    });
    plan = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.name, "Premium")).limit(1);
  }
  if (!plan[0]) throw new Error("Premium plan unavailable");
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 12);
  await db.insert(subscriptions).values({
    userId,
    planId: plan[0].id,
    status: "active",
    startDate: new Date(),
    endDate,
  });
  return { success: true };
}

export async function getSubscriptionRevenue() {
  const db = await getDb();
  if (!db) return { total: 0, count: 0 };
  const result = await db
    .select({ sum: sql<number>`COALESCE(SUM(${payments.amount}), 0)`, count: count() })
    .from(payments)
    .where(and(eq(payments.status, "completed"), eq(payments.type, "subscription")));
  return { total: result[0]?.sum || 0, count: result[0]?.count || 0 };
}

// ─── Premium: Featured Listings ──────────────────────────────────────────────

export async function getUserFeaturedListings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(featuredListings).where(eq(featuredListings.userId, userId)).orderBy(desc(featuredListings.createdAt));
}

export async function getActiveFeaturedListingForProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(featuredListings)
    .where(
      and(
        eq(featuredListings.propertyId, propertyId),
        eq(featuredListings.active, true),
        gt(featuredListings.featuredUntil, new Date())
      )
    )
    .limit(1);
  return result[0];
}

export async function createFeaturedListingRecord(data: Omit<InsertFeaturedListing, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(featuredListings).values(data).$returningId();
  if (!result) return undefined;
  const rows = await db.select().from(featuredListings).where(eq(featuredListings.id, result.id)).limit(1);
  return rows[0];
}

export async function getAllFeaturedListings() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(featuredListings)
    .where(and(eq(featuredListings.active, true), gt(featuredListings.featuredUntil, new Date())))
    .orderBy(desc(featuredListings.featuredUntil));
}

export async function deactivateFeaturedListingRecord(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(featuredListings).set({ active: false }).where(eq(featuredListings.id, id));
  return true;
}

// ─── Premium: Property Videos ────────────────────────────────────────────────

export async function getPropertyVideos(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyVideos).where(eq(propertyVideos.propertyId, propertyId));
}

export async function addPropertyVideo(video: Omit<InsertPropertyVideo, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(propertyVideos).values(video).$returningId();
  if (!result) return undefined;
  const rows = await db.select().from(propertyVideos).where(eq(propertyVideos.id, result.id)).limit(1);
  return rows[0];
}

export async function getPropertyVideoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(propertyVideos).where(eq(propertyVideos.id, id)).limit(1);
  return result[0];
}

export async function deletePropertyVideoRecord(id: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(propertyVideos).where(eq(propertyVideos.id, id));
  return true;
}

// ─── Premium: Agency Profiles ────────────────────────────────────────────────

export async function getAgencyProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agencyProfiles).where(eq(agencyProfiles.userId, userId)).limit(1);
  return result[0];
}

export async function createAgencyProfileRecord(data: Omit<InsertAgencyProfile, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) return false;
  await db.insert(agencyProfiles).values(data);
  return true;
}

export async function updateAgencyProfileRecord(
  userId: number,
  data: Partial<Omit<InsertAgencyProfile, "id" | "userId" | "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) return false;
  const set: Record<string, unknown> = {};
  if (data.agencyName !== undefined) set.agencyName = data.agencyName;
  if (data.logoUrl !== undefined) set.logoUrl = data.logoUrl;
  if (data.bannerUrl !== undefined) set.bannerUrl = data.bannerUrl;
  if (data.description !== undefined) set.description = data.description;
  if (data.website !== undefined) set.website = data.website;
  if (data.socialMedia !== undefined) set.socialMedia = data.socialMedia;
  if (data.verified !== undefined) set.verified = data.verified;
  if (Object.keys(set).length === 0) return false;
  await db.update(agencyProfiles).set(set).where(eq(agencyProfiles.userId, userId));
  return true;
}

export async function countPropertySaves(propertyId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: count() }).from(favorites).where(eq(favorites.propertyId, propertyId));
  return result[0]?.count || 0;
}

// ─── Leads (buyer inquiry tracking for sellers) ──────────────────────────────

export type LeadStatus = "new" | "contacted" | "viewing" | "negotiating" | "closed" | "lost";

export interface SellerLead {
  leadId: number;
  propertyId: number;
  propertyTitle: string;
  propertyType: string | null;
  price: number;
  status: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  message: string;
  buyerUserId: number | null;
  createdAt: Date;
}

export async function getSellerLeads(userId: number): Promise<SellerLead[]> {
  const db = await getDb();
  if (!db) return [];
  const props = await getUserProperties(userId);
  if (props.length === 0) return [];
  const rows = await db
    .select()
    .from(inquiries)
    .where(inArray(inquiries.propertyId, props.map((p) => p.id)))
    .orderBy(desc(inquiries.createdAt));
  const propById = new Map(props.map((p) => [p.id, p]));
  return rows.map((inq) => {
    const prop = propById.get(inq.propertyId);
    return {
      leadId: inq.id,
      propertyId: inq.propertyId,
      propertyTitle: prop?.title ?? "Unknown property",
      propertyType: (prop as { type?: string | null } | undefined)?.type ?? null,
      price: (prop as { price?: number } | undefined)?.price ?? 0,
      status: inq.leadStatus,
      buyerName: inq.name,
      buyerEmail: inq.email,
      buyerPhone: inq.phone ?? null,
      message: inq.message,
      buyerUserId: inq.userId,
      createdAt: inq.createdAt,
    };
  });
}

export async function updateLeadStatus(leadId: number, userId: number, status: LeadStatus): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Ensure the lead belongs to one of the seller's own properties
  const leads = await getSellerLeads(userId);
  const lead = leads.find((l) => l.leadId === leadId);
  if (!lead) return false;
  await db.update(inquiries).set({ leadStatus: status }).where(eq(inquiries.id, leadId));
  return true;
}

export interface LeadStats {
  total: number;
  newLeads: number;
  contacted: number;
  viewing: number;
  negotiating: number;
  closed: number;
  lost: number;
  conversionRate: number;
}

export async function getLeadStats(userId: number): Promise<LeadStats> {
  const leads = await getSellerLeads(userId);
  const stats: LeadStats = {
    total: leads.length,
    newLeads: leads.filter((l) => l.status === "new").length,
    contacted: leads.filter((l) => l.status === "contacted").length,
    viewing: leads.filter((l) => l.status === "viewing").length,
    negotiating: leads.filter((l) => l.status === "negotiating").length,
    closed: leads.filter((l) => l.status === "closed").length,
    lost: leads.filter((l) => l.status === "lost").length,
    conversionRate: 0,
  };
  if (stats.total > 0) {
    stats.conversionRate = Math.round((stats.closed / stats.total) * 100);
  }
  return stats;
}

/**
 * Small, live summary intended for persistent account navigation. A message is
 * a new buyer inquiry on one of the member's listings; notifications are
 * persisted account events that have not been read by the member.
 */
export async function getAccountActivitySummary(userId: number) {
  const [leadStats, unreadNotificationCount] = await Promise.all([
    getLeadStats(userId),
    countUnreadNotifications(userId),
  ]);
  return {
    newLeadCount: leadStats.newLeads,
    unreadNotificationCount,
  };
}

// ─── Modern Features ─────────────────────────────────────────────────────────

// ── User preferences ──────────────────────────────────────────────────────────
export async function getUserPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function upsertUserPreferences(userId: number, data: Partial<InsertUserPreference>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getUserPreferences(userId);
  if (existing) {
    await db.update(userPreferences).set(data as any).where(eq(userPreferences.userId, userId));
  } else {
    await db.insert(userPreferences).values({ userId, ...data } as InsertUserPreference);
  }
}

// ── Activity tracking ─────────────────────────────────────────────────────────
export async function recordPropertyActivity(data: InsertPropertyActivity) {
  const db = await getDb();
  if (!db) return;
  await db.insert(propertyActivity).values(data);
}

export async function getUserActivity(userId: number, eventType?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const conds = [eq(propertyActivity.userId, userId)];
  if (eventType) conds.push(eq(propertyActivity.eventType, eventType as any));
  return db.select().from(propertyActivity).where(and(...conds)).orderBy(desc(propertyActivity.createdAt)).limit(limit);
}

export async function getProfileHubSummary(userId: number) {
  const [savedProperties, alerts, bookings, inquiries, activity] = await Promise.all([
    getFavoriteProperties(userId),
    getUserAlerts(userId),
    getBuyerBookings(userId),
    getUserInquiries(userId),
    getUserActivity(userId, "view", 18),
  ]);

  const recentlyViewedIds: number[] = [];
  const seen = new Set<number>();
  for (const entry of activity) {
    if (entry.propertyId && !seen.has(entry.propertyId)) {
      seen.add(entry.propertyId);
      recentlyViewedIds.push(entry.propertyId);
    }
    if (recentlyViewedIds.length === 3) break;
  }

  const recentlyViewed = (
    await Promise.all(
      recentlyViewedIds.map(async (propertyId) => {
        const [property, photos] = await Promise.all([
          getPropertyById(propertyId),
          getPropertyPhotos(propertyId),
        ]);
        if (!property) return null;
        const imageUrl: string | null = photos.length > 0 ? photos[0].url : null;
        return {
          id: property.id,
          title: property.title,
          imageUrl,
        };
      }),
    )
  ).filter((property): property is { id: number; title: string; imageUrl: string | null } => property !== null);

  return {
    savedCount: savedProperties.length,
    alertCount: alerts.filter((alert) => alert.active).length,
    viewingCount: bookings.filter((booking) => booking.status !== "cancelled").length,
    inquiryCount: inquiries.length,
    recentlyViewed,
  };
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export async function createAlert(data: InsertPropertyAlert) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(propertyAlerts).values(data);
  return data;
}

export async function getUserAlerts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(propertyAlerts).where(eq(propertyAlerts.userId, userId)).orderBy(desc(propertyAlerts.createdAt));
  return rows.map((r) => {
    let parsed = null;
    if (r.criteria) {
      try {
        parsed = JSON.parse(r.criteria as string);
      } catch {
        parsed = null;
      }
    }
    return { ...r, criteria: parsed };
  });
}

export async function deleteAlert(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(propertyAlerts).where(and(eq(propertyAlerts.id, id), eq(propertyAlerts.userId, userId)));
  return true;
}

export async function updateAlertStatus(id: number, userId: number, active: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(propertyAlerts).set({ active }).where(and(eq(propertyAlerts.id, id), eq(propertyAlerts.userId, userId)));
}

// ── In-app notifications ─────────────────────────────────────────────────────
export async function createAccountNotification(data: InsertAccountNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(accountNotifications).values(data);
}

export async function getAccountNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(accountNotifications)
    .where(eq(accountNotifications.userId, userId))
    .orderBy(desc(accountNotifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ total: count() })
    .from(accountNotifications)
    .where(and(eq(accountNotifications.userId, userId), isNull(accountNotifications.readAt)));
  return rows[0]?.total ?? 0;
}

export async function markAccountNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db
    .update(accountNotifications)
    .set({ readAt: new Date() })
    .where(and(eq(accountNotifications.id, id), eq(accountNotifications.userId, userId)));
  return true;
}

/**
 * Property details enriched with first photo, for matching/alert payloads.
 */
export async function getPropertyWithPhoto(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  const p = rows.length > 0 ? rows[0] : undefined;
  if (!p) return undefined;
  const photos = await db
    .select()
    .from(propertyPhotos)
    .where(eq(propertyPhotos.propertyId, id))
    .orderBy(asc(propertyPhotos.sortOrder))
    .limit(1);
  return { ...p, photos: photos.map((ph) => ({ url: ph.url })) };
}

/**
 * Check saved properties for price drops and re-arm price-drop alerts.
 * Returns properties whose price decreased since last check.
 */
export async function checkPriceDrops() {
  const db = await getDb();
  if (!db) return [];
  // Find properties whose current price is lower than their original list price
  // (stored price before update is not persisted, so we compare against saved
  // favorites: a drop is detected when a user's favorited property price is
  // lower than the highest price we have recorded for it).
  const drops: Array<{ userId: number; propertyId: number; newPrice: number; alertIds: number[] }> = [];
  const alertRows = await db
    .select()
    .from(propertyAlerts)
    .where(and(eq(propertyAlerts.type, "priceDrop"), eq(propertyAlerts.active, true)))
    .orderBy(asc(propertyAlerts.userId), asc(propertyAlerts.propertyId));
  const byKey = new Map<string, Array<{ userId: number; propertyId: number; alertId: number }>>();
  for (const a of alertRows) {
    if (!a.propertyId) continue;
    const key = `${a.userId}-${a.propertyId}`;
    const arr = byKey.get(key) || [];
    arr.push({ userId: a.userId, propertyId: a.propertyId, alertId: a.id });
    byKey.set(key, arr);
  }
  // Track last known prices in-memory keys; DB cannot store them without schema change.
  // We compare current price against any previous value stored in criteria.lastKnownPrice.
  for (const a of alertRows) {
    if (!a.propertyId) continue;
    const crit = (a.criteria || {}) as Record<string, unknown>;
    const lastKnown = typeof crit.lastKnownPrice === "number" ? crit.lastKnownPrice : undefined;
    const p = await getPropertyWithPhoto(a.propertyId);
    if (!p) continue;
    if (lastKnown !== undefined && p.price < lastKnown) {
      drops.push({ userId: a.userId, propertyId: a.propertyId, newPrice: p.price, alertIds: [a.id] });
      await createAccountNotification({
        userId: a.userId,
        type: "price_drop",
        title: "Price drop detected",
        message: `${p.title} is now listed at KSh ${Math.round(p.price).toLocaleString()}.`,
        href: `/properties/${p.id}`,
      } as InsertAccountNotification);
    }
    // Re-arm: store current price so next drop can be detected.
    await db
      .update(propertyAlerts)
      .set({ criteria: JSON.stringify({ ...((a.criteria || {}) as Record<string, unknown>), lastKnownPrice: p.price }) })
      .where(eq(propertyAlerts.id, a.id));
  }
  return drops;
}

// ── Viewing bookings ──────────────────────────────────────────────────────────
export async function createViewingBooking(data: InsertViewingBooking) {
  const db = await getDb();
  if (!db) return undefined;
  await db.insert(viewingBookings).values(data);
  return data;
}

export async function getBuyerBookings(buyerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(viewingBookings).where(eq(viewingBookings.buyerId, buyerId)).orderBy(desc(viewingBookings.scheduledAt));
}

export async function getSellerPendingBookings(sellerId: number) {
  const db = await getDb();
  if (!db) return [];
  // Bookings for properties owned by this seller
  const sellerProps = await db.select().from(properties).where(eq(properties.userId, sellerId));
  const ids = sellerProps.map((p) => p.id);
  if (ids.length === 0) return [];
  return db.select().from(viewingBookings).where(inArray(viewingBookings.propertyId, ids)).orderBy(desc(viewingBookings.scheduledAt));
}

export async function updateBookingStatus(id: number, buyerId: number, status: "pending" | "confirmed" | "cancelled" | "completed") {
  const db = await getDb();
  if (!db) return false;
  await db.update(viewingBookings).set({ status }).where(and(eq(viewingBookings.id, id), eq(viewingBookings.buyerId, buyerId)));
  return true;
}

export async function updateBookingStatusBySeller(id: number, status: "pending" | "confirmed" | "cancelled" | "completed") {
  const db = await getDb();
  if (!db) return false;
  await db.update(viewingBookings).set({ status }).where(eq(viewingBookings.id, id));
  return true;
}

// ── Property scores ───────────────────────────────────────────────────────────
export async function getPropertyScore(propertyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(propertyScores).where(eq(propertyScores.propertyId, propertyId)).limit(1);
  return rows.length > 0 ? rows[0] : undefined;
}

export async function upsertPropertyScore(propertyId: number, data: InsertPropertyScore) {
  const db = await getDb();
  if (!db) return;
  const existing = await getPropertyScore(propertyId);
  const row = { ...data, propertyId };
  if (existing) {
    await db.update(propertyScores).set(row as any).where(eq(propertyScores.propertyId, propertyId));
  } else {
    await db.insert(propertyScores).values(row);
  }
}

// ── Property detail helpers for modern features ───────────────────────────────
export async function getPropertyWithPhotos(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const p = await getPropertyById(id);
  if (!p) return undefined;
  const photos = await db
    .select()
    .from(propertyPhotos)
    .where(eq(propertyPhotos.propertyId, id))
    .orderBy(asc(propertyPhotos.sortOrder));
  return { ...p, photos: photos.map((ph) => ({ id: ph.id, url: ph.url, fileKey: ph.fileKey, sortOrder: ph.sortOrder })) };
}

// ─── Planning Studio ─────────────────────────────────────────────────────────

export async function createPlanningAnalysis(data: Omit<InsertPlanningAnalysis, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(planningAnalyses).values(data).$returningId();
  if (!result) return undefined;
  const rows = await db.select().from(planningAnalyses).where(eq(planningAnalyses.id, result.id)).limit(1);
  return rows[0];
}

export async function getUserPlanningAnalyses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planningAnalyses).where(eq(planningAnalyses.userId, userId)).orderBy(desc(planningAnalyses.updatedAt)).limit(50);
}

export async function deletePlanningAnalysis(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(planningAnalyses).where(and(eq(planningAnalyses.id, id), eq(planningAnalyses.userId, userId)));
  return result[0].affectedRows > 0;
}

// ─── Property Operations: Documents and audit logs ────────────────────────────

export async function createPropertyDocument(data: Omit<InsertPropertyDocument, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(propertyDocuments).values(data).$returningId();
  if (!result) return undefined;
  const rows = await db.select().from(propertyDocuments).where(eq(propertyDocuments.id, result.id)).limit(1);
  return rows[0];
}

export async function getPropertyDocuments(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyDocuments).where(and(eq(propertyDocuments.propertyId, propertyId), isNull(propertyDocuments.deletedAt))).orderBy(desc(propertyDocuments.createdAt));
}

export async function getPropertyDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(propertyDocuments).where(and(eq(propertyDocuments.id, id), isNull(propertyDocuments.deletedAt))).limit(1);
  return rows[0];
}

export async function getDocumentAccess(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(propertyDocumentAccess).where(and(eq(propertyDocumentAccess.documentId, documentId), eq(propertyDocumentAccess.userId, userId))).limit(1);
  return rows[0];
}

export async function grantDocumentAccess(documentId: number, userId: number, permission: "view" | "download", grantedByUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getDocumentAccess(documentId, userId);
  if (existing) {
    await db.update(propertyDocumentAccess).set({ permission, grantedByUserId }).where(eq(propertyDocumentAccess.id, existing.id));
    return existing.id;
  }
  const [result] = await db.insert(propertyDocumentAccess).values({ documentId, userId, permission, grantedByUserId }).$returningId();
  return result?.id;
}

export async function softDeletePropertyDocument(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(propertyDocuments).set({ deletedAt: new Date() }).where(and(eq(propertyDocuments.id, id), isNull(propertyDocuments.deletedAt)));
  return result[0].affectedRows > 0;
}

export async function createModuleAuditLog(data: Omit<InsertModuleAuditLog, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) return undefined;
  const [result] = await db.insert(moduleAuditLogs).values(data).$returningId();
  return result?.id;
}

export async function getPropertyAuditLogs(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moduleAuditLogs).where(eq(moduleAuditLogs.propertyId, propertyId)).orderBy(desc(moduleAuditLogs.createdAt)).limit(50);
}

export async function createPropertyOperationRecord(data: Omit<InsertPropertyOperationRecord, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(propertyOperationRecords).values(data).$returningId();
  if (!result) return undefined;
  const rows = await db.select().from(propertyOperationRecords).where(eq(propertyOperationRecords.id, result.id)).limit(1);
  return rows[0];
}

export async function getOwnerPropertyOperationRecords(ownerUserId: number, filters?: { propertyId?: number; type?: "lease" | "inspection" | "maintenance" | "rent" | "vacancy" }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(propertyOperationRecords.ownerUserId, ownerUserId)];
  if (filters?.propertyId) conditions.push(eq(propertyOperationRecords.propertyId, filters.propertyId));
  if (filters?.type) conditions.push(eq(propertyOperationRecords.type, filters.type));
  return db.select().from(propertyOperationRecords).where(and(...conditions)).orderBy(desc(propertyOperationRecords.updatedAt)).limit(100);
}

export async function getPropertyOperationRecordById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(propertyOperationRecords).where(eq(propertyOperationRecords.id, id)).limit(1);
  return rows[0];
}

export async function updatePropertyOperationRecord(id: number, data: Partial<Pick<InsertPropertyOperationRecord, "status" | "priority" | "dueDate" | "completedAt" | "details" | "amount">>) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(propertyOperationRecords).set(data).where(eq(propertyOperationRecords.id, id));
  return result[0].affectedRows > 0;
}

export async function getOwnerPropertyOperationSummary(ownerUserId: number) {
  const records = await getOwnerPropertyOperationRecords(ownerUserId);
  const open = records.filter((record) => !["completed", "closed", "paid", "resolved"].includes(record.status)).length;
  const dueSoon = records.filter((record) => record.dueDate && record.dueDate.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000 && !["completed", "closed", "paid", "resolved"].includes(record.status)).length;
  return { total: records.length, open, dueSoon, byType: { lease: records.filter((record) => record.type === "lease").length, inspection: records.filter((record) => record.type === "inspection").length, maintenance: records.filter((record) => record.type === "maintenance").length, rent: records.filter((record) => record.type === "rent").length, vacancy: records.filter((record) => record.type === "vacancy").length } };
}

// ─── Agent Operations: CRM, activity, templates, and transaction workspace ────

export async function createAgentContact(data: Omit<InsertAgentContact, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(agentContacts).values(data).$returningId();
  if (!result) return undefined;
  return (await db.select().from(agentContacts).where(eq(agentContacts.id, result.id)).limit(1))[0];
}

export async function getAgentContacts(ownerUserId: number, stage?: "new" | "contacted" | "qualified" | "viewing" | "negotiating" | "won" | "lost") {
  const db = await getDb();
  if (!db) return [];
  const condition = stage ? and(eq(agentContacts.ownerUserId, ownerUserId), eq(agentContacts.stage, stage)) : eq(agentContacts.ownerUserId, ownerUserId);
  return db.select().from(agentContacts).where(condition).orderBy(asc(agentContacts.nextFollowUpAt), desc(agentContacts.updatedAt)).limit(150);
}

export async function getAgentContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(agentContacts).where(eq(agentContacts.id, id)).limit(1))[0];
}

export async function updateAgentContact(id: number, data: Partial<Pick<InsertAgentContact, "stage" | "notes" | "nextFollowUpAt">>) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(agentContacts).set(data).where(eq(agentContacts.id, id));
  return result[0].affectedRows > 0;
}

export async function createLeadActivity(data: Omit<InsertLeadActivity, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(leadActivities).values(data).$returningId();
  if (!result) return undefined;
  return (await db.select().from(leadActivities).where(eq(leadActivities.id, result.id)).limit(1))[0];
}

export async function getLeadActivities(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leadActivities).where(eq(leadActivities.contactId, contactId)).orderBy(desc(leadActivities.activityAt)).limit(75);
}

export async function getAgentOperationsSummary(ownerUserId: number) {
  const [contacts, transactions, marketplaceLeads] = await Promise.all([getAgentContacts(ownerUserId), getAgentTransactions(ownerUserId), getSellerLeads(ownerUserId)]);
  const followUpsDue = contacts.filter((contact) => contact.nextFollowUpAt && contact.nextFollowUpAt.getTime() <= Date.now() + 24 * 60 * 60 * 1000 && !["won", "lost"].includes(contact.stage)).length;
  return {
    totalContacts: contacts.length,
    activeContacts: contacts.filter((contact) => !["won", "lost"].includes(contact.stage)).length,
    followUpsDue,
    openTransactions: transactions.filter((transaction) => transaction.status === "active").length,
    marketplaceLeads: marketplaceLeads.length,
    byStage: { new: contacts.filter((contact) => contact.stage === "new").length, contacted: contacts.filter((contact) => contact.stage === "contacted").length, qualified: contacts.filter((contact) => contact.stage === "qualified").length, viewing: contacts.filter((contact) => contact.stage === "viewing").length, negotiating: contacts.filter((contact) => contact.stage === "negotiating").length, won: contacts.filter((contact) => contact.stage === "won").length, lost: contacts.filter((contact) => contact.stage === "lost").length },
  };
}

export async function createListingTemplate(data: Omit<InsertListingTemplate, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(listingTemplates).values(data).$returningId();
  if (!result) return undefined;
  return (await db.select().from(listingTemplates).where(eq(listingTemplates.id, result.id)).limit(1))[0];
}

export async function getListingTemplates(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(listingTemplates).where(eq(listingTemplates.ownerUserId, ownerUserId)).orderBy(desc(listingTemplates.updatedAt)).limit(50);
}

export async function deleteListingTemplate(id: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.delete(listingTemplates).where(eq(listingTemplates.id, id));
  return result[0].affectedRows > 0;
}

export async function getListingTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(listingTemplates).where(eq(listingTemplates.id, id)).limit(1))[0];
}

export async function createAgentTransaction(data: Omit<InsertPropertyTransaction, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [result] = await db.insert(propertyTransactions).values(data).$returningId();
  if (!result) return undefined;
  return (await db.select().from(propertyTransactions).where(eq(propertyTransactions.id, result.id)).limit(1))[0];
}

export async function getAgentTransactions(ownerUserId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyTransactions).where(eq(propertyTransactions.ownerUserId, ownerUserId)).orderBy(desc(propertyTransactions.updatedAt)).limit(100);
}

export async function getAgentTransactionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(propertyTransactions).where(eq(propertyTransactions.id, id)).limit(1))[0];
}

export async function updateAgentTransaction(id: number, data: Partial<Pick<InsertPropertyTransaction, "stage" | "status" | "completedAt">>) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(propertyTransactions).set(data).where(eq(propertyTransactions.id, id));
  return result[0].affectedRows > 0;
}
