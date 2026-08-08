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

### Interaction Handles

The stamp overlay uses standard design-tool handles (commit `1b4ac9a`):

| Handle | Count | Appearance | Action |
|---|---|---|---|
| Corner resize | 4 (NW, NE, SE, SW) | White square, blue border | Drag to scale uniformly |
| Edge resize | 4 (N, S, E, W) | White square, blue border | Drag to scale uniformly |
| Rotation | 1 (below stamp) | White circle with RotateCw icon | Drag to rotate around center |
| Move | (stamp body) | Grab cursor | Drag to reposition |

A dashed blue selection border (1.5px, `#3b82f6`) surrounds the stamp. Handles sit on the border corners and edges.

**Resize math:**
```
delta = mouse displacement in the handle's primary direction
newSizePx = max(30, currentSizePx + delta × 1.5)
newScale = newSizePx / ((widthMm / 150) × 200)
scale clamped to [0.1, 5]
```

**Rotation math:**
```
angle = atan2(mouseY - stampCenterY, mouseX - stampCenterX) × (180/π) + 90
rotation = ((angle % 360) + 360) % 360
```

The left panel Scale and Rotation sliders stay in sync with all handle interactions.

Position is stored as `x/y` percentage of page width/height.

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
   - Stamp size: `(stampSizePct / 100) × pageWidthPt` (PDF points), matching editor display
   - Rasterised at 300 DPI for quality: `stampPx = (stampWidthPt / 72) × 300`
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
| Stamp rasterisation | `sharp` native binary required. All `@img/*` packages and `detect-libc` are copied into the Vercel function by the build script (commit `fc69a75`). |
| No authentication | `uploadPdf` and `stampPdf` are `publicProcedure` — any user can upload and stamp PDFs without authentication |
| No cleanup | Uploaded and merged PDFs are not automatically deleted from Vercel Blob |
| PNG rasterisation | Uses `@resvg/resvg-wasm` (pure WebAssembly, no native binaries). Sharp was removed in commit `52159be` due to cold-start crashes from missing native deps (`@img/colour`, `semver`, `detect-libc`). |
| Position accuracy | Stamp position is stored as percentage of page dimensions. The visual overlay uses the pdfjs-rendered canvas (scale 1.5); the server merge uses `pdf-lib` page dimensions. These may differ slightly for non-standard page sizes. |

## Build History / Known Issues

### 2026-08-08: Sharp replaced with @resvg/resvg-wasm

Sharp was the original PNG rasteriser for both `exportService.ts` and `pdfStampService.ts`. It was removed because:

1. Sharp's ESM entry (`dist/sharp.mjs`) declares `import { createRequire } from "node:module"` at module scope.
2. The esbuild `--banner:js` injection also declared `createRequire`, causing `SyntaxError: Identifier 'createRequire' has already been declared` on every cold start.
3. Even after externalising Sharp, its transitive deps (`@img/colour`, `@img/sharp-linux-x64`, `semver`, `detect-libc`) were not available in the Vercel function directory.

`@resvg/resvg-wasm` is a pure WebAssembly SVG rasteriser with no native binary dependencies. The WASM binary is copied once to the function directory by `scripts/build-vercel.sh`.

### 2026-08-08: stampSizePct replaces scale in placement

The original `placement.scale` multiplied the physical DPI stamp size, causing a 2.7× size mismatch between the editor preview and the exported PDF. Replaced with `stampSizePct` (stamp display width as % of canvas width), which the server uses directly as a fraction of the PDF page width.
