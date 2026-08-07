// Diagnostic: test each router import individually
import express from "express";

const app = express();

app.get("/api/health", (_req: any, res: any) => {
  res.status(200).json({ status: "ok", ts: Date.now() });
});

// Test each router import individually
const results: Record<string, string> = {};

async function testImports() {
  const tests = [
    ["trpc", () => import("../server/_core/trpc")],
    ["db", () => import("../server/db")],
    ["auth", () => import("../server/auth")],
    ["context", () => import("../server/_core/context")],
    ["systemRouter", () => import("../server/_core/systemRouter")],
    ["designRouter", () => import("../server/routers/design")],
    ["orderRouter", () => import("../server/routers/order")],
    ["templateRouter", () => import("../server/routers/template")],
    ["pdfEditorRouter", () => import("../server/routers/pdfEditor")],
    ["adminRouter", () => import("../server/routers/admin")],
    ["webhookHandler", () => import("../server/webhookHandler")],
    ["exportService", () => import("../server/exportService")],
    ["storage", () => import("../server/storage")],
  ] as const;

  for (const [name, loader] of tests) {
    try {
      await loader();
      results[name] = "ok";
    } catch (err: any) {
      results[name] = `ERROR: ${err?.message?.substring(0, 200)}`;
    }
  }
}

testImports().then(() => {
  app.get("/api/health/imports", (_req: any, res: any) => {
    const failed = Object.entries(results).filter(([, v]) => v !== "ok");
    res.status(failed.length > 0 ? 500 : 200).json({ results, ts: Date.now() });
  });
});

export default app;
