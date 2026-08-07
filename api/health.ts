// Minimal health check - no dependencies, no imports
// Used to verify Vercel can start a serverless function at all
export default function handler(req: any, res: any) {
  res.status(200).json({ status: "ok", ts: Date.now() });
}
