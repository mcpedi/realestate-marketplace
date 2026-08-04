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
