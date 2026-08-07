// Diagnostic: test each import with separate endpoints
import express from "express";

const app = express();
app.get("/api/health", (_req: any, res: any) => {
  res.status(200).json({ status: "ok", ts: Date.now() });
});

// Test 1: trpc only
import("../server/_core/trpc").then(() => {
  app.get("/api/health/1-trpc", (_req: any, res: any) => res.json({ ok: true }));
}).catch((e: any) => {
  app.get("/api/health/1-trpc", (_req: any, res: any) => res.status(500).json({ error: e.message, stack: e.stack?.substring(0,500) }));
});

// Test 2: db
import("../server/db").then(() => {
  app.get("/api/health/2-db", (_req: any, res: any) => res.json({ ok: true }));
}).catch((e: any) => {
  app.get("/api/health/2-db", (_req: any, res: any) => res.status(500).json({ error: e.message, stack: e.stack?.substring(0,500) }));
});

// Test 3: auth
import("../server/auth").then(() => {
  app.get("/api/health/3-auth", (_req: any, res: any) => res.json({ ok: true }));
}).catch((e: any) => {
  app.get("/api/health/3-auth", (_req: any, res: any) => res.status(500).json({ error: e.message, stack: e.stack?.substring(0,500) }));
});

// Test 4: webhookHandler
import("../server/webhookHandler").then(() => {
  app.get("/api/health/4-webhook", (_req: any, res: any) => res.json({ ok: true }));
}).catch((e: any) => {
  app.get("/api/health/4-webhook", (_req: any, res: any) => res.status(500).json({ error: e.message, stack: e.stack?.substring(0,500) }));
});

// Test 5: pdfEditor router
import("../server/routers/pdfEditor").then(() => {
  app.get("/api/health/5-pdfeditor", (_req: any, res: any) => res.json({ ok: true }));
}).catch((e: any) => {
  app.get("/api/health/5-pdfeditor", (_req: any, res: any) => res.status(500).json({ error: e.message, stack: e.stack?.substring(0,500) }));
});

// Test 6: full appRouter
import("../server/routers").then(() => {
  app.get("/api/health/6-router", (_req: any, res: any) => res.json({ ok: true }));
}).catch((e: any) => {
  app.get("/api/health/6-router", (_req: any, res: any) => res.status(500).json({ error: e.message, stack: e.stack?.substring(0,500) }));
});

export default app;
