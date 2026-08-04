import { eq, desc, asc, and, like, sql, count, inArray } from "drizzle-orm";
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
  type InsertProperty,
  type InsertPropertyPhoto,
  type InsertInquiry,
  type InsertFavorite,
  type InsertTestimonial,
  type InsertBlogPost,
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
  const rawItems = await db
    .select()
    .from(properties)
    .where(whereClause)
    .orderBy(desc(properties.createdAt))
    .limit(limit)
    .offset(offset);
  const items = await Promise.all(rawItems.map(async (p) => {
    const photos = await db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, p.id)).orderBy(asc(propertyPhotos.sortOrder)).limit(1);
    return { ...p, photos: photos.map((ph) => ({ url: ph.url })) };
  }));
  return { items, total: totalResult?.count || 0 };
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
    .orderBy(desc(properties.createdAt))
    .limit(limit);
  return Promise.all(rows.map(async (p) => {
    const photos = await db.select().from(propertyPhotos).where(eq(propertyPhotos.propertyId, p.id)).orderBy(asc(propertyPhotos.sortOrder)).limit(1);
    return { ...p, photos: photos.map((ph) => ({ url: ph.url })) };
  }));
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
