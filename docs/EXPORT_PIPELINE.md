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

| Plan | PNG | SVG | PDF | DOCX |
|---|---|---|---|---|
| PROMO (CHF 2.50) | Yes | No | No | No |
| ECONOM (CHF 3.50) | Yes | Yes | No | No |
| PREMIUM (CHF 4.50) | Yes | Yes | Yes | No |
| VIP WORD (CHF 5.50) | Yes | Yes | Yes | Yes |

## Sharp Packaging

`sharp` is a native Node.js addon and cannot be bundled with esbuild. The build script copies the `sharp` JS wrapper and the `@img/sharp-linux-x64` native binary into the Vercel function directory at build time.

## Storage

Generated files are stored in Vercel Blob at `orders/{orderId}/stamp.{ext}`. URLs are stored in `orders.downloadUrls`.
