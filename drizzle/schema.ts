import {
  integer, pgTable, text, timestamp, varchar, boolean, jsonb, serial
} from "drizzle-orm/pg-core";

// ─── Auth.js required tables ──────────────────────────────────────────────────
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").$type<"user" | "admin">().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ─── Application tables ───────────────────────────────────────────────────────
export const designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  shareToken: varchar("shareToken", { length: 32 }).unique().notNull(),
  name: text("name").default("Untitled Stamp"),
  stateJson: jsonb("stateJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  designId: integer("designId").references(() => designs.id, { onDelete: "set null" }),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  email: varchar("email", { length: 320 }),
  plan: varchar("plan", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  amountCents: integer("amountCents").notNull(),
  currency: varchar("currency", { length: 8 }).default("chf").notNull(),
  downloadUrls: jsonb("downloadUrls"),
  fulfilledAt: timestamp("fulfilledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameDE: varchar("nameDE", { length: 255 }),
  category: varchar("category", { length: 128 }).notNull(),
  shape: varchar("shape", { length: 32 }),
  searchTerms: text("searchTerms"),
  stateJson: jsonb("stateJson"),
  thumbnailSvg: text("thumbnailSvg"),
  sortOrder: integer("sortOrder").default(0),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const icons = pgTable("icons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  tags: text("tags").default(""),
  svgPath: text("svgPath").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Design = typeof designs.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Template = typeof templates.$inferSelect;
