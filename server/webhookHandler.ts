import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { orders, designs } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { generatePng, generateSvg, generatePdf, generateDocx, generateEps } from "./exportService";
import type { Stamp } from "../client/src/editor/types";
import { storagePut } from "./storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).send("Webhook signature verification failed");
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Event: ${event.type} (${event.id})`);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillOrder(session);
  }

  res.json({ received: true });
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  // Idempotency: check if already fulfilled
  const [existingOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.stripeSessionId, session.id))
    .limit(1);

  if (!existingOrder) {
    console.error("[Webhook] Order not found for session:", session.id);
    return;
  }

  if (existingOrder.status === "fulfilled") {
    console.log("[Webhook] Order already fulfilled, skipping:", existingOrder.id);
    return;
  }

  // Mark as paid
  await db.update(orders).set({ status: "paid" }).where(eq(orders.id, existingOrder.id));

  try {
    // Load design state
    const [design] = await db.select().from(designs).where(eq(designs.id, existingOrder.designId)).limit(1);
    if (!design || !design.stateJson) {
      throw new Error("Design not found");
    }

    const state = design.stateJson as { stamps: Stamp[]; activeStampId: string };
    const stamp = state.stamps.find((s) => s.id === state.activeStampId) ?? state.stamps[0];
    if (!stamp) throw new Error("Stamp not found in design state");

    const plan = existingOrder.plan;
    const downloadLinks: Array<{ format: string; key: string }> = [];

    // Always generate PNG
    const pngBuffer = await generatePng(stamp, 600);
    const pngResult = await storagePut(`orders/${existingOrder.id}/stamp.png`, pngBuffer, "image/png");
    downloadLinks.push({ format: "png", key: pngResult.key });

    // SVG for econom+
    if (["econom", "premium", "vip"].includes(plan)) {
      const svgString = generateSvg(stamp);
      const svgResult = await storagePut(`orders/${existingOrder.id}/stamp.svg`, Buffer.from(svgString), "image/svg+xml");
      downloadLinks.push({ format: "svg", key: svgResult.key });
    }

    // PDF for premium+
    if (["premium", "vip"].includes(plan)) {
      const pdfBuffer = await generatePdf(stamp);
      const pdfResult = await storagePut(`orders/${existingOrder.id}/stamp.pdf`, pdfBuffer, "application/pdf");
      downloadLinks.push({ format: "pdf", key: pdfResult.key });
    }

    // DOCX for vip
    if (plan === "vip") {
      const docxBuffer = await generateDocx(stamp);
      const docxResult = await storagePut(`orders/${existingOrder.id}/stamp.docx`, docxBuffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      downloadLinks.push({ format: "docx", key: docxResult.key });
    }

    // Update order with download links and mark fulfilled
    await db.update(orders).set({
      status: "fulfilled",
      downloadLinks,
      stripePaymentIntentId: session.payment_intent as string,
    }).where(eq(orders.id, existingOrder.id));

    // Send email with download link
    await sendFulfillmentEmail(existingOrder.email, existingOrder.id, plan);

    console.log(`[Webhook] Order ${existingOrder.id} fulfilled successfully`);
  } catch (err) {
    console.error("[Webhook] Fulfillment failed:", err);
    await db.update(orders).set({ status: "failed" }).where(eq(orders.id, existingOrder.id));
  }
}

async function sendFulfillmentEmail(email: string, orderId: number, plan: string) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const downloadUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace("/api", "") || "https://stampelo.com"}/download?orderId=${orderId}`;
    await resend.emails.send({
      from: "Stampelo <noreply@stampelo.com>",
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
          <p style="color: #666; font-size: 12px;">Questions? Contact support@stampelo.com</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[Email] Failed to send fulfillment email:", err);
  }
}

