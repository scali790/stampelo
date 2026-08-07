// Diagnostic: test express import
import express from "express";
const app = express();
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", step: "express", ts: Date.now() });
});
export default app;
