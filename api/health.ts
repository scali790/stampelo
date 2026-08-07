// Diagnostic: test express + tRPC + appRouter import
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
const app = express();
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", step: "trpc+router", ts: Date.now() });
});
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
export default app;
