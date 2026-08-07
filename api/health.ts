// Diagnostic: catch import errors and surface them in response
import express from "express";

const app = express();

// Health with no deps
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", step: "express-only", ts: Date.now() });
});

// Try importing tRPC router and catch any error
let routerError: string | null = null;
let routerLoaded = false;

async function tryLoadRouter() {
  try {
    const { appRouter } = await import("../server/routers");
    const { createContext } = await import("../server/_core/context");
    const { createExpressMiddleware } = await import("@trpc/server/adapters/express");
    app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
    routerLoaded = true;
  } catch (err: any) {
    routerError = err?.message + "\n" + err?.stack;
    console.error("[DIAG] Router load error:", err);
  }
}

// Load router and report status
tryLoadRouter().then(() => {
  app.get("/api/health/router", (_req, res) => {
    res.status(routerLoaded ? 200 : 500).json({
      routerLoaded,
      error: routerError,
      ts: Date.now()
    });
  });
});

export default app;
