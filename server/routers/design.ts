import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { designs, orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import Stripe from "stripe";
import { ENV } from "../_core/env";

export const designRouter = router({
  save: publicProcedure
    .input(z.object({
      stateJson: z.any(),
      name: z.string().optional(),
      thumbnailDataUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const shareToken = nanoid(10);
      const userId = ctx.user?.id ?? null;
      await db.insert(designs).values({
        shareToken,
        userId,
        stateJson: input.stateJson,
        name: input.name ?? "Untitled Stamp",
        thumbnailDataUrl: input.thumbnailDataUrl ?? null,
      });
      return { shareToken };
    }),

  load: publicProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const result = await db.select().from(designs).where(eq(designs.shareToken, input.shareToken)).limit(1);
      if (!result[0]) throw new Error("Design not found");
      return result[0];
    }),

  sendEmail: publicProcedure
    .input(z.object({ email: z.string().email(), shareUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      // Email sending via Resend — implemented in Phase 5
      console.log(`[Design] Send email to ${input.email}: ${input.shareUrl}`);
      return { sent: true };
    }),

  myDesigns: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db.select().from(designs).where(eq(designs.userId, ctx.user.id));
    }),
});

