/**
 * Storage helpers — Vercel Blob (production) or local filesystem (development).
 * Replaces Manus storage proxy entirely.
 */
import { put, del, head } from "@vercel/blob";
import { createHash } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".local-storage");

/**
 * Upload a buffer to storage.
 * Returns { key, url } where url is publicly accessible.
 */
export async function storagePut(
  relKey: string,
  data: Buffer,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (IS_VERCEL) {
    const blob = await put(relKey, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return { key: relKey, url: blob.url };
  }
  // Local dev fallback
  const localPath = path.join(LOCAL_STORAGE_DIR, relKey);
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, data);
  const url = `/local-storage/${relKey}`;
  return { key: relKey, url };
}

/**
 * Generate a presigned/direct URL for a stored object.
 * For Vercel Blob, objects are public so the URL is returned directly.
 */
export async function storageGet(
  relKey: string,
  _expiresIn = 3600
): Promise<{ key: string; url: string }> {
  if (IS_VERCEL) {
    // Vercel Blob URLs are public; reconstruct from base URL
    const baseUrl = process.env.BLOB_BASE_URL || "";
    const url = baseUrl ? `${baseUrl}/${relKey}` : relKey;
    return { key: relKey, url };
  }
  return { key: relKey, url: `/local-storage/${relKey}` };
}

/**
 * Delete a stored object.
 */
export async function storageDelete(url: string): Promise<void> {
  if (IS_VERCEL) {
    await del(url);
  } else {
    const relKey = url.replace("/local-storage/", "");
    const localPath = path.join(LOCAL_STORAGE_DIR, relKey);
    await fs.unlink(localPath).catch(() => {});
  }
}

/**
 * Generate a deterministic key for an export file.
 */
export function exportKey(orderId: number, format: string): string {
  return `exports/${orderId}/${format}.${format === "docx" ? "docx" : format}`;
}
