/**
 * Vercel Serverless Function entry point.
 * Source of truth: this file. Generated bundle: .vercel/output/functions/api/server.func/index.js
 * Build: scripts/build-vercel.sh (esbuild bundles all static imports at build time)
 *
 * IMPORTANT: All project-internal imports MUST be static (not dynamic) so esbuild
 * resolves and inlines them into the bundle. Dynamic import() is only for truly
 * external packages (sharp, pdf-lib, docx) that must be deferred to call time.
 */
import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { handleStripeWebhook } from "../server/webhookHandler";
import { handleDownload } from "../server/downloadHandler";
import { authMiddleware } from "../server/auth";

const app = express();

// ── Permanent health endpoint (no subsystem dependencies) ─────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    ts: Date.now(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      AUTH_SECRET: !!process.env.AUTH_SECRET,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
    },
  });
});

// ── Stripe webhook — raw body BEFORE json parser ──────────────────────────────
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ── Auth.js routes: /api/auth/* ───────────────────────────────────────────────
app.use("/api/auth/*", authMiddleware);

// ── File download endpoint ────────────────────────────────────────────────────
app.get("/api/download/:key(*)", handleDownload);

// ── tRPC API ──────────────────────────────────────────────────────────────────
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// ── Fallback 404 for unmatched /api/* routes ──────────────────────────────────
app.use("/api/*", (_req: Request, res: Response) => {
  res.status(404).json({ error: "API route not found" });
});

// Express app is a valid Node.js http.RequestListener — export directly for Vercel
export default app;
