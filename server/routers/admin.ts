import { z } from "zod";
import { router } from "../_core/trpc";
import { protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { orders, designs, templates, users } from "../../drizzle/schema";
import { eq, desc, like, and, or } from "drizzle-orm";

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ── Dashboard stats ──────────────────────────────────────────────────────────
  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const [orderRows, designRows, userRows, templateRows] = await Promise.all([
      db.select().from(orders),
      db.select().from(designs),
      db.select().from(users),
      db.select().from(templates),
    ]);
    const totalRevenue = orderRows
      .filter((o) => o.status === "fulfilled" || o.status === "paid")
      .reduce((sum, o) => sum + o.amountCents, 0);
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
      activeTemplates: templateRows.filter((t) => t.isActive).length,
    };
  }),

  // ── Orders ───────────────────────────────────────────────────────────────────
  listOrders: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "paid", "fulfilled", "failed"]).optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(input.limit).offset(input.offset);
      return input.status ? rows.filter((r) => r.status === input.status) : rows;
    }),

  retryFulfillment: adminProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(orders).set({ status: "paid" }).where(eq(orders.id, input.orderId));
      return { queued: true };
    }),

  // ── Customers ────────────────────────────────────────────────────────────────
  listCustomers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(input.limit);
      if (input.search) {
        const q = input.search.toLowerCase();
        return rows.filter((r) => (r.name ?? "").toLowerCase().includes(q) || (r.email ?? "").toLowerCase().includes(q));
      }
      return rows;
    }),

  // ── Designs ──────────────────────────────────────────────────────────────────
  listDesigns: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(designs).orderBy(desc(designs.createdAt)).limit(input.limit);
    }),

  // ── Templates ────────────────────────────────────────────────────────────────
  listTemplates: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(templates).orderBy(desc(templates.createdAt)).limit(input.limit);
    }),

  toggleTemplate: adminProcedure
    .input(z.object({ id: z.number().int().positive(), active: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(templates).set({ isActive: input.active }).where(eq(templates.id, input.id));
      return { updated: true };
    }),

  deleteTemplate: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(templates).set({ isActive: false }).where(eq(templates.id, input.id));
      return { deleted: true };
    }),

  createTemplate: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.string().min(1),
      stateJson: z.any(),
      thumbnailSvg: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(templates).values({
        name: input.name,
        category: input.category,
        stateJson: input.stateJson,
        thumbnailSvg: input.thumbnailSvg ?? null,
        isActive: true,
      });
      return { created: true };
    }),
});
