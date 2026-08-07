// api/server.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/routers/design.ts
import { z } from "zod";

// shared/const.ts
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please sign in to continue (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have the required permission (10002)";

// server/_core/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";

// drizzle/schema.ts
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
  boolean,
  jsonb,
  serial
} from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: text("role").$type().default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var accounts = pgTable("accounts", {
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
  session_state: text("session_state")
});
var sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});
var verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull()
});
var designs = pgTable("designs", {
  id: serial("id").primaryKey(),
  userId: text("userId").references(() => users.id, { onDelete: "set null" }),
  shareToken: varchar("shareToken", { length: 32 }).unique().notNull(),
  name: text("name").default("Untitled Stamp"),
  stateJson: jsonb("stateJson"),
  thumbnailDataUrl: text("thumbnailDataUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var orders = pgTable("orders", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var templates = pgTable("templates", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var icons = pgTable("icons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 128 }).notNull(),
  tags: text("tags").default(""),
  svgPath: text("svgPath").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/db.ts
var _pool = null;
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user;
}

// server/routers/design.ts
import { eq as eq2 } from "drizzle-orm";
import { nanoid } from "nanoid";
var designRouter = router({
  save: publicProcedure.input(z.object({
    stateJson: z.any(),
    name: z.string().optional(),
    thumbnailDataUrl: z.string().optional()
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const shareToken = nanoid(10);
    const userId = ctx.user?.id ?? null;
    await db.insert(designs).values({
      shareToken,
      userId,
      stateJson: input.stateJson,
      name: input.name ?? "Untitled Stamp",
      thumbnailDataUrl: input.thumbnailDataUrl ?? null
    });
    return { shareToken };
  }),
  load: publicProcedure.input(z.object({ shareToken: z.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const result = await db.select().from(designs).where(eq2(designs.shareToken, input.shareToken)).limit(1);
    if (!result[0]) throw new Error("Design not found");
    return result[0];
  }),
  sendEmail: publicProcedure.input(z.object({ email: z.string().email(), shareUrl: z.string().url() })).mutation(async ({ input }) => {
    console.log(`[Design] Send email to ${input.email}: ${input.shareUrl}`);
    return { sent: true };
  }),
  myDesigns: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db.select().from(designs).where(eq2(designs.userId, ctx.user.id));
  })
});

// server/routers/order.ts
import { z as z2 } from "zod";
import { eq as eq3 } from "drizzle-orm";
import { nanoid as nanoid2 } from "nanoid";
var PLAN_PRICES_CHF = {
  promo: 250,
  // CHF 2.50
  econom: 350,
  // CHF 3.50
  premium: 450,
  // CHF 4.50
  vip: 550
  // CHF 5.50
};
var PLAN_DESCRIPTIONS = {
  promo: "PNG download (high-res, transparent background)",
  econom: "PNG + SVG vector download",
  premium: "PNG + SVG + PDF download",
  vip: "PNG + SVG + PDF + DOCX download"
};
var orderRouter = router({
  createCheckout: publicProcedure.input(z2.object({
    plan: z2.enum(["promo", "econom", "premium", "vip"]),
    email: z2.string().email(),
    stateJson: z2.any(),
    amountCents: z2.number().int().positive()
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const shareToken = nanoid2(10);
    await db.insert(designs).values({
      shareToken,
      userId: ctx.user?.id ?? null,
      stateJson: input.stateJson,
      name: "Stamp Order"
    });
    const [design] = await db.select().from(designs).where(eq3(designs.shareToken, shareToken)).limit(1);
    if (!design) throw new Error("Failed to save design");
    const Stripe2 = (await import("stripe")).default;
    const stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY);
    const origin = ctx.req.headers.origin || "https://www.stampelo.ch";
    const session = await stripe2.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: input.email,
      allow_promotion_codes: true,
      line_items: [{
        price_data: {
          currency: "chf",
          product_data: {
            name: `Stampelo \u2014 ${input.plan.toUpperCase()} Plan`,
            description: PLAN_DESCRIPTIONS[input.plan] ?? `Custom stamp download (${input.plan})`
          },
          unit_amount: PLAN_PRICES_CHF[input.plan]
        },
        quantity: 1
      }],
      metadata: {
        design_id: String(design.id),
        plan: input.plan,
        email: input.email,
        user_id: ctx.user?.id ? String(ctx.user.id) : ""
      },
      client_reference_id: ctx.user?.id ? String(ctx.user.id) : `guest-${shareToken}`,
      success_url: `${origin}/download?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/editor`
    });
    await db.insert(orders).values({
      stripeSessionId: session.id,
      designId: design.id,
      userId: ctx.user?.id ?? null,
      email: input.email,
      plan: input.plan,
      status: "pending",
      amountCents: PLAN_PRICES_CHF[input.plan]
    });
    return { checkoutUrl: session.url };
  }),
  getBySession: publicProcedure.input(z2.object({ sessionId: z2.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [order] = await db.select().from(orders).where(eq3(orders.stripeSessionId, input.sessionId)).limit(1);
    return order ?? null;
  }),
  getByOrderId: publicProcedure.input(z2.object({ orderId: z2.number().int().positive() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const [order] = await db.select().from(orders).where(eq3(orders.id, input.orderId)).limit(1);
    return order ?? null;
  }),
  myOrders: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    return db.select().from(orders).where(eq3(orders.userId, ctx.user.id));
  })
});

// server/routers/template.ts
import { z as z3 } from "zod";
import { eq as eq4, like, and, or, count, asc } from "drizzle-orm";

// shared/iconData.ts
var BUILT_IN_ICONS = [
  // ── Business Finance ──────────────────────────────────────────────────────────
  { id: "briefcase", name: "Briefcase", category: "Business Finance", path: "M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm-9-2h2v2h-2V5zm9 14H4V9h16v10z", tags: "work office business" },
  { id: "building", name: "Building", category: "Business Finance", path: "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zm-6 4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zm4 8h-2v-2h2v2zm0-4h-2V9h2v2z", tags: "building company office" },
  { id: "handshake", name: "Handshake", category: "Business Finance", path: "M11 6H9L7 4H3L1 6v4l2 2h2l1 1v1l-2 2v2l2 2h2l4-4 4 4h2l2-2v-2l-2-2v-1l1-1h2l2-2V6l-2-2h-4l-2 2zm-1 2l2-2h4l1 1v3l-1 1h-2l-2 2v2l-3 3-3-3v-2l-2-2H2V7l1-1h4l2 2z", tags: "deal agreement partnership" },
  { id: "chart-bar", name: "Bar Chart", category: "Business Finance", path: "M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z", tags: "chart analytics business finance" },
  { id: "dollar", name: "Dollar Sign", category: "Business Finance", path: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z", tags: "money currency finance" },
  { id: "bank", name: "Bank", category: "Business Finance", path: "M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zM11.5 1L2 6v2h19V6l-9.5-5z", tags: "bank finance money institution" },
  { id: "coins", name: "Coins", category: "Business Finance", path: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z", tags: "coins money finance" },
  // ── Medical ───────────────────────────────────────────────────────────────────
  { id: "cross", name: "Medical Cross", category: "Medical", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z", tags: "health hospital medicine" },
  { id: "heart", name: "Heart", category: "Medical", path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", tags: "love health care" },
  { id: "stethoscope", name: "Stethoscope", category: "Medical", path: "M19 8C19 10.76 17.26 13.15 14.78 14.19L14 14.5V17c0 1.65-1.35 3-3 3s-3-1.35-3-3v-2.5l-.78-.31C4.74 13.15 3 10.76 3 8V4h2v4c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4V4h2v4zM9 4H7V2h2v2zm8 0h-2V2h2v2z", tags: "doctor health medical" },
  { id: "pill", name: "Pill", category: "Medical", path: "M4.22 11.29l6.36-6.36c1.56-1.56 4.09-1.56 5.66 0l2.83 2.83c1.56 1.56 1.56 4.09 0 5.66l-6.36 6.36c-1.56 1.56-4.09 1.56-5.66 0l-2.83-2.83c-1.56-1.56-1.56-4.09 0-5.66zm8.49-.71L9.29 13.9l1.41 1.41 3.54-3.54-1.53-1.19z", tags: "pill medicine drug pharmacy" },
  { id: "hospital", name: "Hospital", category: "Medical", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z", tags: "hospital clinic medical building" },
  { id: "dna", name: "DNA", category: "Medical", path: "M7 2v2c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V2h-2v2H9V2H7zm0 18v2h2v-2h6v2h2v-2c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2zm5-14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z", tags: "dna genetics science medical" },
  { id: "ambulance", name: "Ambulance", category: "Medical", path: "M19 3H5c-1.1 0-2 .9-2 2v11H1v3h1c0 1.66 1.34 3 3 3s3-1.34 3-3h8c0 1.66 1.34 3 3 3s3-1.34 3-3h1v-5l-3-4V5c0-1.1-.9-2-2-2zM5 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7-10h-1.5V10H9v-1.5H7.5V7H9V5.5h1.5V7H12v1.5zm2 10c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-7h-2.5V9H17l2 2.5z", tags: "ambulance emergency medical" },
  // ── Law Economics ─────────────────────────────────────────────────────────────
  { id: "scale", name: "Scale of Justice", category: "Law Economics", path: "M17 7h-4v1.9l2 2V11h-2v2h2v1.1l-2 2V18h4c1.1 0 2-.9 2-2v-7c0-1.1-.9-2-2-2zm0 9h-2v-1l2-2v3zm0-5h-2V9h2v2zM7 7H3c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2h4v-1.9l-2-2V13h2v-2H5V9.1l2-2V7zm0 9H5v-3l2 2v1z", tags: "justice law legal" },
  { id: "gavel", name: "Gavel", category: "Law Economics", path: "M1 21L10 12 13 15 4 24 1 21zM5.5 5.5l2.5 2.5-2.5 2.5L3 8l2.5-2.5zM21 3L11 13l-2-2L19 1l2 2zM17.5 7.5L15 10l-2-2 2.5-2.5 2 2z", tags: "court judge law" },
  { id: "document", name: "Document", category: "Law Economics", path: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z", tags: "document contract legal" },
  { id: "stamp-approved", name: "Approved Stamp", category: "Law Economics", path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z", tags: "approved certified legal" },
  { id: "notary", name: "Notary Seal", category: "Law Economics", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8-1.41-1.42z", tags: "notary seal certified official" },
  // ── Agriculture Construction ───────────────────────────────────────────────────
  { id: "wheat", name: "Wheat", category: "Agriculture Construction", path: "M14.5 2.5c0 1.5-1.5 7-1.5 7s-1.5-5.5-1.5-7a1.5 1.5 0 0 1 3 0zM7 10.5c1.5 0 7 1.5 7 1.5s-5.5 1.5-7 1.5a1.5 1.5 0 0 1 0-3zM17 10.5a1.5 1.5 0 0 1 0 3c-1.5 0-7-1.5-7-1.5s5.5-1.5 7-1.5zM12 13c0 4.97-4.03 9-9 9v-2c3.87 0 7-3.13 7-7h2z", tags: "wheat grain agriculture" },
  { id: "tractor", name: "Tractor", category: "Agriculture Construction", path: "M19 8h-2V3H7v5H5c-1.1 0-2 .9-2 2v5H1v2h2c0 1.66 1.34 3 3 3s3-1.34 3-3h8c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", tags: "tractor farm agriculture" },
  { id: "hard-hat", name: "Hard Hat", category: "Agriculture Construction", path: "M12 2C8.43 2 5.23 3.54 3 6.05V20h18V6.05C18.77 3.54 15.57 2 12 2zm6 16H6v-4h12v4zm0-6H6v-1.45C6 8.06 8.69 5 12 5s6 3.06 6 5.55V12z", tags: "construction safety helmet worker" },
  { id: "crane", name: "Crane", category: "Agriculture Construction", path: "M21 5V3H3v2l8 9v5H7v2h10v-2h-4v-5l8-9zM5.43 5h13.14l-1.78 2H7.21L5.43 5z", tags: "crane construction building" },
  { id: "house", name: "House", category: "Agriculture Construction", path: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z", tags: "house home building real estate" },
  // ── Engineering Technology ────────────────────────────────────────────────────
  { id: "gear", name: "Gear", category: "Engineering Technology", path: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z", tags: "settings cog technology engineering" },
  { id: "computer", name: "Computer", category: "Engineering Technology", path: "M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z", tags: "computer tech digital" },
  { id: "circuit", name: "Circuit Board", category: "Engineering Technology", path: "M9 3H7v2H5v2h2v2H5v2h2v2H3v2h4v2H5v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-4v-2h4v-2h-2v-2h2V9h-2V7h2V5h-2V3h-2v2h-2V3H9zm0 4h6v6H9V7z", tags: "circuit electronics engineering" },
  { id: "wrench", name: "Wrench", category: "Engineering Technology", path: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z", tags: "wrench tool repair engineering" },
  { id: "atom", name: "Atom", category: "Engineering Technology", path: "M12 11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6.36-2.36C17.47 7.73 15.5 7 13.5 7c-.96 0-1.86.18-2.68.5.08-.5.18-1 .18-1.5 0-2.76-2.24-5-5-5S1 3.24 1 6s2.24 5 5 5c.5 0 1-.1 1.5-.18C7.18 11.64 7 12.54 7 13.5c0 2 .73 3.97 1.64 4.86C9.53 19.27 10.5 20 12 20s2.47-.73 3.36-1.64C16.27 17.47 17 15.5 17 13.5c0-.96-.18-1.86-.5-2.68.5.08 1 .18 1.5.18 2.76 0 5-2.24 5-5s-2.24-5-5-5c-.5 0-1 .1-1.5.18.32-.82.5-1.72.5-2.68z", tags: "atom science physics" },
  // ── Transport ─────────────────────────────────────────────────────────────────
  { id: "truck", name: "Truck", category: "Transport", path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", tags: "truck delivery transport" },
  { id: "plane", name: "Airplane", category: "Transport", path: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z", tags: "airplane flight travel" },
  { id: "ship", name: "Ship", category: "Transport", path: "M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.64 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.14.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z", tags: "ship boat sea transport" },
  { id: "car", name: "Car", category: "Transport", path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z", tags: "car automobile transport" },
  { id: "train", name: "Train", category: "Transport", path: "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 10h-5V6h5v4z", tags: "train railway transport" },
  { id: "bicycle", name: "Bicycle", category: "Transport", path: "M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z", tags: "bicycle bike cycling sport" },
  // ── Food Drinks ───────────────────────────────────────────────────────────────
  { id: "fork-knife", name: "Fork & Knife", category: "Food Drinks", path: "M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z", tags: "food restaurant dining" },
  { id: "coffee", name: "Coffee", category: "Food Drinks", path: "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z", tags: "coffee drink cafe beverage" },
  { id: "wine", name: "Wine Glass", category: "Food Drinks", path: "M20 3H4l4 9.5V19H6v2h12v-2h-2v-6.5L20 3zm-8 9.5c-1.84 0-3.5-.96-3.5-2.5h7c0 1.54-1.66 2.5-3.5 2.5z", tags: "wine drink alcohol restaurant" },
  { id: "chef-hat", name: "Chef Hat", category: "Food Drinks", path: "M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97V1h-2v4.05H3l1.64 16.48c.1.82.79 1.46 1.63 1.46h1.66l.22-2H17.84l.22 2zM13 17.5h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7.5h2V9.5z", tags: "chef cook restaurant food" },
  { id: "pizza", name: "Pizza", category: "Food Drinks", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z", tags: "pizza food restaurant" },
  // ── Science Education ─────────────────────────────────────────────────────────
  { id: "book", name: "Book", category: "Science Education", path: "M18 2h-8L4 8v14h16V2h-2zm-6 14H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8V6h8v2z", tags: "book education school learning" },
  { id: "graduation", name: "Graduation Cap", category: "Science Education", path: "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z", tags: "graduation school university education" },
  { id: "microscope", name: "Microscope", category: "Science Education", path: "M9.8 10.7l1.4 1.4-4.6 4.6-1.4-1.4 4.6-4.6zm8.2 8.3H6v2h12v-2zm-7-16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm1 9.17V15h-2v-2.83C8.17 11.6 7 10.4 7 9c0-1.66 1.34-3 3-3s3 1.34 3 3c0 1.4-1.17 2.6-2 3.17z", tags: "microscope science research lab" },
  { id: "flask", name: "Flask", category: "Science Education", path: "M9 3v.5L5.5 9C4.5 10.5 4 12 4 13.5 4 17.09 7.13 20 11 20h2c3.87 0 7-2.91 7-6.5 0-1.5-.5-3-1.5-4.5L15 3.5V3H9zm2 2h2v1h-2V5zm-2.5 4.5L10 7h4l1.5 2.5H8.5z", tags: "flask chemistry science lab" },
  { id: "pencil", name: "Pencil", category: "Science Education", path: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z", tags: "pencil write education school" },
  // ── Communication ─────────────────────────────────────────────────────────────
  { id: "phone", name: "Phone", category: "Communication", path: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z", tags: "phone call communication" },
  { id: "envelope", name: "Envelope", category: "Communication", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z", tags: "email mail message communication" },
  { id: "chat", name: "Chat Bubble", category: "Communication", path: "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z", tags: "chat message communication" },
  { id: "wifi", name: "WiFi", category: "Communication", path: "M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z", tags: "wifi wireless internet communication" },
  { id: "satellite", name: "Satellite", category: "Communication", path: "M10.9 2.1l-4.6 4.6-1.4-1.4-1.4 1.4 4.6 4.6-1.4 1.4-1.4-1.4-2.8 2.8 1.4 1.4-1.4 1.4 4.6 4.6 1.4-1.4 1.4 1.4 2.8-2.8-1.4-1.4 1.4-1.4-4.6-4.6 1.4-1.4 1.4 1.4 4.6-4.6-1.4-1.4 1.4-1.4-4.6-4.6-1.4 1.4-1.4-1.4zm7.1 7.1c1.2 1.2 1.2 3.2 0 4.4l1.4 1.4c2-2 2-5.2 0-7.2l-1.4 1.4zm2.8-2.8c2.8 2.8 2.8 7.2 0 10l1.4 1.4c3.5-3.5 3.5-9.3 0-12.8l-1.4 1.4z", tags: "satellite communication technology" },
  // ── Sport ─────────────────────────────────────────────────────────────────────
  { id: "soccer", name: "Soccer Ball", category: "Sport", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.93V16h2v1.93c-1.03.14-1.97.14-3 0h1zm4.99-.85l-.99-1.72 1.73-1 .99 1.72c-.57.37-1.14.71-1.73 1zm-7.98 0c-.59-.29-1.16-.63-1.73-1l.99-1.72 1.73 1-.99 1.72zm10.5-4.27l-1.72-.99 1-1.73 1.72.99c-.14 1.03-.43 2.01-.99 2.73h-.01zm-14.02 0c-.57-.72-.86-1.7-.99-2.73l1.72-.99 1 1.73-1.73.99zm14.51-5.74c.43.9.7 1.88.7 2.93h-2c0-.74-.12-1.45-.34-2.12l1.64-.81zm-15 0l1.64.81C5.12 8.55 5 9.26 5 10H3c0-1.05.27-2.03.7-2.93zM12 4c1.05 0 2.03.27 2.93.7l-.81 1.64C13.45 6.12 12.74 6 12 6s-1.45.12-2.12.34L9.07 4.7C9.97 4.27 10.95 4 12 4z", tags: "soccer football sport ball" },
  { id: "trophy", name: "Trophy", category: "Sport", path: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z", tags: "trophy award sport winner" },
  { id: "basketball", name: "Basketball", category: "Sport", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-2.07v2.89c-1.8-.2-3.39-.88-4.93-1.82zm5.93 1.82v-2.89c1.88.29 4.5 1.17 4.93 2.07-1.54.94-3.13 1.62-4.93 1.82zM4.1 7.5c.96-.63 3.58-.25 5.9 1.04-1.42 1.29-2.7 3.17-3.27 5.17C5.23 12.04 4 9.72 4 7.5c0 0 .05 0 .1 0zm1.9 8.5c.57-2 1.85-3.88 3.27-5.17 1.32 1.29 2.1 3.17 2.1 5.17H9.5c-1.35 0-2.57-.4-3.5-1zm11.9.5c-.93.6-2.15 1-3.5 1h-.37c0-2 .78-3.88 2.1-5.17 1.42 1.29 2.7 3.17 3.27 5.17-.5.01-.99-.01-1.5 0zm.1-2.5c-.57-2-1.85-3.88-3.27-5.17 2.32-1.29 4.94-1.67 5.9-1.04.05 0 .1 0 .1 0 0 2.22-1.23 4.54-2.73 6.21z", tags: "basketball sport ball" },
  { id: "dumbbell", name: "Dumbbell", category: "Sport", path: "M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z", tags: "dumbbell gym fitness sport" },
  // ── Tourism Travel ────────────────────────────────────────────────────────────
  { id: "globe", name: "Globe", category: "Tourism Travel", path: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.9 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z", tags: "world globe international travel" },
  { id: "map-pin", name: "Map Pin", category: "Tourism Travel", path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", tags: "location pin map travel" },
  { id: "compass", name: "Compass", category: "Tourism Travel", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z", tags: "compass direction navigation travel" },
  { id: "camera", name: "Camera", category: "Tourism Travel", path: "M12 15.2c-1.77 0-3.2-1.43-3.2-3.2 0-1.77 1.43-3.2 3.2-3.2 1.77 0 3.2 1.43 3.2 3.2 0 1.77-1.43 3.2-3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z", tags: "camera photo travel tourism" },
  { id: "hotel", name: "Hotel", category: "Tourism Travel", path: "M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z", tags: "hotel accommodation travel" },
  // ── Fauna ─────────────────────────────────────────────────────────────────────
  { id: "eagle", name: "Eagle", category: "Fauna", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z", tags: "eagle bird animal" },
  { id: "fish", name: "Fish", category: "Fauna", path: "M20 12c0-4.42-3.58-8-8-8s-8 3.58-8 8 3.58 8 8 8 8-3.58 8-8zm-10 3l-1.41-1.41L11.17 11H7V9h4.17L9.59 7.41 11 6l4 4-4 4z", tags: "fish sea animal marine" },
  { id: "paw", name: "Paw Print", category: "Fauna", path: "M4.5 9.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5S6 7.17 6 8s-.67 1.5-1.5 1.5zm3-5C6.67 4.5 6 3.83 6 3s.67-1.5 1.5-1.5S9 2.17 9 3s-.67 1.5-1.5 1.5zm5 0C11.67 4.5 11 3.83 11 3s.67-1.5 1.5-1.5S14 2.17 14 3s-.67 1.5-1.5 1.5zm3 5c-.83 0-1.5-.67-1.5-1.5S15.17 7 16 7s1.5.67 1.5 1.5S16.83 9.5 16 9.5zm-4 .5c-2.33 0-7 1.17-7 3.5V16h14v-2.5c0-2.33-4.67-3.5-7-3.5z", tags: "paw pet animal dog cat" },
  { id: "bee", name: "Bee", category: "Fauna", path: "M19 10h-1.26A8.008 8.008 0 0 0 13 4.06V2h-2v2.06A8.008 8.008 0 0 0 6.26 10H5c-1.1 0-2 .9-2 2s.9 2 2 2h.05c.24 2.48 1.49 4.68 3.37 6.17L7 22h2l1-1.5c.62.17 1.29.5 2 .5s1.38-.33 2-.5L15 22h2l-1.42-1.83C17.46 18.68 18.71 16.48 18.95 14H19c1.1 0 2-.9 2-2s-.9-2-2-2zm-7 8c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z", tags: "bee insect animal nature" },
  { id: "lion", name: "Lion", category: "Fauna", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z", tags: "lion animal king strength" },
  // ── Flora ─────────────────────────────────────────────────────────────────────
  { id: "leaf", name: "Leaf", category: "Flora", path: "M17 8C8 10 5.9 16.17 3.82 21H5.71C6.72 18.5 8.24 15.33 11 13c-1.56 2.5-2.04 5.5-1.96 8h2c.06-3.5 1.5-6.5 4-8.5V21h2V8z", tags: "leaf plant nature eco" },
  { id: "tree", name: "Tree", category: "Flora", path: "M17 12h-5V7h-2v5H5l7 7 7-7zM5 20v2h14v-2H5z", tags: "tree plant nature environment" },
  { id: "flower", name: "Flower", category: "Flora", path: "M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9zm0 0c0-4.97-4.03-9-9-9 0 4.97 4.03 9 9 9zm0-18C7.03 4 3 8.03 3 13c4.97 0 9-4.03 9-9zm0 0c4.97 0 9 4.03 9 9-4.97 0-9-4.03-9-9z", tags: "flower plant nature bloom" },
  { id: "seedling", name: "Seedling", category: "Flora", path: "M12 22V12m0 0C12 7 7 3 2 3c0 5 4 9 10 9zm0 0c0-5 5-9 10-9-1 5-5 9-10 9z", tags: "seedling plant grow nature" },
  // ── Religion ──────────────────────────────────────────────────────────────────
  { id: "cross-religion", name: "Cross", category: "Religion", path: "M10 2v8H2v4h8v8h4v-8h8v-4h-8V2z", tags: "cross religion christian church" },
  { id: "star-of-david", name: "Star of David", category: "Religion", path: "M12 2l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z", tags: "star david religion jewish" },
  { id: "crescent", name: "Crescent Moon", category: "Religion", path: "M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z", tags: "crescent moon religion islam" },
  { id: "om", name: "Om Symbol", category: "Religion", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z", tags: "om hinduism religion spiritual" },
  // ── Architecture ──────────────────────────────────────────────────────────────
  { id: "arch", name: "Arch", category: "Architecture", path: "M4 22V10c0-4.42 3.58-8 8-8s8 3.58 8 8v12h-4v-6c0-2.21-1.79-4-4-4s-4 1.79-4 4v6H4z", tags: "arch architecture building design" },
  { id: "column", name: "Column", category: "Architecture", path: "M3 3h18v3H3zm2 3h14v13H5zm2 2v9h10V8H7zm-4 11h18v2H3z", tags: "column pillar architecture classical" },
  { id: "blueprint", name: "Blueprint", category: "Architecture", path: "M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2z", tags: "blueprint plan architecture design" },
  { id: "ruler", name: "Ruler", category: "Architecture", path: "M21.71 3.29l-1-1c-.39-.39-1.02-.39-1.41 0L2.29 19.29c-.39.39-.39 1.02 0 1.41l1 1c.39.39 1.02.39 1.41 0L21.71 4.71c.39-.39.39-1.02 0-1.42zM5.42 16L16 5.42 18.58 8 8 18.58 5.42 16z", tags: "ruler measure architecture design" },
  // ── Recreation Entertainment ──────────────────────────────────────────────────
  { id: "music", name: "Music Note", category: "Recreation Entertainment", path: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z", tags: "music note entertainment" },
  { id: "film", name: "Film", category: "Recreation Entertainment", path: "M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z", tags: "film movie entertainment cinema" },
  { id: "game", name: "Game Controller", category: "Recreation Entertainment", path: "M15 7.5V2H9v5.5l3 3 3-3zM7.5 9H2v6h5.5l3-3-3-3zM9 16.5V22h6v-5.5l-3-3-3 3zM16.5 9l-3 3 3 3H22V9h-5.5z", tags: "game controller entertainment play" },
  { id: "theater", name: "Theater Masks", category: "Recreation Entertainment", path: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-5 14.5h-2V15h2v1.5zm0-3h-2v-2h2v2zm0-4h-2V8h2v1.5zm5 7H16v-1.5h2V17zm0-3h-2v-2h2v2zm0-4h-2V8h2v1.5zM7 17H5v-1.5h2V17zm0-3H5v-2h2v2zm0-4H5V8h2v1.5z", tags: "theater drama entertainment arts" },
  // ── People ────────────────────────────────────────────────────────────────────
  { id: "person", name: "Person", category: "People", path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", tags: "person user people human" },
  { id: "group", name: "Group", category: "People", path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z", tags: "group people team community" },
  { id: "family", name: "Family", category: "People", path: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z", tags: "family people home" },
  { id: "worker", name: "Worker", category: "People", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z", tags: "worker employee person professional" },
  // ── Symbols Decoration ────────────────────────────────────────────────────────
  { id: "star", name: "Star", category: "Symbols Decoration", path: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z", tags: "star rating favorite" },
  { id: "crown", name: "Crown", category: "Symbols Decoration", path: "M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z", tags: "crown royal premium" },
  { id: "shield", name: "Shield", category: "Symbols Decoration", path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z", tags: "shield security protection" },
  { id: "anchor", name: "Anchor", category: "Symbols Decoration", path: "M17 8C19 10.76 17.26 13.15 14.78 14.19L14 14.5V17c0 1.65-1.35 3-3 3s-3-1.35-3-3v-2.5l-.78-.31C4.74 13.15 3 10.76 3 8V4h2v4c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4V4h2v4zM9 4H7V2h2v2zm8 0h-2V2h2v2z", tags: "anchor sea marine symbol" },
  { id: "infinity", name: "Infinity", category: "Symbols Decoration", path: "M18.6 6.62c-1.44 0-2.8.56-3.77 1.53L12 10.66 10.48 12h.01L7.8 14.39c-.64.64-1.49.99-2.4.99-1.87 0-3.39-1.51-3.39-3.38S3.53 8.62 5.4 8.62c.91 0 1.76.35 2.44 1.03l1.13 1 1.51-1.34L9.22 8.2C8.2 7.18 6.84 6.62 5.4 6.62 2.42 6.62 0 9.04 0 12s2.42 5.38 5.4 5.38c1.44 0 2.8-.56 3.77-1.53l2.83-2.5.01.01L13.52 12h-.01l2.69-2.39c.64-.64 1.49-.99 2.4-.99 1.87 0 3.39 1.51 3.39 3.38s-1.52 3.38-3.39 3.38c-.9 0-1.76-.35-2.44-1.03l-1.14-1.01-1.51 1.34 1.27 1.12c1.02 1.01 2.37 1.57 3.82 1.57 2.98 0 5.4-2.41 5.4-5.38s-2.42-5.38-5.4-5.38z", tags: "infinity loop symbol eternal" },
  { id: "diamond", name: "Diamond", category: "Symbols Decoration", path: "M19 3H5L2 9l10 12L22 9l-3-6zm-8.5 6l1.5-3 1.5 3h-3zm5 0l-1.5-3h3l-1.5 3zM5.5 8l1.5-3h2L7.5 8H5.5zm1.5 1l3 4-4.5-4H7zm5 4l3-4h1.5L12 13zm3-4h1.5l-1.5 3-1.5-3H15z", tags: "diamond gem shape" },
  { id: "ribbon-award", name: "Award Ribbon", category: "Symbols Decoration", path: "M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zM19 8c0 1.3-.84 2.4-2 2.82V7h2v1z", tags: "award ribbon badge honor" },
  { id: "laurel", name: "Laurel Wreath", category: "Symbols Decoration", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "laurel wreath honor victory" },
  // ── Stars Shapes ──────────────────────────────────────────────────────────────
  { id: "star-5", name: "5-Point Star", category: "Stars Shapes", path: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z", tags: "star five point shape" },
  { id: "star-6", name: "6-Point Star", category: "Stars Shapes", path: "M12 2l2.4 4.8H20l-4 3.6 1.6 5.6L12 13.2l-5.6 2.8 1.6-5.6-4-3.6h5.6z", tags: "star six point hexagram" },
  { id: "pentagon", name: "Pentagon", category: "Stars Shapes", path: "M12 2l9.5 6.9-3.6 11.1H6.1L2.5 8.9z", tags: "pentagon five sides shape" },
  { id: "hexagon", name: "Hexagon", category: "Stars Shapes", path: "M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A1.01 1.01 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z", tags: "hexagon six sides shape" },
  { id: "octagon", name: "Octagon", category: "Stars Shapes", path: "M17.6 2H6.4L2 6.4v11.2L6.4 22h11.2L22 17.6V6.4z", tags: "octagon eight sides shape" },
  { id: "circle-shape", name: "Circle", category: "Stars Shapes", path: "M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2z", tags: "circle round shape" },
  { id: "triangle-shape", name: "Triangle", category: "Stars Shapes", path: "M1 21h22L12 2z", tags: "triangle three sides shape" },
  { id: "square-shape", name: "Square", category: "Stars Shapes", path: "M3 3h18v18H3z", tags: "square four sides shape" },
  // ── Business Finance (additional) ─────────────────────────────────────────────
  { id: "chart-line", name: "Line Chart", category: "Business Finance", path: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z", tags: "chart line graph analytics" },
  { id: "pie-chart", name: "Pie Chart", category: "Business Finance", path: "M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z", tags: "pie chart analytics business" },
  { id: "target-goal", name: "Target", category: "Business Finance", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93V18h-2v1.93C7.06 19.44 4.56 16.94 4.07 14H6v-2H4.07C4.56 9.06 7.06 6.56 10 6.07V8h2V6.07c2.94.49 5.44 2.99 5.93 5.93H16v2h1.93c-.49 2.94-2.99 5.44-5.93 5.93z", tags: "target goal business" },
  { id: "office-building", name: "Office Building", category: "Business Finance", path: "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z", tags: "office building company business" },
  { id: "certificate", name: "Certificate", category: "Business Finance", path: "M4 3h16c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2h-4l-4 4-4-4H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v9h4.83L12 17.17 15.17 14H20V5H4zm2 2h12v2H6V7zm0 4h8v2H6v-2z", tags: "certificate document award" },
  { id: "handshake-deal", name: "Deal", category: "Business Finance", path: "M11 14H9c0-4.97 4.03-9 9-9v2c-3.87 0-7 3.13-7 7zm4 0h-2c0-2.76 2.24-5 5-5v2c-1.66 0-3 1.34-3 3z", tags: "deal agreement business" },
  { id: "presentation", name: "Presentation", category: "Business Finance", path: "M2 3h20v14H2V3zm2 2v10h16V5H4zm7 12l-2 3h2v1h2v-1h2l-2-3h-2z", tags: "presentation slides business" },
  // ── Medical (additional) ───────────────────────────────────────────────────────
  { id: "syringe", name: "Syringe", category: "Medical", path: "M17.01 5.99L19 4l1 1-1.99 1.99 1.5 1.5-1.06 1.06-1.5-1.5-1.94 1.94 1.5 1.5-1.06 1.06-1.5-1.5L11 13l1.5 1.5-1.06 1.06L10 14.07l-3.07 3.07c-.39.39-.39 1.02 0 1.41l.53.53-1.41 1.41-.53-.53c-1.17-1.17-1.17-3.07 0-4.24L8.59 13l-1.5-1.5 1.06-1.06 1.5 1.5 1.94-1.94-1.5-1.5 1.06-1.06 1.5 1.5 1.44-1.45z", tags: "syringe injection medical vaccine" },
  { id: "medical-bag", name: "Medical Bag", category: "Medical", path: "M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.54 16.46 1 14.55 1c-1.3 0-2.43.8-2.99 1.96L11 4.5l-.56-1.54C9.88 1.8 8.75 1 7.45 1 5.54 1 4 2.54 4 4.64c0 .48.11.92.18 1.36H2c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5.45-3c.74 0 1.45.67 1.45 1.64 0 .48-.09.93-.2 1.36h-2.89l.64-1.74c.14-.38.5-.64.9-.64zm-7.1 0c.4 0 .76.26.9.64l.64 1.74H6.1c-.11-.43-.2-.88-.2-1.36C5.9 3.05 6.71 3 7.45 3zM13 15h-2v2H9v-2H7v-2h2v-2h2v2h2v2z", tags: "medical bag first aid kit" },
  { id: "tooth-dental", name: "Dental", category: "Medical", path: "M11.5 2C8.46 2 6 4.46 6 7.5c0 2.7 1.9 4.96 4.44 5.42L10 21h1l1-7h1l1 7h1l-.44-8.08C16.1 12.46 18 10.2 18 7.5 18 4.46 15.54 2 12.5 2h-1zm.5 9c-1.93 0-3.5-1.57-3.5-3.5S10.07 4 12 4s3.5 1.57 3.5 3.5S13.93 11 12 11z", tags: "dental tooth medical" },
  { id: "eye-medical", name: "Eye Exam", category: "Medical", path: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z", tags: "eye medical optometry vision" },
  { id: "heartbeat", name: "Heartbeat", category: "Medical", path: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z", tags: "heartbeat pulse medical ecg" },
  { id: "bandage", name: "Bandage", category: "Medical", path: "M17.73 12.02l3.98-3.98c.39-.39.39-1.02 0-1.41l-4.34-4.34c-.39-.39-1.02-.39-1.41 0l-3.98 3.98L8 2.29C7.8 2.1 7.55 2 7.29 2c-.25 0-.51.1-.7.29L2.25 6.63c-.39.39-.39 1.02 0 1.41l3.98 3.98L2.25 16c-.39.39-.39 1.02 0 1.41l4.34 4.34c.39.39 1.02.39 1.41 0l3.98-3.98 3.98 3.98c.2.2.45.29.71.29.26 0 .51-.1.71-.29l4.34-4.34c.39-.39.39-1.02 0-1.41l-3.99-3.98z", tags: "bandage medical first aid" },
  // ── Law Economics (additional) ─────────────────────────────────────────────────
  { id: "courthouse", name: "Courthouse", category: "Law Economics", path: "M12 3L2 12h3v8h14v-8h3L12 3zm5 15H7v-8h10v8zm-4-2h-2v-4h2v4z", tags: "courthouse law justice building" },
  { id: "contract", name: "Contract", category: "Law Economics", path: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z", tags: "contract document legal" },
  { id: "id-card", name: "ID Card", category: "Law Economics", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z", tags: "id card identity document" },
  { id: "stamp-official", name: "Official Stamp", category: "Law Economics", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z", tags: "official stamp certified approved" },
  { id: "fingerprint", name: "Fingerprint", category: "Law Economics", path: "M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28z", tags: "fingerprint identity law security" },
  // ── Agriculture Construction (additional) ──────────────────────────────────────
  { id: "shovel", name: "Shovel", category: "Agriculture Construction", path: "M16 8.83L17.17 7.66c.78-.78.78-2.05 0-2.83L15.17 2.83c-.78-.78-2.05-.78-2.83 0L11.17 4l-2.83-2.83L7 2.59 9.83 5.41 3.41 11.83c-.78.78-.78 2.05 0 2.83l2 2c.78.78 2.05.78 2.83 0L14.66 10.17 17.5 13l1.41-1.41L16 8.83zm-9.17 5.59l-2-2 6.42-6.42 2 2-6.42 6.42z", tags: "shovel construction digging" },
  { id: "safety-helmet", name: "Safety Helmet", category: "Agriculture Construction", path: "M12 1C7.03 1 3 5.03 3 10H1v3h3.04C4.56 15.29 6.59 17 9 17h1v2H7v2h10v-2h-3v-2h1c2.41 0 4.44-1.71 4.96-4H23v-3h-2c0-4.97-4.03-9-9-9zm0 2c3.86 0 7 3.14 7 7H5c0-3.86 3.14-7 7-7z", tags: "helmet safety construction worker" },
  { id: "brick-wall", name: "Brick Wall", category: "Agriculture Construction", path: "M2 21h19v-3H2v3zm7-4h5v-3H9v3zM2 14h5v-3H2v3zm12 0h7v-3h-7v3zM2 7h19V4H2v3zm7-4h5V0H9v3z", tags: "brick wall construction building" },
  { id: "seedling-grow", name: "Seedling", category: "Agriculture Construction", path: "M17 8C8 10 5.9 16.17 3.82 21H5.71c.19-.53.39-1.05.59-1.55C7.29 17.18 8.5 15.84 10 15c1.5-.84 3.5-1 5.5-1 2 0 4 .5 5.5 1.5V13c-1.5-.5-3.5-.5-5.5 0 2-2 2-5 2-5z", tags: "seedling plant agriculture growth" },
  // ── Engineering Technology (additional) ───────────────────────────────────────
  { id: "database", name: "Database", category: "Engineering Technology", path: "M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z", tags: "database storage server tech" },
  { id: "code-bracket", name: "Code", category: "Engineering Technology", path: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z", tags: "code programming developer tech" },
  { id: "cloud-server", name: "Cloud Server", category: "Engineering Technology", path: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z", tags: "cloud server storage technology" },
  { id: "robot", name: "Robot", category: "Engineering Technology", path: "M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2v1c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm-9 7H9v-2h2v2zm4 0h-2v-2h2v2zm3-5H6v-4h12v4z", tags: "robot ai technology automation" },
  // ── Transport (additional) ─────────────────────────────────────────────────────
  { id: "bus", name: "Bus", category: "Transport", path: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 4c2.5 0 6 .5 6 2H6c0-1.5 3.5-2 6-2zm6 6H6V7h12v3z", tags: "bus transport public transit" },
  { id: "forklift", name: "Forklift", category: "Transport", path: "M20 14V7l-4-4H6c-1.1 0-2 .9-2 2v9H2v5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5h-4zm-7-7h4.5L20 9.5V14H13V7zM7 19c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z", tags: "forklift warehouse logistics transport" },
  { id: "motorcycle", name: "Motorcycle", category: "Transport", path: "M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.65 0-3-1.35-3-3s1.35-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z", tags: "motorcycle bike transport" },
  { id: "helicopter", name: "Helicopter", category: "Transport", path: "M21 10.5H3c-.55 0-1 .45-1 1s.45 1 1 1h1.5l2.5 4h10l2.5-4H21c.55 0 1-.45 1-1s-.45-1-1-1zm-9-8c-.55 0-1 .45-1 1v1H5v2h7v1c0 .55.45 1 1 1s1-.45 1-1V6h7V4h-6V3.5c0-.55-.45-1-1-1z", tags: "helicopter air transport" },
  // ── Food Drinks (additional) ───────────────────────────────────────────────────
  { id: "cocktail", name: "Cocktail", category: "Food Drinks", path: "M20 3H4l4 9.5V19H6v2h12v-2h-2v-6.5L20 3zm-8 9.5c-1.84 0-3.5-.96-3.5-2.5h7c0 1.54-1.66 2.5-3.5 2.5z", tags: "cocktail drink bar beverage" },
  { id: "cake", name: "Cake", category: "Food Drinks", path: "M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 17.27 5.88 17.5 5 17.5c-.38 0-.75-.07-1.1-.18L4 21h16l.09-3.67c-.34.11-.7.17-1.09.17-.88 0-1.75-.23-2.4-.51z", tags: "cake bakery food celebration" },
  { id: "bread", name: "Bread", category: "Food Drinks", path: "M20 8h-2.81c.45-.78.81-1.65.81-2.6C18 3.42 15.58 1 12.6 1c-1.76 0-3.33.88-4.3 2.24C7.47 2.36 6.29 2 5 2 2.24 2 0 4.24 0 7c0 2.08 1.26 3.87 3.07 4.65.07.29.14.59.14.9V21h14v-8.45c0-.31.07-.61.14-.9C19.01 10.87 20 9.55 20 8z", tags: "bread bakery food" },
  { id: "ice-cream", name: "Ice Cream", category: "Food Drinks", path: "M12 3C8.46 3 5.33 4.97 4.04 8H3v2h1.04c.16.43.35.84.58 1.24L3 13l1.5 1.5 1.5-1.5c.5.5 1.07.93 1.7 1.26L7 21h10l-.2-6.74c.63-.33 1.2-.76 1.7-1.26l1.5 1.5L21.5 13l-1.62-1.76c.23-.4.42-.81.58-1.24H21V8h-1.04C18.67 4.97 15.54 3 12 3z", tags: "ice cream dessert food sweet" },
  { id: "beer-mug", name: "Beer", category: "Food Drinks", path: "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z", tags: "beer drink bar beverage" },
  // ── Science Education (additional) ─────────────────────────────────────────────
  { id: "calculator", name: "Calculator", category: "Science Education", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z", tags: "calculator math education science" },
  { id: "chemistry-flask", name: "Chemistry", category: "Science Education", path: "M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm4 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1-5h-4V4h4v3z", tags: "chemistry flask science lab" },
  { id: "library-books", name: "Library", category: "Science Education", path: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z", tags: "library books education learning" },
  { id: "telescope", name: "Telescope", category: "Science Education", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93V18h-2v1.93C7.06 19.44 4.56 16.94 4.07 14H6v-2H4.07C4.56 9.06 7.06 6.56 10 6.07V8h2V6.07c2.94.49 5.44 2.99 5.93 5.93H18v2h1.93c-.49 2.94-2.99 5.44-5.93 5.93z", tags: "telescope astronomy science" },
  // ── Communication (additional) ─────────────────────────────────────────────────
  { id: "megaphone", name: "Megaphone", category: "Communication", path: "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 5V4L5 9H4zm13.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z", tags: "megaphone announcement broadcast" },
  { id: "email-open", name: "Email", category: "Communication", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z", tags: "email message communication" },
  { id: "notification-bell", name: "Notification Bell", category: "Communication", path: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z", tags: "bell notification alert" },
  { id: "qr-code", name: "QR Code", category: "Communication", path: "M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm8-12v8h8V3h-8zm6 6h-4V5h4v4zm-5.99 4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm2-2h2v2h-2zm-4-4h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2z", tags: "qr code scan digital" },
  // ── Sport (additional) ─────────────────────────────────────────────────────────
  { id: "tennis-ball", name: "Tennis", category: "Sport", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83z", tags: "tennis sport racket ball" },
  { id: "swimming-pool", name: "Swimming", category: "Sport", path: "M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zm0-4.5c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36s-.78.13-1.15.36c-.47.27-1.09.64-2.2.64v-2c.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36v2zM8.67 12c.61 0 1.21-.13 1.76-.36L13 10.5l-1.5-4-1.5 4-1.5-4-1.5 4 2.67 1.14c.55.23 1.15.36 1.5.36zm6.66 0c.35 0 .95-.13 1.5-.36L19.5 10.5l-1.5-4-1.5 4-1.5-4-1.5 4 2.67 1.14c.55.23 1.15.36 1.16.36z", tags: "swimming sport aquatic" },
  { id: "running-man", name: "Running", category: "Sport", path: "M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z", tags: "running fitness sport exercise" },
  // ── Tourism Travel (additional) ────────────────────────────────────────────────
  { id: "passport", name: "Passport", category: "Tourism Travel", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z", tags: "passport travel document" },
  { id: "luggage", name: "Luggage", category: "Tourism Travel", path: "M17 6h-2V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2 0 .55.45 1 1 1s1-.45 1-1h6c0 .55.45 1 1 1s1-.45 1-1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm8 15H7V8h10v11z", tags: "luggage suitcase travel" },
  { id: "mountain-peak", name: "Mountain", category: "Tourism Travel", path: "M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z", tags: "mountain hiking travel nature" },
  { id: "beach-umbrella", name: "Beach", category: "Tourism Travel", path: "M13.127 14.56l1.43-1.43 6.44 6.44-1.43 1.43zM17.42 8.83l2.86-2.86c-3.95-3.95-10.35-3.96-14.3-.02 3.93-1.3 8.31-.25 11.44 2.88zM5.95 5.98c-3.94 3.95-3.93 10.35.02 14.3l2.86-2.86C5.7 14.29 4.65 9.91 5.95 5.98z", tags: "beach vacation travel summer" },
  // ── Fauna (additional) ─────────────────────────────────────────────────────────
  { id: "bird-flying", name: "Bird", category: "Fauna", path: "M23 11.99l-2.44-2.79-.56-6.57-6.82.3L12 2 10.82 2.93l-6.82-.3-.56 6.57L1 11.99l1.51 1.51.62 5.78 3.5-.4.37.48V21h3v-2h2v2h3v-1.24l.37-.48 3.5.4.62-5.78L23 11.99zM9 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z", tags: "bird animal nature" },
  { id: "rabbit-animal", name: "Rabbit", category: "Fauna", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "rabbit animal nature" },
  { id: "butterfly-insect", name: "Butterfly", category: "Fauna", path: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z", tags: "butterfly insect nature" },
  // ── Flora (additional) ─────────────────────────────────────────────────────────
  { id: "sunflower", name: "Sunflower", category: "Flora", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z", tags: "sunflower flower nature flora" },
  { id: "palm-tree", name: "Palm Tree", category: "Flora", path: "M17 8C8 10 5.9 16.17 3.82 21H5.71c.19-.53.39-1.05.59-1.55C7.29 17.18 8.5 15.84 10 15c1.5-.84 3.5-1 5.5-1 2 0 4 .5 5.5 1.5V13c-1.5-.5-3.5-.5-5.5 0 2-2 2-5 2-5z", tags: "palm tree tropical flora" },
  { id: "mushroom", name: "Mushroom", category: "Flora", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "mushroom fungi nature flora" },
  // ── Religion (additional) ──────────────────────────────────────────────────────
  { id: "church-building", name: "Church", category: "Religion", path: "M12 3L2 12h3v8h14v-8h3L12 3zm5 15H7v-8h10v8zm-4-2h-2v-4h2v4z", tags: "church religion building" },
  { id: "dove-peace", name: "Dove", category: "Religion", path: "M23 11.99l-2.44-2.79-.56-6.57-6.82.3L12 2 10.82 2.93l-6.82-.3-.56 6.57L1 11.99l1.51 1.51.62 5.78 3.5-.4.37.48V21h3v-2h2v2h3v-1.24l.37-.48 3.5.4.62-5.78L23 11.99z", tags: "dove peace religion symbol" },
  // ── Architecture (additional) ──────────────────────────────────────────────────
  { id: "castle-building", name: "Castle", category: "Architecture", path: "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z", tags: "castle architecture historic" },
  { id: "lighthouse", name: "Lighthouse", category: "Architecture", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "lighthouse architecture coastal" },
  // ── Recreation Entertainment (additional) ──────────────────────────────────────
  { id: "palette-art", name: "Art Palette", category: "Recreation Entertainment", path: "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", tags: "palette art creative design" },
  { id: "camera-photo", name: "Camera", category: "Recreation Entertainment", path: "M12 15.2c-1.77 0-3.2-1.43-3.2-3.2s1.43-3.2 3.2-3.2 3.2 1.43 3.2 3.2-1.43 3.2-3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z", tags: "camera photo photography" },
  { id: "headphones-music", name: "Headphones", category: "Recreation Entertainment", path: "M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z", tags: "headphones music audio" },
  // ── People (additional) ────────────────────────────────────────────────────────
  { id: "teacher-person", name: "Teacher", category: "People", path: "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z", tags: "teacher education person" },
  { id: "chef-person", name: "Chef", category: "People", path: "M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03z", tags: "chef cook food professional" },
  { id: "engineer-person", name: "Engineer", category: "People", path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", tags: "engineer professional person" },
  // ── Symbols Decoration (additional) ────────────────────────────────────────────
  { id: "heart-outline", name: "Heart Outline", category: "Symbols Decoration", path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", tags: "heart love symbol decoration" },
  { id: "recycle-symbol", name: "Recycle", category: "Symbols Decoration", path: "M12 6.5L7 14h10l-5-7.5zm0 3.5c.83 0 1.5.67 1.5 1.5S12.83 13 12 13s-1.5-.67-1.5-1.5S11.17 10 12 10zm-5.5 4H3l4.5 7.5L12 24l4.5-2.5L21 14h-3.5L12 22l-5.5-8z", tags: "recycle environment symbol" },
  { id: "checkmark-circle", name: "Checkmark Circle", category: "Symbols Decoration", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z", tags: "checkmark circle approved symbol" },
  { id: "yin-yang", name: "Yin Yang", category: "Symbols Decoration", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z", tags: "yin yang symbol balance" },
  { id: "peace-sign", name: "Peace Sign", category: "Symbols Decoration", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "peace sign symbol" },
  // ── Stars Shapes (additional) ──────────────────────────────────────────────────
  { id: "badge-shape", name: "Badge Shape", category: "Stars Shapes", path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z", tags: "badge shape seal" },
  { id: "rounded-rect", name: "Rounded Rectangle", category: "Stars Shapes", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z", tags: "rounded rectangle shape" },
  { id: "rhombus", name: "Rhombus", category: "Stars Shapes", path: "M12 2L2 12l10 10 10-10z", tags: "rhombus diamond shape" },
  { id: "cross-shape", name: "Cross Shape", category: "Stars Shapes", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z", tags: "cross shape symbol" },
  { id: "oval-shape", name: "Oval", category: "Stars Shapes", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", tags: "oval ellipse shape" },
  // ── Business Finance (additional) ─────────────────────────────────────────────
  { id: "chart-line", name: "Line Chart", category: "Business Finance", path: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z", tags: "chart line graph analytics" },
  { id: "pie-chart", name: "Pie Chart", category: "Business Finance", path: "M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z", tags: "pie chart analytics business" },
  { id: "target-goal", name: "Target", category: "Business Finance", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93V18h-2v1.93C7.06 19.44 4.56 16.94 4.07 14H6v-2H4.07C4.56 9.06 7.06 6.56 10 6.07V8h2V6.07c2.94.49 5.44 2.99 5.93 5.93H16v2h1.93c-.49 2.94-2.99 5.44-5.93 5.93z", tags: "target goal business" },
  { id: "office-building", name: "Office Building", category: "Business Finance", path: "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z", tags: "office building company business" },
  { id: "certificate", name: "Certificate", category: "Business Finance", path: "M4 3h16c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2h-4l-4 4-4-4H4c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm0 2v9h4.83L12 17.17 15.17 14H20V5H4zm2 2h12v2H6V7zm0 4h8v2H6v-2z", tags: "certificate document award" },
  { id: "handshake-deal", name: "Deal", category: "Business Finance", path: "M11 14H9c0-4.97 4.03-9 9-9v2c-3.87 0-7 3.13-7 7zm4 0h-2c0-2.76 2.24-5 5-5v2c-1.66 0-3 1.34-3 3z", tags: "deal agreement business" },
  { id: "presentation", name: "Presentation", category: "Business Finance", path: "M2 3h20v14H2V3zm2 2v10h16V5H4zm7 12l-2 3h2v1h2v-1h2l-2-3h-2z", tags: "presentation slides business" },
  // ── Medical (additional) ───────────────────────────────────────────────────────
  { id: "syringe", name: "Syringe", category: "Medical", path: "M17.01 5.99L19 4l1 1-1.99 1.99 1.5 1.5-1.06 1.06-1.5-1.5-1.94 1.94 1.5 1.5-1.06 1.06-1.5-1.5L11 13l1.5 1.5-1.06 1.06L10 14.07l-3.07 3.07c-.39.39-.39 1.02 0 1.41l.53.53-1.41 1.41-.53-.53c-1.17-1.17-1.17-3.07 0-4.24L8.59 13l-1.5-1.5 1.06-1.06 1.5 1.5 1.94-1.94-1.5-1.5 1.06-1.06 1.5 1.5 1.44-1.45z", tags: "syringe injection medical vaccine" },
  { id: "medical-bag", name: "Medical Bag", category: "Medical", path: "M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.54 16.46 1 14.55 1c-1.3 0-2.43.8-2.99 1.96L11 4.5l-.56-1.54C9.88 1.8 8.75 1 7.45 1 5.54 1 4 2.54 4 4.64c0 .48.11.92.18 1.36H2c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-5.45-3c.74 0 1.45.67 1.45 1.64 0 .48-.09.93-.2 1.36h-2.89l.64-1.74c.14-.38.5-.64.9-.64zm-7.1 0c.4 0 .76.26.9.64l.64 1.74H6.1c-.11-.43-.2-.88-.2-1.36C5.9 3.05 6.71 3 7.45 3zM13 15h-2v2H9v-2H7v-2h2v-2h2v2h2v2z", tags: "medical bag first aid kit" },
  { id: "tooth-dental", name: "Dental", category: "Medical", path: "M11.5 2C8.46 2 6 4.46 6 7.5c0 2.7 1.9 4.96 4.44 5.42L10 21h1l1-7h1l1 7h1l-.44-8.08C16.1 12.46 18 10.2 18 7.5 18 4.46 15.54 2 12.5 2h-1zm.5 9c-1.93 0-3.5-1.57-3.5-3.5S10.07 4 12 4s3.5 1.57 3.5 3.5S13.93 11 12 11z", tags: "dental tooth medical" },
  { id: "eye-medical", name: "Eye Exam", category: "Medical", path: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z", tags: "eye medical optometry vision" },
  { id: "heartbeat", name: "Heartbeat", category: "Medical", path: "M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z", tags: "heartbeat pulse medical ecg" },
  { id: "bandage", name: "Bandage", category: "Medical", path: "M17.73 12.02l3.98-3.98c.39-.39.39-1.02 0-1.41l-4.34-4.34c-.39-.39-1.02-.39-1.41 0l-3.98 3.98L8 2.29C7.8 2.1 7.55 2 7.29 2c-.25 0-.51.1-.7.29L2.25 6.63c-.39.39-.39 1.02 0 1.41l3.98 3.98L2.25 16c-.39.39-.39 1.02 0 1.41l4.34 4.34c.39.39 1.02.39 1.41 0l3.98-3.98 3.98 3.98c.2.2.45.29.71.29.26 0 .51-.1.71-.29l4.34-4.34c.39-.39.39-1.02 0-1.41l-3.99-3.98z", tags: "bandage medical first aid" },
  // ── Law Economics (additional) ─────────────────────────────────────────────────
  { id: "courthouse", name: "Courthouse", category: "Law Economics", path: "M12 3L2 12h3v8h14v-8h3L12 3zm5 15H7v-8h10v8zm-4-2h-2v-4h2v4z", tags: "courthouse law justice building" },
  { id: "contract", name: "Contract", category: "Law Economics", path: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z", tags: "contract document legal" },
  { id: "id-card", name: "ID Card", category: "Law Economics", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z", tags: "id card identity document" },
  { id: "stamp-official", name: "Official Stamp", category: "Law Economics", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z", tags: "official stamp certified approved" },
  { id: "fingerprint", name: "Fingerprint", category: "Law Economics", path: "M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28z", tags: "fingerprint identity law security" },
  // ── Agriculture Construction (additional) ──────────────────────────────────────
  { id: "shovel", name: "Shovel", category: "Agriculture Construction", path: "M16 8.83L17.17 7.66c.78-.78.78-2.05 0-2.83L15.17 2.83c-.78-.78-2.05-.78-2.83 0L11.17 4l-2.83-2.83L7 2.59 9.83 5.41 3.41 11.83c-.78.78-.78 2.05 0 2.83l2 2c.78.78 2.05.78 2.83 0L14.66 10.17 17.5 13l1.41-1.41L16 8.83zm-9.17 5.59l-2-2 6.42-6.42 2 2-6.42 6.42z", tags: "shovel construction digging" },
  { id: "safety-helmet", name: "Safety Helmet", category: "Agriculture Construction", path: "M12 1C7.03 1 3 5.03 3 10H1v3h3.04C4.56 15.29 6.59 17 9 17h1v2H7v2h10v-2h-3v-2h1c2.41 0 4.44-1.71 4.96-4H23v-3h-2c0-4.97-4.03-9-9-9zm0 2c3.86 0 7 3.14 7 7H5c0-3.86 3.14-7 7-7z", tags: "helmet safety construction worker" },
  { id: "brick-wall", name: "Brick Wall", category: "Agriculture Construction", path: "M2 21h19v-3H2v3zm7-4h5v-3H9v3zM2 14h5v-3H2v3zm12 0h7v-3h-7v3zM2 7h19V4H2v3zm7-4h5V0H9v3z", tags: "brick wall construction building" },
  { id: "seedling-grow", name: "Seedling", category: "Agriculture Construction", path: "M17 8C8 10 5.9 16.17 3.82 21H5.71c.19-.53.39-1.05.59-1.55C7.29 17.18 8.5 15.84 10 15c1.5-.84 3.5-1 5.5-1 2 0 4 .5 5.5 1.5V13c-1.5-.5-3.5-.5-5.5 0 2-2 2-5 2-5z", tags: "seedling plant agriculture growth" },
  // ── Engineering Technology (additional) ───────────────────────────────────────
  { id: "database", name: "Database", category: "Engineering Technology", path: "M12 3C7.58 3 4 4.79 4 7s3.58 4 8 4 8-1.79 8-4-3.58-4-8-4zM4 9v3c0 2.21 3.58 4 8 4s8-1.79 8-4V9c0 2.21-3.58 4-8 4s-8-1.79-8-4zm0 5v3c0 2.21 3.58 4 8 4s8-1.79 8-4v-3c0 2.21-3.58 4-8 4s-8-1.79-8-4z", tags: "database storage server tech" },
  { id: "code-bracket", name: "Code", category: "Engineering Technology", path: "M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z", tags: "code programming developer tech" },
  { id: "cloud-server", name: "Cloud Server", category: "Engineering Technology", path: "M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z", tags: "cloud server storage technology" },
  { id: "robot", name: "Robot", category: "Engineering Technology", path: "M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2v1c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-1c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm-9 7H9v-2h2v2zm4 0h-2v-2h2v2zm3-5H6v-4h12v4z", tags: "robot ai technology automation" },
  // ── Transport (additional) ─────────────────────────────────────────────────────
  { id: "bus", name: "Bus", category: "Transport", path: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 4c2.5 0 6 .5 6 2H6c0-1.5 3.5-2 6-2zm6 6H6V7h12v3z", tags: "bus transport public transit" },
  { id: "forklift", name: "Forklift", category: "Transport", path: "M20 14V7l-4-4H6c-1.1 0-2 .9-2 2v9H2v5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5h-4zm-7-7h4.5L20 9.5V14H13V7zM7 19c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z", tags: "forklift warehouse logistics transport" },
  { id: "motorcycle", name: "Motorcycle", category: "Transport", path: "M19.44 9.03L15.41 5H11v2h3.59l2 2H5c-2.8 0-5 2.2-5 5s2.2 5 5 5c2.46 0 4.45-1.69 4.9-4h1.65l2.77-2.77c-.21.54-.32 1.14-.32 1.77 0 2.8 2.2 5 5 5s5-2.2 5-5c0-2.65-1.97-4.77-4.56-4.97zM7.82 15C7.4 16.15 6.28 17 5 17c-1.65 0-3-1.35-3-3s1.35-3 3-3c1.28 0 2.4.85 2.82 2H5v2h2.82zM19 17c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z", tags: "motorcycle bike transport" },
  { id: "helicopter", name: "Helicopter", category: "Transport", path: "M21 10.5H3c-.55 0-1 .45-1 1s.45 1 1 1h1.5l2.5 4h10l2.5-4H21c.55 0 1-.45 1-1s-.45-1-1-1zm-9-8c-.55 0-1 .45-1 1v1H5v2h7v1c0 .55.45 1 1 1s1-.45 1-1V6h7V4h-6V3.5c0-.55-.45-1-1-1z", tags: "helicopter air transport" },
  // ── Food Drinks (additional) ───────────────────────────────────────────────────
  { id: "cocktail", name: "Cocktail", category: "Food Drinks", path: "M20 3H4l4 9.5V19H6v2h12v-2h-2v-6.5L20 3zm-8 9.5c-1.84 0-3.5-.96-3.5-2.5h7c0 1.54-1.66 2.5-3.5 2.5z", tags: "cocktail drink bar beverage" },
  { id: "cake", name: "Cake", category: "Food Drinks", path: "M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 17.27 5.88 17.5 5 17.5c-.38 0-.75-.07-1.1-.18L4 21h16l.09-3.67c-.34.11-.7.17-1.09.17-.88 0-1.75-.23-2.4-.51z", tags: "cake bakery food celebration" },
  { id: "bread", name: "Bread", category: "Food Drinks", path: "M20 8h-2.81c.45-.78.81-1.65.81-2.6C18 3.42 15.58 1 12.6 1c-1.76 0-3.33.88-4.3 2.24C7.47 2.36 6.29 2 5 2 2.24 2 0 4.24 0 7c0 2.08 1.26 3.87 3.07 4.65.07.29.14.59.14.9V21h14v-8.45c0-.31.07-.61.14-.9C19.01 10.87 20 9.55 20 8z", tags: "bread bakery food" },
  { id: "ice-cream", name: "Ice Cream", category: "Food Drinks", path: "M12 3C8.46 3 5.33 4.97 4.04 8H3v2h1.04c.16.43.35.84.58 1.24L3 13l1.5 1.5 1.5-1.5c.5.5 1.07.93 1.7 1.26L7 21h10l-.2-6.74c.63-.33 1.2-.76 1.7-1.26l1.5 1.5L21.5 13l-1.62-1.76c.23-.4.42-.81.58-1.24H21V8h-1.04C18.67 4.97 15.54 3 12 3z", tags: "ice cream dessert food sweet" },
  { id: "beer-mug", name: "Beer", category: "Food Drinks", path: "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z", tags: "beer drink bar beverage" },
  // ── Science Education (additional) ─────────────────────────────────────────────
  { id: "calculator", name: "Calculator", category: "Science Education", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z", tags: "calculator math education science" },
  { id: "chemistry-flask", name: "Chemistry", category: "Science Education", path: "M7 2v2h1v14c0 2.21 1.79 4 4 4s4-1.79 4-4V4h1V2H7zm4 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm2-4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1-5h-4V4h4v3z", tags: "chemistry flask science lab" },
  { id: "library-books", name: "Library", category: "Science Education", path: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z", tags: "library books education learning" },
  { id: "telescope", name: "Telescope", category: "Science Education", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93V18h-2v1.93C7.06 19.44 4.56 16.94 4.07 14H6v-2H4.07C4.56 9.06 7.06 6.56 10 6.07V8h2V6.07c2.94.49 5.44 2.99 5.93 5.93H18v2h1.93c-.49 2.94-2.99 5.44-5.93 5.93z", tags: "telescope astronomy science" },
  // ── Communication (additional) ─────────────────────────────────────────────────
  { id: "megaphone", name: "Megaphone", category: "Communication", path: "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1l5 5V4L5 9H4zm13.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z", tags: "megaphone announcement broadcast" },
  { id: "email-open", name: "Email", category: "Communication", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z", tags: "email message communication" },
  { id: "notification-bell", name: "Notification Bell", category: "Communication", path: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z", tags: "bell notification alert" },
  { id: "qr-code", name: "QR Code", category: "Communication", path: "M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm8-12v8h8V3h-8zm6 6h-4V5h4v4zm-5.99 4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm2-2h2v2h-2zm-4-4h2v2h-2zm2 2h2v2h-2zm2-2h2v2h-2z", tags: "qr code scan digital" },
  // ── Sport (additional) ─────────────────────────────────────────────────────────
  { id: "tennis-ball", name: "Tennis", category: "Sport", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM7.07 18.28c.43-.9 3.05-1.78 4.93-1.78s4.51.88 4.93 1.78C15.57 19.36 13.86 20 12 20s-3.57-.64-4.93-1.72zm11.29-1.45c-1.43-1.74-4.9-2.33-6.36-2.33s-4.93.59-6.36 2.33C4.62 15.49 4 13.82 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8c0 1.82-.62 3.49-1.64 4.83z", tags: "tennis sport racket ball" },
  { id: "swimming-pool", name: "Swimming", category: "Sport", path: "M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zm0-4.5c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36s-.78.13-1.15.36c-.47.27-1.09.64-2.2.64v-2c.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36v2zM8.67 12c.61 0 1.21-.13 1.76-.36L13 10.5l-1.5-4-1.5 4-1.5-4-1.5 4 2.67 1.14c.55.23 1.15.36 1.5.36zm6.66 0c.35 0 .95-.13 1.5-.36L19.5 10.5l-1.5-4-1.5 4-1.5-4-1.5 4 2.67 1.14c.55.23 1.15.36 1.16.36z", tags: "swimming sport aquatic" },
  { id: "running-man", name: "Running", category: "Sport", path: "M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z", tags: "running fitness sport exercise" },
  // ── Tourism Travel (additional) ────────────────────────────────────────────────
  { id: "passport", name: "Passport", category: "Tourism Travel", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z", tags: "passport travel document" },
  { id: "luggage", name: "Luggage", category: "Tourism Travel", path: "M17 6h-2V4c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v2H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2 0 .55.45 1 1 1s1-.45 1-1h6c0 .55.45 1 1 1s1-.45 1-1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM9 4h6v2H9V4zm8 15H7V8h10v11z", tags: "luggage suitcase travel" },
  { id: "mountain-peak", name: "Mountain", category: "Tourism Travel", path: "M14 6l-1-2H5v17h2v-7h5l1 2h7V6h-6zm4 8h-4l-1-2H7V6h5l1 2h5v6z", tags: "mountain hiking travel nature" },
  { id: "beach-umbrella", name: "Beach", category: "Tourism Travel", path: "M13.127 14.56l1.43-1.43 6.44 6.44-1.43 1.43zM17.42 8.83l2.86-2.86c-3.95-3.95-10.35-3.96-14.3-.02 3.93-1.3 8.31-.25 11.44 2.88zM5.95 5.98c-3.94 3.95-3.93 10.35.02 14.3l2.86-2.86C5.7 14.29 4.65 9.91 5.95 5.98z", tags: "beach vacation travel summer" },
  // ── Fauna (additional) ─────────────────────────────────────────────────────────
  { id: "bird-flying", name: "Bird", category: "Fauna", path: "M23 11.99l-2.44-2.79-.56-6.57-6.82.3L12 2 10.82 2.93l-6.82-.3-.56 6.57L1 11.99l1.51 1.51.62 5.78 3.5-.4.37.48V21h3v-2h2v2h3v-1.24l.37-.48 3.5.4.62-5.78L23 11.99zM9 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z", tags: "bird animal nature" },
  { id: "rabbit-animal", name: "Rabbit", category: "Fauna", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "rabbit animal nature" },
  { id: "butterfly-insect", name: "Butterfly", category: "Fauna", path: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z", tags: "butterfly insect nature" },
  // ── Flora (additional) ─────────────────────────────────────────────────────────
  { id: "sunflower", name: "Sunflower", category: "Flora", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z", tags: "sunflower flower nature flora" },
  { id: "palm-tree", name: "Palm Tree", category: "Flora", path: "M17 8C8 10 5.9 16.17 3.82 21H5.71c.19-.53.39-1.05.59-1.55C7.29 17.18 8.5 15.84 10 15c1.5-.84 3.5-1 5.5-1 2 0 4 .5 5.5 1.5V13c-1.5-.5-3.5-.5-5.5 0 2-2 2-5 2-5z", tags: "palm tree tropical flora" },
  { id: "mushroom", name: "Mushroom", category: "Flora", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "mushroom fungi nature flora" },
  // ── Religion (additional) ──────────────────────────────────────────────────────
  { id: "church-building", name: "Church", category: "Religion", path: "M12 3L2 12h3v8h14v-8h3L12 3zm5 15H7v-8h10v8zm-4-2h-2v-4h2v4z", tags: "church religion building" },
  { id: "dove-peace", name: "Dove", category: "Religion", path: "M23 11.99l-2.44-2.79-.56-6.57-6.82.3L12 2 10.82 2.93l-6.82-.3-.56 6.57L1 11.99l1.51 1.51.62 5.78 3.5-.4.37.48V21h3v-2h2v2h3v-1.24l.37-.48 3.5.4.62-5.78L23 11.99z", tags: "dove peace religion symbol" },
  // ── Architecture (additional) ──────────────────────────────────────────────────
  { id: "castle-building", name: "Castle", category: "Architecture", path: "M17 11V3H7v4H3v14h8v-4h2v4h8V11h-4zM7 19H5v-2h2v2zm0-4H5v-2h2v2zm0-4H5v-2h2v2zm4 4H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2z", tags: "castle architecture historic" },
  { id: "lighthouse", name: "Lighthouse", category: "Architecture", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "lighthouse architecture coastal" },
  // ── Recreation Entertainment (additional) ──────────────────────────────────────
  { id: "palette-art", name: "Art Palette", category: "Recreation Entertainment", path: "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", tags: "palette art creative design" },
  { id: "camera-photo", name: "Camera", category: "Recreation Entertainment", path: "M12 15.2c-1.77 0-3.2-1.43-3.2-3.2s1.43-3.2 3.2-3.2 3.2 1.43 3.2 3.2-1.43 3.2-3.2 3.2zM9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z", tags: "camera photo photography" },
  { id: "headphones-music", name: "Headphones", category: "Recreation Entertainment", path: "M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z", tags: "headphones music audio" },
  // ── People (additional) ────────────────────────────────────────────────────────
  { id: "teacher-person", name: "Teacher", category: "People", path: "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z", tags: "teacher education person" },
  { id: "chef-person", name: "Chef", category: "People", path: "M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7c0-8-15.03-8-15.03 0h15.03z", tags: "chef cook food professional" },
  { id: "engineer-person", name: "Engineer", category: "People", path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", tags: "engineer professional person" },
  // ── Symbols Decoration (additional) ────────────────────────────────────────────
  { id: "heart-outline", name: "Heart Outline", category: "Symbols Decoration", path: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", tags: "heart love symbol decoration" },
  { id: "recycle-symbol", name: "Recycle", category: "Symbols Decoration", path: "M12 6.5L7 14h10l-5-7.5zm0 3.5c.83 0 1.5.67 1.5 1.5S12.83 13 12 13s-1.5-.67-1.5-1.5S11.17 10 12 10zm-5.5 4H3l4.5 7.5L12 24l4.5-2.5L21 14h-3.5L12 22l-5.5-8z", tags: "recycle environment symbol" },
  { id: "checkmark-circle", name: "Checkmark Circle", category: "Symbols Decoration", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z", tags: "checkmark circle approved symbol" },
  { id: "yin-yang", name: "Yin Yang", category: "Symbols Decoration", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z", tags: "yin yang symbol balance" },
  { id: "peace-sign", name: "Peace Sign", category: "Symbols Decoration", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "peace sign symbol" },
  // ── Stars Shapes (additional) ──────────────────────────────────────────────────
  { id: "badge-shape", name: "Badge Shape", category: "Stars Shapes", path: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z", tags: "badge shape seal" },
  { id: "rounded-rect", name: "Rounded Rectangle", category: "Stars Shapes", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z", tags: "rounded rectangle shape" },
  { id: "rhombus", name: "Rhombus", category: "Stars Shapes", path: "M12 2L2 12l10 10 10-10z", tags: "rhombus diamond shape" },
  { id: "cross-shape", name: "Cross Shape", category: "Stars Shapes", path: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z", tags: "cross shape symbol" },
  { id: "oval-shape", name: "Oval", category: "Stars Shapes", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z", tags: "oval ellipse shape" },
  // ── Business Finance (batch 3) ─────────────────────────────────────────────────
  { id: "invoice-doc", name: "Invoice", category: "Business Finance", path: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 8H7v-2h4v2zm2-4H7v-2h6v2z", tags: "invoice billing finance document" },
  { id: "wallet", name: "Wallet", category: "Business Finance", path: "M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", tags: "wallet money finance payment" },
  { id: "receipt", name: "Receipt", category: "Business Finance", path: "M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z", tags: "receipt bill payment finance" },
  // ── Medical (batch 3) ──────────────────────────────────────────────────────────
  { id: "blood-drop", name: "Blood Drop", category: "Medical", path: "M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z", tags: "blood medical health" },
  { id: "wheelchair", name: "Wheelchair", category: "Medical", path: "M19 13.5c0 2.49-2.01 4.5-4.5 4.5S10 15.99 10 13.5c0-.17.02-.34.04-.5H8.07c-.04.16-.07.33-.07.5C8 17.09 10.91 20 14.5 20s6.5-2.91 6.5-6.5c0-2.98-2-5.5-4.75-6.27l-.5 1.93c1.89.56 3.25 2.3 3.25 4.34zM12.5 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4.5 9.5h-3.5L12 9.5c-.28-.49-.8-.83-1.4-.83-.29 0-.56.08-.8.22l-3 1.75c-.4.23-.67.66-.67 1.14 0 .44.21.83.53 1.09L9.5 14v4H11v-4.5l-1.6-1.2 1.85-1.1.65 1.3H16v-1.5h-1.5z", tags: "wheelchair disability medical" },
  { id: "lungs", name: "Lungs", category: "Medical", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "lungs respiratory medical" },
  // ── Law Economics (batch 3) ────────────────────────────────────────────────────
  { id: "safe-vault", name: "Safe Vault", category: "Law Economics", path: "M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-6 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z", tags: "safe vault security law" },
  { id: "handcuffs", name: "Handcuffs", category: "Law Economics", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z", tags: "handcuffs law enforcement security" },
  // ── Agriculture Construction (batch 3) ─────────────────────────────────────────
  { id: "hammer-tool", name: "Hammer", category: "Agriculture Construction", path: "M15.5 2.1L11.44 6.16l1.06 3.54-6.04 6.04-3.54-1.07L.86 16.74l2.83 2.83 1.41-1.41-.71-.71 1.41-1.41.71.71 1.41-1.41-.71-.71 1.41-1.41.71.71 1.41-1.41-.71-.71 1.41-1.41.71.71 2.83-2.83-1.06-3.54 4.24-4.24-.71-2.12zm4.24 4.24l1.41-1.41-1.41-1.41-1.41 1.41 1.41 1.41z", tags: "hammer tool construction" },
  { id: "paint-brush", name: "Paint Brush", category: "Agriculture Construction", path: "M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z", tags: "paint brush art construction" },
  { id: "ruler-tool", name: "Ruler", category: "Agriculture Construction", path: "M21 6.5l-4-4-14 14 4 4 14-14zm-14 11.5l-2-2 11-11 2 2-11 11z", tags: "ruler measure construction" },
  // ── Engineering Technology (batch 3) ──────────────────────────────────────────
  { id: "printer", name: "Printer", category: "Engineering Technology", path: "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z", tags: "printer print technology" },
  { id: "scanner", name: "Scanner", category: "Engineering Technology", path: "M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v4H6zm3 0h2v4H9zm3 0h2v4h-2zm3 0h2v4h-2z", tags: "scanner scan technology" },
  { id: "microchip", name: "Microchip", category: "Engineering Technology", path: "M9 3H7v2H5v2h2v2H5v2h2v2H5v2h2v2h2v2h2v-2h2v2h2v-2h2v-2h2v-2h-2v-2h2v-2h-2V9h2V7h-2V5h-2V3h-2v2h-2V3H9zm0 4h6v6H9V7z", tags: "microchip chip technology electronics" },
  // ── Transport (batch 3) ────────────────────────────────────────────────────────
  { id: "ambulance-van", name: "Ambulance Van", category: "Transport", path: "M19 3H5c-1.1 0-2 .9-2 2v11H1v3h1c0 1.66 1.34 3 3 3s3-1.34 3-3h8c0 1.66 1.34 3 3 3s3-1.34 3-3h1v-5l-3-4V5c0-1.1-.9-2-2-2zM5 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7-10h-1.5V10H9v-1.5H7.5V7H9V5.5h1.5V7H12v1.5zm2 10c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3-7h-2.5V9H17l2 2.5z", tags: "ambulance emergency medical transport" },
  { id: "fire-truck", name: "Fire Truck", category: "Transport", path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z", tags: "fire truck emergency transport" },
  // ── Food Drinks (batch 3) ──────────────────────────────────────────────────────
  { id: "tea-cup", name: "Tea Cup", category: "Food Drinks", path: "M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z", tags: "tea cup drink beverage" },
  { id: "bottle", name: "Bottle", category: "Food Drinks", path: "M11 3V1H9v2H7v5l2 2v11h6V10l2-2V3h-2V1h-2v2h-2zm3 14H10v-9l2-2 2 2v9z", tags: "bottle drink beverage" },
  // ── Science Education (batch 3) ────────────────────────────────────────────────
  { id: "globe-world", name: "Globe", category: "Science Education", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z", tags: "globe world geography education" },
  { id: "pencil-edit", name: "Pencil", category: "Science Education", path: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z", tags: "pencil edit write education" },
  // ── Communication (batch 3) ────────────────────────────────────────────────────
  { id: "radio-tower", name: "Radio Tower", category: "Communication", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "radio tower broadcast communication" },
  { id: "fax-machine", name: "Fax", category: "Communication", path: "M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z", tags: "fax machine office communication" },
  // ── Sport (batch 3) ────────────────────────────────────────────────────────────
  { id: "golf-ball", name: "Golf", category: "Sport", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z", tags: "golf sport ball" },
  { id: "boxing-glove", name: "Boxing", category: "Sport", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "boxing sport martial arts" },
  // ── Tourism Travel (batch 3) ───────────────────────────────────────────────────
  { id: "hotel-building", name: "Hotel", category: "Tourism Travel", path: "M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z", tags: "hotel travel accommodation" },
  { id: "map-route", name: "Map Route", category: "Tourism Travel", path: "M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z", tags: "map route travel navigation" },
  // ── Fauna (batch 3) ────────────────────────────────────────────────────────────
  { id: "cat-animal", name: "Cat", category: "Fauna", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z", tags: "cat animal pet fauna" },
  { id: "dog-animal", name: "Dog", category: "Fauna", path: "M4.5 11h-2V9H1v6h1.5v-2.5h2V15H6V9H4.5v2zm2.5-.5h1.5V15H10V10.5h1.5V9H7v1.5zm5.5 0H14V15h1.5v-4h1.5V9.5h-4.5v1zm6 0H20V15h1.5v-4H23V9.5h-4.5v1z", tags: "dog animal pet fauna" },
  // ── Flora (batch 3) ────────────────────────────────────────────────────────────
  { id: "rose-flower", name: "Rose", category: "Flora", path: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z", tags: "rose flower flora love" },
  { id: "bamboo", name: "Bamboo", category: "Flora", path: "M17 8C8 10 5.9 16.17 3.82 21H5.71c.19-.53.39-1.05.59-1.55C7.29 17.18 8.5 15.84 10 15c1.5-.84 3.5-1 5.5-1 2 0 4 .5 5.5 1.5V13c-1.5-.5-3.5-.5-5.5 0 2-2 2-5 2-5z", tags: "bamboo plant flora nature" },
  // ── Religion (batch 3) ────────────────────────────────────────────────────────
  { id: "menorah", name: "Menorah", category: "Religion", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V8h2v9zm4 0h-2V8h2v9z", tags: "menorah jewish religion" },
  // ── Architecture (batch 3) ────────────────────────────────────────────────────
  { id: "windmill", name: "Windmill", category: "Architecture", path: "M12 3L2 12h3v8h14v-8h3L12 3zm5 15H7v-8h10v8zm-4-2h-2v-4h2v4z", tags: "windmill architecture wind energy" },
  { id: "factory", name: "Factory", category: "Architecture", path: "M22 20H2v-2h1V8.83l5-3.57V8L13 4v4l5 3V6h2v12h1v2zM11 18h2v-2h-2v2zm-4 0h2v-2H7v2zm8 0h2v-2h-2v2z", tags: "factory industrial architecture" },
  // ── People (batch 3) ──────────────────────────────────────────────────────────
  { id: "graduate-person", name: "Graduate", category: "People", path: "M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z", tags: "graduate student education person" },
  { id: "nurse-person", name: "Nurse", category: "People", path: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", tags: "nurse medical person healthcare" },
  // ── Symbols Decoration (batch 3) ──────────────────────────────────────────────
  { id: "star-outline", name: "Star Outline", category: "Symbols Decoration", path: "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z", tags: "star outline symbol" },
  { id: "bookmark", name: "Bookmark", category: "Symbols Decoration", path: "M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z", tags: "bookmark save symbol" },
  { id: "tag-label", name: "Tag", category: "Symbols Decoration", path: "M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z", tags: "tag label price symbol" },
  // ── Stars Shapes (batch 3) ────────────────────────────────────────────────────
  { id: "arrow-right", name: "Arrow Right", category: "Stars Shapes", path: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z", tags: "arrow right direction shape" },
  { id: "arrow-circle", name: "Arrow Circle", category: "Stars Shapes", path: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-5h2V7h-2v8zm-2 0h2v-4H9v4zm6-4h2v4h-2v-4z", tags: "arrow circle shape direction" }
];

// server/routers/template.ts
var templateRouter = router({
  list: publicProcedure.input(z3.object({
    category: z3.string().optional(),
    search: z3.string().optional(),
    shape: z3.string().optional(),
    page: z3.number().int().min(1).default(1),
    pageSize: z3.number().int().min(1).max(100).default(24)
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { items: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
    const conditions = [eq4(templates.isActive, true)];
    if (input.category && input.category !== "All") {
      conditions.push(eq4(templates.category, input.category));
    }
    if (input.shape) {
      conditions.push(eq4(templates.shape, input.shape));
    }
    if (input.search && input.search.trim().length > 0) {
      const q = `%${input.search.trim()}%`;
      conditions.push(
        or(
          like(templates.name, q),
          like(templates.nameDE, q),
          like(templates.searchTerms, q),
          like(templates.category, q)
        )
      );
    }
    const where = and(...conditions);
    const offset = (input.page - 1) * input.pageSize;
    const [items, totalResult] = await Promise.all([
      db.select().from(templates).where(where).orderBy(asc(templates.sortOrder)).limit(input.pageSize).offset(offset),
      db.select({ total: count() }).from(templates).where(where)
    ]);
    const total = totalResult[0]?.total ?? 0;
    return {
      items,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize)
    };
  }),
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const results = await db.select({ category: templates.category, count: count() }).from(templates).where(eq4(templates.isActive, true)).groupBy(templates.category).orderBy(asc(templates.category));
    return results;
  }),
  getBySlug: publicProcedure.input(z3.object({ slug: z3.string() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const [t2] = await db.select().from(templates).where(eq4(templates.slug, input.slug)).limit(1);
    return t2 ?? null;
  })
});
var iconRouter = router({
  list: publicProcedure.input(z3.object({
    category: z3.string().optional(),
    search: z3.string().optional()
  })).query(async ({ input }) => {
    let icons3 = BUILT_IN_ICONS;
    if (input.category) {
      icons3 = icons3.filter((i) => i.category === input.category);
    }
    if (input.search) {
      const q = input.search.toLowerCase();
      icons3 = icons3.filter(
        (i) => i.name.toLowerCase().includes(q) || i.tags.toLowerCase().includes(q)
      );
    }
    return icons3;
  }),
  categories: publicProcedure.query(() => {
    return Array.from(new Set(BUILT_IN_ICONS.map((i) => i.category)));
  })
});

// server/routers/pdfEditor.ts
import { z as z4 } from "zod";

// server/pdfStampService.ts
import { PDFDocument, degrees } from "pdf-lib";
import sharp from "sharp";
async function mergePdfStamp(pdfBuffer, stampSvg, placement, pageIndices) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  const targets = pageIndices.length > 0 ? pageIndices.filter((i) => i >= 0 && i < totalPages) : Array.from({ length: totalPages }, (_, i) => i);
  const dpi = 300;
  const stampPxNatural = Math.round(placement.stampWidthMm * dpi / 25.4);
  const stampPxScaled = Math.round(stampPxNatural * placement.scale);
  const stampPx = Math.max(stampPxScaled, 20);
  const svgBuffer = Buffer.from(stampSvg);
  const pngBuffer = await sharp(svgBuffer).resize(stampPx, stampPx, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  for (const pageIdx of targets) {
    const page = pages[pageIdx];
    if (!page) continue;
    const { width: pageWidthPt, height: pageHeightPt } = page.getSize();
    const stampWidthPt = stampPx / dpi * 72;
    const stampHeightPt = stampWidthPt;
    const xPt = placement.xPct / 100 * pageWidthPt - stampWidthPt / 2;
    const yPt = pageHeightPt - placement.yPct / 100 * pageHeightPt - stampHeightPt / 2;
    page.drawImage(pngImage, {
      x: xPt,
      y: yPt,
      width: stampWidthPt,
      height: stampHeightPt,
      rotate: degrees(-placement.rotation),
      opacity: 0.92
    });
  }
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// server/storage.ts
import { put, del } from "@vercel/blob";
import * as fs from "fs/promises";
import * as path from "path";
var IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;
var LOCAL_STORAGE_DIR = path.join(process.cwd(), ".local-storage");
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  if (IS_VERCEL) {
    const blob = await put(relKey, data, {
      access: "public",
      contentType,
      addRandomSuffix: false
    });
    return { key: relKey, url: blob.url };
  }
  const localPath = path.join(LOCAL_STORAGE_DIR, relKey);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, data);
  const url = `/local-storage/${relKey}`;
  return { key: relKey, url };
}
async function storageGet(relKey, _expiresIn = 3600) {
  if (IS_VERCEL) {
    const baseUrl = process.env.BLOB_BASE_URL || "";
    const url = baseUrl ? `${baseUrl}/${relKey}` : relKey;
    return { key: relKey, url };
  }
  return { key: relKey, url: `/local-storage/${relKey}` };
}

// server/routers/pdfEditor.ts
import { nanoid as nanoid3 } from "nanoid";
var pdfEditorRouter = router({
  /**
   * Upload a PDF and get back a storage key for subsequent operations.
   * Accepts base64-encoded PDF content.
   */
  uploadPdf: publicProcedure.input(z4.object({
    pdfBase64: z4.string(),
    filename: z4.string().optional()
  })).mutation(async ({ input }) => {
    const pdfBuffer = Buffer.from(input.pdfBase64, "base64");
    if (pdfBuffer.length > 20 * 1024 * 1024) {
      throw new Error("PDF file too large (max 20 MB)");
    }
    const key = `pdf-uploads/${nanoid3()}.pdf`;
    await storagePut(key, pdfBuffer, "application/pdf");
    return { key };
  }),
  /**
   * Merge a stamp onto specified pages of a previously uploaded PDF.
   * Returns a signed URL to download the stamped PDF.
   */
  stampPdf: publicProcedure.input(z4.object({
    pdfKey: z4.string(),
    stampSvg: z4.string(),
    placement: z4.object({
      xPct: z4.number().min(0).max(100),
      yPct: z4.number().min(0).max(100),
      scale: z4.number().min(0.1).max(5),
      rotation: z4.number().min(0).max(360),
      stampWidthMm: z4.number().min(10).max(200)
    }),
    pageIndices: z4.array(z4.number().int().min(0)).default([])
  })).mutation(async ({ input }) => {
    const { url: pdfUrl } = await storageGet(input.pdfKey);
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) throw new Error("Failed to fetch PDF from storage");
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    const stampedPdf = await mergePdfStamp(
      pdfBuffer,
      input.stampSvg,
      input.placement,
      input.pageIndices
    );
    const outputKey = `pdf-stamped/${nanoid3()}.pdf`;
    await storagePut(outputKey, stampedPdf, "application/pdf");
    const { url } = await storageGet(outputKey);
    return { downloadUrl: url, outputKey };
  })
});

// server/routers/admin.ts
import { z as z5 } from "zod";
import { TRPCError as TRPCError2 } from "@trpc/server";
import { eq as eq5, desc } from "drizzle-orm";
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError2({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var adminRouter = router({
  // ── Dashboard stats ──────────────────────────────────────────────────────────
  stats: adminProcedure2.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    const [orderRows, designRows, userRows, templateRows] = await Promise.all([
      db.select().from(orders),
      db.select().from(designs),
      db.select().from(users),
      db.select().from(templates)
    ]);
    const totalRevenue = orderRows.filter((o) => o.status === "fulfilled" || o.status === "paid").reduce((sum, o) => sum + o.amountCents, 0);
    const fulfillmentFailures = orderRows.filter((o) => o.status === "failed").length;
    return {
      totalOrders: orderRows.length,
      fulfilledOrders: orderRows.filter((o) => o.status === "fulfilled").length,
      pendingOrders: orderRows.filter((o) => o.status === "pending").length,
      failedOrders: fulfillmentFailures,
      totalRevenueCents: totalRevenue,
      totalDesigns: designRows.length,
      totalUsers: userRows.length,
      totalTemplates: templateRows.length,
      activeTemplates: templateRows.filter((t2) => t2.isActive).length
    };
  }),
  // ── Orders ───────────────────────────────────────────────────────────────────
  listOrders: adminProcedure2.input(z5.object({
    status: z5.enum(["pending", "paid", "fulfilled", "failed"]).optional(),
    limit: z5.number().int().min(1).max(100).default(50),
    offset: z5.number().int().min(0).default(0)
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(input.limit).offset(input.offset);
    return input.status ? rows.filter((r) => r.status === input.status) : rows;
  }),
  retryFulfillment: adminProcedure2.input(z5.object({ orderId: z5.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(orders).set({ status: "paid" }).where(eq5(orders.id, input.orderId));
    return { queued: true };
  }),
  // ── Customers ────────────────────────────────────────────────────────────────
  listCustomers: adminProcedure2.input(z5.object({
    search: z5.string().optional(),
    limit: z5.number().int().min(1).max(100).default(50)
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(input.limit);
    if (input.search) {
      const q = input.search.toLowerCase();
      return rows.filter((r) => (r.name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q));
    }
    return rows;
  }),
  // ── Designs ──────────────────────────────────────────────────────────────────
  listDesigns: adminProcedure2.input(z5.object({ limit: z5.number().int().min(1).max(100).default(50) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(designs).orderBy(desc(designs.createdAt)).limit(input.limit);
  }),
  // ── Templates ────────────────────────────────────────────────────────────────
  listTemplates: adminProcedure2.input(z5.object({ limit: z5.number().int().min(1).max(200).default(100) })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    return db.select().from(templates).orderBy(desc(templates.createdAt)).limit(input.limit);
  }),
  toggleTemplate: adminProcedure2.input(z5.object({ id: z5.number().int().positive(), active: z5.boolean() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(templates).set({ isActive: input.active }).where(eq5(templates.id, input.id));
    return { updated: true };
  }),
  deleteTemplate: adminProcedure2.input(z5.object({ id: z5.number().int().positive() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    await db.update(templates).set({ isActive: false }).where(eq5(templates.id, input.id));
    return { deleted: true };
  }),
  createTemplate: adminProcedure2.input(z5.object({
    name: z5.string().min(1),
    category: z5.string().min(1),
    stateJson: z5.any(),
    thumbnailSvg: z5.string().optional()
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError2({ code: "INTERNAL_SERVER_ERROR" });
    await db.insert(templates).values({
      name: input.name,
      category: input.category,
      stateJson: input.stateJson,
      thumbnailSvg: input.thumbnailSvg ?? null,
      isActive: true
    });
    return { created: true };
  })
});

// server/_core/systemRouter.ts
import { z as z6 } from "zod";
var systemRouter = router({
  health: publicProcedure.input(
    z6.object({
      timestamp: z6.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  }))
});

// server/routers.ts
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: protectedProcedure.mutation(() => {
      return { success: true };
    })
  }),
  design: designRouter,
  order: orderRouter,
  template: templateRouter,
  icon: iconRouter,
  pdfEditor: pdfEditorRouter,
  admin: adminRouter
});

// server/auth.ts
import { ExpressAuth, getSession } from "@auth/express";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "@auth/express/providers/resend";
import Google from "@auth/express/providers/google";
import { drizzle as drizzle2 } from "drizzle-orm/node-postgres";
import { Pool as Pool2 } from "pg";
import { eq as eq6 } from "drizzle-orm";
function getDb2() {
  const pool = new Pool2({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5
  });
  return drizzle2(pool);
}
var authConfig = {
  adapter: DrizzleAdapter(getDb2(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens
  }),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM || "noreply@stampelo.ch",
      apiKey: process.env.RESEND_API_KEY
    }),
    ...process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        const db = getDb2();
        const dbUser = await db.select({ role: users.role }).from(users).where(eq6(users.id, user.id)).limit(1);
        session.user.role = dbUser[0]?.role ?? "user";
      }
      return session;
    },
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && user.email === adminEmail && user.id) {
        const db = getDb2();
        await db.update(users).set({ role: "admin" }).where(eq6(users.id, user.id));
      }
      return true;
    }
  },
  pages: {
    signIn: "/account",
    error: "/account"
  },
  trustHost: true
};
var authMiddleware = ExpressAuth(authConfig);

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    const session = await getSession(opts.req, authConfig);
    if (session?.user?.id) {
      user = await getUserById(session.user.id) ?? null;
    }
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/webhookHandler.ts
import Stripe from "stripe";
import { eq as eq7 } from "drizzle-orm";

// client/src/editor/svgUtils.ts
var CANVAS_SIZE = 250;
var CANVAS_CENTER = CANVAS_SIZE / 2;
function getShabbyFilter(id) {
  return `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence baseFrequency="0.5" numOctaves="2" result="noise" seed="390" type="fractalNoise"/>
  <feColorMatrix result="noiseMask" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 5 -3.2"/>
  <feComposite in="SourceGraphic" in2="noiseMask" operator="out" result="eroded"/>
  <feTurbulence baseFrequency="0.002" in="eroded" result="warp" type="fractalNoise"/>
  <feGaussianBlur in="eroded" result="blurred" stdDeviation="0.3"/>
  <feComposite in="eroded" in2="blurred" operator="out" result="combined"/>
  <feComposite in2="warp" result="warped"/>
  <feColorMatrix result="final" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 20 -9"/>
  <feComposite in="eroded" in2="final" operator="in"/>
</filter>`;
}
function getGoldFilter(id) {
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:#b8860b;stop-opacity:1"/>
  <stop offset="25%" style="stop-color:#ffd700;stop-opacity:1"/>
  <stop offset="50%" style="stop-color:#daa520;stop-opacity:1"/>
  <stop offset="75%" style="stop-color:#ffd700;stop-opacity:1"/>
  <stop offset="100%" style="stop-color:#b8860b;stop-opacity:1"/>
</linearGradient>`;
}
function getSilverFilter(id) {
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:#808080;stop-opacity:1"/>
  <stop offset="25%" style="stop-color:#d3d3d3;stop-opacity:1"/>
  <stop offset="50%" style="stop-color:#a9a9a9;stop-opacity:1"/>
  <stop offset="75%" style="stop-color:#d3d3d3;stop-opacity:1"/>
  <stop offset="100%" style="stop-color:#808080;stop-opacity:1"/>
</linearGradient>`;
}
function getClipPath(stamp, clipId) {
  const { shape, widthMm, heightMm } = stamp;
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const rx = widthMm / 150 * (CANVAS_SIZE / 2) * 0.95;
  const ry = shape === "oval" ? heightMm / 150 * (CANVAS_SIZE / 2) * 0.95 : rx;
  if (shape === "round") {
    return `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${rx}"/></clipPath>`;
  }
  if (shape === "oval") {
    return `<clipPath id="${clipId}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>`;
  }
  if (shape === "rectangular") {
    const w = rx * 2;
    const h = ry * 2;
    return `<clipPath id="${clipId}"><rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="4"/></clipPath>`;
  }
  if (shape === "triangular") {
    const r = rx;
    const x1 = cx;
    const y1 = cy - r;
    const x2 = cx + r * Math.cos(Math.PI / 6);
    const y2 = cy + r * Math.sin(Math.PI / 6);
    const x3 = cx - r * Math.cos(Math.PI / 6);
    const y3 = cy + r * Math.sin(Math.PI / 6);
    return `<clipPath id="${clipId}"><polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}"/></clipPath>`;
  }
  return `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${rx}"/></clipPath>`;
}
function renderFrame(el, stamp) {
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const maxR = stamp.widthMm / 150 * (CANVAS_SIZE / 2) * 0.95;
  const r = el.radius / 100 * maxR;
  const sw = el.strokeWidth;
  const color = el.color;
  if (el.lineBreak > 0) {
    const circumference = 2 * Math.PI * r;
    const gapAngle = el.lineBreak;
    const gapLength = gapAngle / 360 * circumference;
    const dashLength = circumference - gapLength;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${dashLength} ${gapLength}" stroke-dashoffset="${gapLength / 2}"/>`;
  }
  if (stamp.shape === "round" || stamp.shape === "oval") {
    if (stamp.shape === "oval") {
      const ry = stamp.heightMm / 150 * (CANVAS_SIZE / 2) * 0.95;
      const rx2 = el.radius / 100 * maxR;
      const ry2 = el.radius / 100 * ry;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx2}" ry="${ry2}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
  }
  if (stamp.shape === "rectangular") {
    const maxW = maxR * 2;
    const maxH = stamp.heightMm / 150 * (CANVAS_SIZE / 2) * 0.95 * 2;
    const w = el.radius / 100 * maxW;
    const h = el.radius / 100 * maxH;
    return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="4" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
  }
  if (stamp.shape === "triangular") {
    const rr = el.radius / 100 * maxR;
    const x1 = cx, y1 = cy - rr;
    const x2 = cx + rr * Math.cos(Math.PI / 6), y2 = cy + rr * Math.sin(Math.PI / 6);
    const x3 = cx - rr * Math.cos(Math.PI / 6), y3 = cy + rr * Math.sin(Math.PI / 6);
    return `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
  }
  return "";
}
function renderTextOnPath(el, stamp, elIdx) {
  const cx = CANVAS_CENTER;
  const cy = CANVAS_CENTER;
  const maxR = stamp.widthMm / 150 * (CANVAS_SIZE / 2) * 0.95;
  const r = el.radius / 100 * maxR;
  const pathId = `tp-path-${elIdx}`;
  const startAngleDeg = el.startAngle;
  const startRad = (startAngleDeg - 90) * Math.PI / 180;
  const startX = cx + r * Math.cos(startRad);
  const startY = cy + r * Math.sin(startRad);
  const midRad = startRad + Math.PI;
  const midX = cx + r * Math.cos(midRad);
  const midY = cy + r * Math.sin(midRad);
  let pathD;
  if (el.inverse) {
    pathD = `M ${startX.toFixed(2)},${startY.toFixed(2)} A ${r},${r} 0 0,0 ${midX.toFixed(2)},${midY.toFixed(2)} A ${r},${r} 0 0,0 ${startX.toFixed(2)},${startY.toFixed(2)}`;
  } else {
    pathD = `M ${startX.toFixed(2)},${startY.toFixed(2)} A ${r},${r} 0 0,1 ${midX.toFixed(2)},${midY.toFixed(2)} A ${r},${r} 0 0,1 ${startX.toFixed(2)},${startY.toFixed(2)}`;
  }
  const fontStyle = `font-family="${el.font}" font-size="${el.fontSize}"${el.bold ? ' font-weight="bold"' : ""}${el.italic ? ' font-style="italic"' : ""}`;
  const spacing = el.letterSpacing !== 100 ? ` letter-spacing="${((el.letterSpacing - 100) * 0.08).toFixed(2)}"` : "";
  const anchor = el.align;
  const offset = el.align === "center" ? "50%" : el.align === "right" ? "100%" : "0%";
  return `<defs><path id="${pathId}" d="${pathD}" fill="none"/></defs>
<text fill="${el.color}" ${fontStyle}${spacing}>
  <textPath href="#${pathId}" startOffset="${offset}" text-anchor="${anchor}">${escapeXml(el.text)}</textPath>
</text>`;
}
function renderCenterText(el) {
  const x = el.x / 100 * CANVAS_SIZE;
  const y = el.y / 100 * CANVAS_SIZE;
  const fontStyle = `font-family="${el.font}" font-size="${el.fontSize}"${el.bold ? ' font-weight="bold"' : ""}${el.italic ? ' font-style="italic"' : ""}`;
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="${el.color}" ${fontStyle} text-anchor="middle" dominant-baseline="central">${escapeXml(el.text)}</text>`;
}
function renderImage(el) {
  const x = el.x / 100 * CANVAS_SIZE;
  const y = el.y / 100 * CANVAS_SIZE;
  const scale = el.scale / 100;
  return `<g transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${scale.toFixed(3)})" fill="${el.color}">${el.svgContent}</g>`;
}
function renderElement(el, stamp, idx) {
  if (!el.visible) return "";
  switch (el.type) {
    case "frame":
      return renderFrame(el, stamp);
    case "text-on-path":
      return renderTextOnPath(el, stamp, idx);
    case "center-text":
      return renderCenterText(el);
    case "image":
      return renderImage(el);
    default:
      return "";
  }
}
function renderStampSvg(stamp, opts) {
  const { effects } = stamp;
  const filterId = `filter-${stamp.id}`;
  const goldId = `gold-${stamp.id}`;
  const silverId = `silver-${stamp.id}`;
  const clipId = `clip-${stamp.id}`;
  const defs = [];
  defs.push(getClipPath(stamp, clipId));
  if (effects.shabby) defs.push(getShabbyFilter(filterId));
  if (effects.gold) defs.push(getGoldFilter(goldId));
  if (effects.silver) defs.push(getSilverFilter(silverId));
  const filterAttr = effects.shabby ? ` filter="url(#${filterId})"` : "";
  const elementsHtml = stamp.elements.map((el, idx) => renderElement(el, stamp, idx)).join("\n");
  const watermarkHtml = opts?.watermark ? `<text x="${CANVAS_CENTER}" y="${CANVAS_CENTER + 30}" fill="rgba(0,0,0,0.15)" font-size="12" font-family="Arial" text-anchor="middle" transform="rotate(-30, ${CANVAS_CENTER}, ${CANVAS_CENTER})">PREVIEW \u2014 stampelo.com</text>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}">
  <defs>${defs.join("\n")}</defs>
  <g clip-path="url(#${clipId})"${filterAttr}>
    ${elementsHtml}
  </g>
  ${watermarkHtml}
</svg>`;
}
function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// server/exportService.ts
function generateSvg(stamp) {
  return renderStampSvg(stamp, { forExport: true });
}
async function generatePng(stamp, dpi = 600) {
  const sharp2 = (await import("sharp")).default;
  const svgString = generateSvg(stamp);
  const sizePx = Math.round(stamp.widthMm * dpi / 25.4);
  const svgBuffer = Buffer.from(svgString);
  const png = await sharp2(svgBuffer).resize(sizePx, sizePx, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer();
  return png;
}
async function generatePdf(stamp) {
  const { PDFDocument: PDFDocument2, rgb } = await import("pdf-lib");
  const pngBuffer = await generatePng(stamp, 300);
  const pdfDoc = await PDFDocument2.create();
  const sizePt = stamp.widthMm * 72 / 25.4;
  const page = pdfDoc.addPage([sizePt + 40, sizePt + 40]);
  const pngImage = await pdfDoc.embedPng(pngBuffer);
  page.drawImage(pngImage, {
    x: 20,
    y: 20,
    width: sizePt,
    height: sizePt
  });
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
async function generateDocx(stamp) {
  const { Document, Packer, Paragraph, ImageRun, AlignmentType } = await import("docx");
  const pngBuffer = await generatePng(stamp, 150);
  const sizeCm = stamp.widthMm / 10;
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: pngBuffer,
              transformation: {
                width: Math.round(sizeCm * 37.8),
                height: Math.round(sizeCm * 37.8)
              },
              type: "png"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: []
        })
      ]
    }]
  });
  return await Packer.toBuffer(doc);
}

// server/webhookHandler.ts
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
async function handleStripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).send("Webhook signature verification failed");
  }
  console.log(`[Webhook] Event: ${event.type} (${event.id})`);
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    await fulfillOrder(session);
  }
  res.json({ received: true });
}
async function fulfillOrder(session) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }
  const [existingOrder] = await db.select().from(orders).where(eq7(orders.stripeSessionId, session.id)).limit(1);
  if (!existingOrder) {
    console.error("[Webhook] Order not found for session:", session.id);
    return;
  }
  if (existingOrder.status === "fulfilled") {
    console.log("[Webhook] Order already fulfilled, skipping:", existingOrder.id);
    return;
  }
  await db.update(orders).set({ status: "paid" }).where(eq7(orders.id, existingOrder.id));
  try {
    if (!existingOrder.designId) throw new Error("Order has no associated design");
    const [design] = await db.select().from(designs).where(eq7(designs.id, existingOrder.designId)).limit(1);
    if (!design || !design.stateJson) {
      throw new Error("Design not found");
    }
    const state = design.stateJson;
    const stamp = state.stamps.find((s) => s.id === state.activeStampId) ?? state.stamps[0];
    if (!stamp) throw new Error("Stamp not found in design state");
    const plan = existingOrder.plan;
    const downloadUrls = [];
    const pngBuffer = await generatePng(stamp, 600);
    const pngResult = await storagePut(`orders/${existingOrder.id}/stamp.png`, pngBuffer, "image/png");
    downloadUrls.push({ format: "png", key: pngResult.key });
    if (["econom", "premium", "vip"].includes(plan)) {
      const svgString = generateSvg(stamp);
      const svgResult = await storagePut(`orders/${existingOrder.id}/stamp.svg`, Buffer.from(svgString), "image/svg+xml");
      downloadUrls.push({ format: "svg", key: svgResult.key });
    }
    if (["premium", "vip"].includes(plan)) {
      const pdfBuffer = await generatePdf(stamp);
      const pdfResult = await storagePut(`orders/${existingOrder.id}/stamp.pdf`, pdfBuffer, "application/pdf");
      downloadUrls.push({ format: "pdf", key: pdfResult.key });
    }
    if (plan === "vip") {
      const docxBuffer = await generateDocx(stamp);
      const docxResult = await storagePut(`orders/${existingOrder.id}/stamp.docx`, docxBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      downloadUrls.push({ format: "docx", key: docxResult.key });
    }
    await db.update(orders).set({
      status: "fulfilled",
      downloadUrls,
      stripePaymentIntentId: session.payment_intent ?? null
    }).where(eq7(orders.id, existingOrder.id));
    if (existingOrder.email) await sendFulfillmentEmail(existingOrder.email, existingOrder.id, plan);
    console.log(`[Webhook] Order ${existingOrder.id} fulfilled successfully`);
  } catch (err) {
    console.error("[Webhook] Fulfillment failed:", err);
    await db.update(orders).set({ status: "failed" }).where(eq7(orders.id, existingOrder.id));
  }
}
async function sendFulfillmentEmail(email, orderId, plan) {
  try {
    const { Resend: Resend2 } = await import("resend");
    const resend = new Resend2(process.env.RESEND_API_KEY);
    const downloadUrl = `${process.env.APP_BASE_URL || "https://www.stampelo.ch"}/download?orderId=${orderId}`;
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Stampelo <noreply@stampelo.ch>",
      to: email,
      subject: "Your Stampelo stamp is ready for download!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a3a6b;">Your stamp is ready!</h2>
          <p>Thank you for your purchase. Your <strong>${plan.toUpperCase()}</strong> stamp package is ready to download.</p>
          <a href="${downloadUrl}" style="display: inline-block; background: #1a3a6b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 16px 0;">
            Download Your Stamp
          </a>
          <p style="color: #666; font-size: 12px;">This link is valid for 7 days. Order ID: ${orderId}</p>
          <p style="color: #666; font-size: 12px;">Questions? Contact <a href="mailto:support@stampelo.ch">support@stampelo.ch</a></p>
        </div>
      `
    });
  } catch (err) {
    console.error("[Email] Failed to send fulfillment email:", err);
  }
}

// server/downloadHandler.ts
async function handleDownload(req, res) {
  const key = req.params["key"];
  if (!key) {
    return res.status(400).json({ error: "Missing key" });
  }
  try {
    const { url } = await storageGet(key);
    res.redirect(302, url);
  } catch (err) {
    console.error("[Download] Failed to get download URL:", err);
    res.status(404).json({ error: "File not found or link expired" });
  }
}

// api/server.ts
var app = express();
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/api/auth/*", authMiddleware);
app.get("/api/download/:key(*)", handleDownload);
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});
var server_default = app;
export {
  server_default as default
};
