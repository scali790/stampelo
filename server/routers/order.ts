import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { designs, orders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// Prices in CHF cents (CHF is the Swiss Franc, ISO 4217: CHF)
// Stripe supports CHF natively for Swiss merchants.
const PLAN_PRICES_CHF: Record<string, number> = {
  promo: 250,    // CHF 2.50
  econom: 350,   // CHF 3.50
  premium: 450,  // CHF 4.50
  vip: 550,      // CHF 5.50
};

// Human-readable plan descriptions for Stripe checkout
const PLAN_DESCRIPTIONS: Record<string, string> = {
  promo:   "PNG download (high-res, transparent background)",
  econom:  "PNG + SVG vector download",
  premium: "PNG + SVG + PDF download",
  vip:     "PNG + SVG + PDF + DOCX download",
};

export const orderRouter = router({
  createCheckout: publicProcedure
    .input(z.object({
      plan: z.enum(["promo", "econom", "premium", "vip"]),
      email: z.string().email(),
      stateJson: z.any(),
      amountCents: z.number().int().positive(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Save design first
      const shareToken = nanoid(10);
      await db.insert(designs).values({
        shareToken,
        userId: ctx.user?.id ?? null,
        stateJson: input.stateJson,
        name: "Stamp Order",
      });
      const [design] = await db.select().from(designs).where(eq(designs.shareToken, shareToken)).limit(1);
      if (!design) throw new Error("Failed to save design");

      // Create Stripe checkout session
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      const origin = ctx.req.headers.origin || "https://www.stampelo.com";
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: input.email,
        allow_promotion_codes: true,
        line_items: [{
          price_data: {
            currency: "chf",
            product_data: {
              name: `Stampelo — ${input.plan.toUpperCase()} Plan`,
              description: PLAN_DESCRIPTIONS[input.plan] ?? `Custom stamp download (${input.plan})`,
            },
            unit_amount: PLAN_PRICES_CHF[input.plan],
          },
          quantity: 1,
        }],
        metadata: {
          design_id: String(design.id),
          plan: input.plan,
          email: input.email,
          user_id: ctx.user?.id ? String(ctx.user.id) : "",
        },
        client_reference_id: ctx.user?.id ? String(ctx.user.id) : `guest-${shareToken}`,
        success_url: `${origin}/download?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/editor`,
      });

      // Create pending order
      await db.insert(orders).values({
        stripeSessionId: session.id,
        designId: design.id,
        userId: ctx.user?.id ?? null,
        email: input.email,
        plan: input.plan,
        status: "pending",
        amountCents: PLAN_PRICES_CHF[input.plan]!,
      });

      return { checkoutUrl: session.url! };
    }),

  getBySession: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [order] = await db.select().from(orders).where(eq(orders.stripeSessionId, input.sessionId)).limit(1);
      return order ?? null;
    }),

  getByOrderId: publicProcedure
    .input(z.object({ orderId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      return order ?? null;
    }),

  myOrders: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      return db.select().from(orders).where(eq(orders.userId, ctx.user.id));
    }),
});
