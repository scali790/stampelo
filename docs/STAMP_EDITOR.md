# Stamp Editor

## Overview

The stamp editor is a client-side SVG canvas editor built with React 19, Zustand (state), and a custom SVG renderer (`client/src/editor/svgUtils.ts`). All rendering is pure SVG — no canvas API, no rasterisation in the editor.

## Shapes

| Shape | Default size |
|---|---|
| Round | 38 mm diameter |
| Oval | 50 × 30 mm |
| Rectangular | 55 × 25 mm |
| Triangular | 38 mm |

Size is configurable from 10 mm to 150 mm via the toolbar. Width and height inputs are guarded against NaN — the store is only updated when the value is a valid number in [10, 150].

## Element Types

| Type | Description |
|---|---|
| `frame` | Ring/border — configurable radius (% of maxR), stroke width, line break (gap angle), color |
| `text-on-path` | Text along a circular arc — radius, start angle, letter spacing, font, size, bold, italic, align, inverse |
| `center-text` | Free-positioned text — x/y position (% of canvas), font, size, bold, italic |
| `image` | SVG icon or custom SVG — x/y position (% of canvas), scale, color |

## Layers Panel

Elements are rendered in array order (first = bottom layer). The Layers panel shows elements in reverse order (top first). Users can reorder, toggle visibility, duplicate, and delete elements.

## Effects

| Effect | Description |
|---|---|
| Shabby / Aged | SVG `feTurbulence` filter — simulates worn/aged ink |
| Gold Metallic | Linear gradient replacing the stamp color |
| Silver Metallic | Linear gradient replacing the stamp color |

## Save and Share

Designs are saved to the `designs` table via `design.save`. Each design gets a unique `shareToken` for shareable URLs (`/editor?share=TOKEN`).

---

## SVG Renderer (`client/src/editor/svgUtils.ts`)

`renderStampSvg(stamp, opts?)` produces a self-contained SVG string:

- Internal canvas is always **250 × 250 units** with the stamp centered at (125, 125)
- `maxR = (widthMm / 150) × 125 × 0.95` — the plate radius in SVG units

### Clip group separation

Elements are split into two render groups:

| Group | Elements | Reason |
|---|---|---|
| Inside `clip-path` | `frame`, `center-text`, `image` | Need clipping to stamp shape boundary |
| Outside `clip-path` | `text-on-path` | Must not be clipped — glyphs near the plate edge would be truncated |

`textPath` `<path>` definitions are hoisted to the top-level `<defs>` section (never inside the clip group).

### Arc-length auto-fit (`fitArcText`)

Every `text-on-path` element is auto-fitted before rendering to ensure the complete text string is visible:

```
availableArc = π × arcRadius × 0.78   (78% of top semicircle)
requiredArc  = numChars × fontSize × 0.58 + letterSpacingExtra
```

Fit strategy (in order):
1. Try requested `fontSize` + `letterSpacing`
2. Reduce `letterSpacing` down to 70 (30% compression) while keeping `fontSize`
3. Reduce `fontSize` (keeping `letterSpacing = 70`), minimum `fontSize = 6`

This guarantees the final glyph is never clipped or wrapped to the bottom arc.

**Verification (38mm round stamp, arcR = 20.28 SVG units):**

| Text | Fitted fontSize | Fitted letterSpacing | Fits arc |
|---|---|---|---|
| YOUR COMPANY NAME | 6 | 70 | Yes |
| YOUR COMPANY NAME • CITY | 6 | 70 | Yes |
| APPROVED | 10 | 100 | Yes |
| RECEIVED | 10 | 100 | Yes |

### Geometry helpers

| Function | Purpose |
|---|---|
| `getStampSafeGeometry(widthMm)` | Returns `maxR`, `safeInnerR` (frame inner edge minus 2.5 SVG units safety margin) |
| `fitArcTextRadius(fontSize, safeInnerR, maxR)` | Returns safe baseline radius for text-on-path (glyph top guaranteed ≤ safeInnerR) |
| `fitCenterTextFontSize(text, safeInnerR, maxFontSize)` | Returns max safe font size for center text using Arial Bold char width ratio (0.58) |

These helpers are used in `createDefaultStamp()` and are available for template generation and future user text auto-fit.

---

## Editor Viewport (`client/src/editor/StampCanvas.tsx`)

### Architecture

The editor workspace has two layers:

1. **Workspace background** — full-area muted blue-grey with a measurement grid (minor lines every 5 SVG units, major lines every 25 SVG units)
2. **EditorStage** — a bounded box (max 600 × 600 CSS px) containing the stamp SVG with a drop shadow

The stamp SVG is rendered with a **cropped viewBox** matching the plate bounds, not the full 250-unit canvas. This ensures the stamp fills the stage at the correct visual size.

### Auto-fit zoom

```
stageW = min(availW, 600px)
stageH = min(availH, 600px)
fitScale = min(stageW / plateW, stageH / plateH) × 0.75
displayW = plateW × fitScale
displayH = plateH × fitScale
```

Hard safety conditions prevent overflow: `displayW ≤ stageW × 0.9`, `displayH ≤ stageH × 0.9`.

**Zoom model:** 100% = Fit (stamp fills ~75% of stage). Manual zoom steps: 25% increments, range 25%–400%.

### Default stamp geometry (38mm round)

| Element | Value | Rationale |
|---|---|---|
| Text-on-path radius | 67% of maxR | Glyph top (23.08) safely below safeInnerR (24.58) |
| Text-on-path fontSize | 10 | Fits within safe arc; auto-fit reduces if text is long |
| Center text fontSize | 13 | Auto-fit for "STAMP" (width 37.7 vs inner diameter 49.2) |

### Physical size label

Displayed below the stamp: `38 mm` for round/triangular, `50 × 25 mm` for oval/rectangular.

### Grid and zoom controls

The grid is an editor-only SVG overlay and is **never included in exports**. Zoom controls (−, %, +, ⊞) appear in the bottom-right corner of the stage.

---

## Image / Icon Element

The **Image** toolbar button opens the `IconPickerDrawer` (292 icons across 19 categories) and a custom SVG upload (max 50 KB, client-side script sanitisation). Icons are stored in the `icons` table and served via `trpc.icon.list`.

---

## Export

The editor viewport (zoom, grid, stage) is **never included in exports**. `renderStampSvg()` is called identically for editor display and all export formats. Physical dimensions are determined solely by `stamp.widthMm` / `stamp.heightMm` and the export DPI (300 DPI for PNG).
