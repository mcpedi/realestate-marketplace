import { eq, desc, asc, and, like, sql, count, inArray, gt } from "drizzle-orm";
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
