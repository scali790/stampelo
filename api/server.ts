/**
 * Vercel Serverless Function entry point.
 * Wraps the Express/tRPC server for Vercel's serverless runtime.
 * All /api/* requests are routed here by vercel.json rewrites.
 *
 * Vercel expects a default export that is a Node.js http.RequestListener
 * (i.e. (req, res) => void). Express apps satisfy this interface directly.
 */
import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";

const app = express();

// ── Permanent health endpoint (no dependencies) ───────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", ts: Date.now(), env: {
    DATABASE_URL: !!process.env.DATABASE_URL,
    AUTH_SECRET: !!process.env.AUTH_SECRET,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    RESEND_API_KEY: !!process.env.RESEND_API_KEY,
  }});
});

// ── Load all subsystems and surface errors ────────────────────────────────────
let initError: string | null = null;

async function initApp() {
  try {
    const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
    const { appRouter } = await import("../server/routers");
    const { createContext } = await import("../server/_core/context");
    const { handleStripeWebhook } = await import("../server/webhookHandler");
    const { handleDownload } = await import("../server/downloadHandler");
    const { authMiddleware } = await import("../server/auth");

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

  } catch (err: any) {
    initError = err?.message + "\n" + err?.stack;
    console.error("[stampelo] Init error:", err);
    // Register error handler for all routes
    app.use("/api/*", (_req: Request, res: Response) => {
      res.status(500).json({ error: "Server initialization failed", detail: initError?.substring(0, 500) });
    });
  }
}

initApp();

// Express app is a valid Node.js http.RequestListener — export directly for Vercel
export default app;
