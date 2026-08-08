# PDF Editor

## Overview

The PDF Editor allows users to upload a PDF document, visually position a stamp on any page, and download the server-merged result. Accessible at `/pdf-editor`.

If no stamp is present in the editor store (new user or direct URL visit), a **no-stamp gate** is shown with CTAs to the Stamp Editor and Templates page.

---

## Client-side Flow

1. User uploads a PDF via the file input
2. PDF is rendered client-side using `pdfjs-dist` (scale 1.5) for visual preview
3. PDF is simultaneously uploaded to the server (`pdfEditor.uploadPdf`) and stored in Vercel Blob
4. The server returns `{ key, url }` — both the storage key and the full public Blob URL are stored in client state
5. User drags the stamp overlay to position it; scale and rotation are adjustable via sliders
6. User clicks **Export Stamped PDF** → `pdfEditor.stampPdf` mutation is called with `pdfUrl` (the full Blob URL from step 4)
7. Server merges stamp onto the PDF and returns a download URL
8. Browser opens the download URL in a new tab

---

## Stamp Overlay Display

The stamp overlay is rendered using `resizeStampSvg(stamp, sizePx)` which:
- Calls `renderStampSvg(stamp)` to get the full 250-unit SVG
- Replaces the `viewBox` with the cropped plate bounds (same logic as `StampCanvas`)
- Sets `width` and `height` to `sizePx`

The display size is proportional to the rendered page width:
```
stampDisplayPx = (stamp.widthMm / 150) × 200 × placement.scale
```

The stamp overlay is draggable (mouse events on the container div). Position is stored as `x/y` percentage of page width/height.

---

## Server-side Merge (`server/routers/pdfEditor.ts`)

### `pdfEditor.uploadPdf`

- Input: `{ pdfBase64: string, filename?: string }`
- Validates: max 20 MB
- Stores PDF in Vercel Blob at `pdf-uploads/{nanoid()}.pdf`
- Returns: `{ key: string, url: string }` — `url` is the full public Blob URL

### `pdfEditor.stampPdf`

- Input: `{ pdfKey, pdfUrl?, stampSvg, placement, pageIndices }`
- `pdfUrl` (optional) — full Blob URL from upload response. When provided, used directly to fetch the PDF, bypassing `storageGet()`. This avoids the URL reconstruction bug (see below).
- Fetches the original PDF from `pdfUrl` (or falls back to `storageGet(pdfKey).url`)
- Calls `mergePdfStamp()` in `server/pdfStampService.ts`
- Stores merged PDF in Vercel Blob at `pdf-stamped/{nanoid()}.pdf`
- Returns: `{ downloadUrl: string, outputKey: string }`

### `server/pdfStampService.ts`

1. Rasterises the stamp SVG to PNG at 300 DPI using `sharp`
   - Physical stamp size: `stampWidthMm × (300/25.4)` pixels
   - Scaled by `placement.scale`
2. Embeds the PNG onto the specified pages using `pdf-lib`
   - Position: `xPct/yPct` of page dimensions, centered on the stamp
   - Rotation applied via `pdf-lib` transform
3. Returns the merged PDF as a `Buffer`

---

## Storage URL Fix (`server/storage.ts`) — Fixed 2026-08-08

**Problem:** `storageGet()` was reconstructing the Vercel Blob URL as `${BLOB_BASE_URL}/${relKey}`. `BLOB_BASE_URL` is not set in Vercel env, so the result was a relative path — not a valid URL for `fetch()`. This caused all `stampPdf` calls to fail with HTTP 500 "Failed to parse URL from pdf-uploads/...".

**Fix:** `storageGet()` now calls `blob head(relKey)` to retrieve the actual public URL from Vercel Blob. Additionally, `uploadPdf` returns the full URL directly from `storagePut()`, and `stampPdf` uses it without calling `storageGet()`.

---

## Page Navigation

Multi-page PDFs are supported. Page navigation (Previous / Next) re-renders the pdfjs canvas. The "Apply to pages" selector supports All pages or individual page selection.

---

## Limitations

| Limitation | Detail |
|---|---|
| Upload size | 20 MB client-side limit; Vercel serverless body limit is 4.5 MB by default — large PDFs may fail at the server upload step |
| Stamp rasterisation | `sharp` native binary must be available in the Vercel function runtime |
| No authentication | `uploadPdf` and `stampPdf` are `publicProcedure` — any user can upload and stamp PDFs without authentication |
| No cleanup | Uploaded and merged PDFs are not automatically deleted from Vercel Blob |
| Position accuracy | Stamp position is stored as percentage of page dimensions. The visual overlay uses the pdfjs-rendered canvas (scale 1.5); the server merge uses `pdf-lib` page dimensions. These may differ slightly for non-standard page sizes. |
