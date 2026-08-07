import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;


// ─── Designs ────────────────────────────────────────────────────────────────
export const designs = mysqlTable("designs", {
  id: int("id").autoincrement().primaryKey(),
  shareToken: varchar("shareToken", { length: 16 }).notNull().unique(),
  userId: int("userId"),
  stateJson: json("stateJson").notNull(),
  thumbnailDataUrl: text("thumbnailDataUrl"),
  name: varchar("name", { length: 255 }).default("Untitled Stamp"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Design = typeof designs.$inferSelect;
export type InsertDesign = typeof designs.$inferInsert;

// ─── Orders ─────────────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  stripeSessionId: varchar("stripeSessionId", { length: 128 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 128 }),
  designId: int("designId").notNull(),
  userId: int("userId"),
  email: varchar("email", { length: 320 }).notNull(),
  plan: mysqlEnum("plan", ["promo", "econom", "premium", "vip"]).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "fulfilled", "failed"]).default("pending").notNull(),
  effects: varchar("effects", { length: 64 }).default(""),
  downloadLinks: json("downloadLinks"),
  amountCents: int("amountCents").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Templates ──────────────────────────────────────────────────────────────
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nameDE: varchar("nameDE", { length: 255 }),
  slug: varchar("slug", { length: 128 }),
  shape: varchar("shape", { length: 32 }).default("round"),
  searchTerms: text("searchTerms"),
  stateJson: json("stateJson").notNull(),
  thumbnailSvg: text("thumbnailSvg"),
  sortOrder: int("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

// ─── Icons ──────────────────────────────────────────────────────────────────
export const icons = mysqlTable("icons", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  svgContent: text("svgContent").notNull(),
  tags: varchar("tags", { length: 512 }).default(""),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Icon = typeof icons.$inferSelect;
export type InsertIcon = typeof icons.$inferInsert;
