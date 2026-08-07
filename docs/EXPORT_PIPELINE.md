# Export Pipeline

## Overview

Exports are generated **server-side** after Stripe webhook confirmation. The export service is in `server/exportService.ts`.

## Format Details

### PNG
- Implementation: `sharp` (native Node.js image processing)
- Resolution: 600 DPI (300 DPI for DOCX embedding)
- Dimensions: `widthMm * 600 / 25.4` pixels (e.g., 38 mm = ~898 px)
- Transparency: Yes (RGBA PNG)

### SVG
- Implementation: `renderStampSvg()` from `client/src/editor/svgUtils.ts`
- Vector: Yes — fully scalable
- Transparency: Yes

### EPS
- Implementation: Custom PostScript generator in `exportService.ts`
- Dimensions: `widthMm * 72 / 25.4` points
- Note: EPS embeds the SVG as base64 data within a PostScript wrapper

### PDF
- Implementation: `pdf-lib` — embeds a 300 DPI PNG into a PDF page
- Page size: `widthMm * 72 / 25.4` pt + 40 pt margin
- Vector: No (raster PNG embedded in PDF)

### DOCX
- Implementation: `docx` npm package — embeds a 150 DPI PNG as an inline image
- Dimensions: `widthMm / 10` cm

## Entitlement Matrix

| Plan | PNG | SVG | PDF | DOCX | EPS |
|---|---|---|---|---|---|
| PROMO (CHF 2.50) | Yes | No | No | No | No |
| ECONOM (CHF 3.50) | Yes | Yes | No | No | No |
| PREMIUM (CHF 4.50) | Yes | Yes | Yes | No | No |
| VIP WORD (CHF 5.50) | Yes | Yes | Yes | Yes | No |

**EPS is not a customer-facing export.** `generateEps()` exists in `server/exportService.ts` but is not called by the webhook fulfillment handler and is not included in any plan. EPS is an internal capability only. See `docs/OPEN_ITEMS.md` for the decision on whether to expose it.

## Sharp Packaging

`sharp` is a native Node.js addon and cannot be bundled with esbuild. The build script copies the `sharp` JS wrapper and the `@img/sharp-linux-x64` native binary into the Vercel function directory at build time.

## Storage

Generated files are stored in Vercel Blob at `orders/{orderId}/stamp.{ext}`. URLs are stored in `orders.downloadUrls`.

## Download URL Security

**Current state: Vercel Blob objects are stored with `access: "public"`.** Download URLs are permanent, unguessable (random suffix), but **not access-controlled**. Any party in possession of a URL can download the file without authentication.

The `order.getByOrderId` tRPC procedure is a `publicProcedure` — it does not require authentication. This means the download page is accessible to anyone with the order ID.

This is a known security gap. See `docs/SECURITY.md` and `docs/OPEN_ITEMS.md` for the remediation plan.
