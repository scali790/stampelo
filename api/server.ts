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
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { handleStripeWebhook } from "../server/webhookHandler";
import { handleDownload } from "../server/downloadHandler";
import { authMiddleware } from "../server/auth";

const app = express();

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
