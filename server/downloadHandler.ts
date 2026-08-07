import type { Request, Response } from "express";
import { storageGet } from "./storage";

export async function handleDownload(req: Request, res: Response) {
  const key = req.params["key"];
  if (!key) {
    return res.status(400).json({ error: "Missing key" });
  }

  try {
    const { url } = await storageGet(key);
    // Redirect to the presigned S3 URL
    res.redirect(302, url);
  } catch (err) {
    console.error("[Download] Failed to get download URL:", err);
    res.status(404).json({ error: "File not found or link expired" });
  }
}

