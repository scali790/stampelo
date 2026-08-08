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

### Canonical Default Starter Stamp

> **This is the authoritative specification.** Any change to the first-load stamp must be reflected here first.

The editor shows a **canonical starter stamp** to every new user on first load (`/editor` with no prior session). It is the product's first impression and must look like a real, finished stamp — not a test artefact.

#### Purpose

The starter stamp serves two goals simultaneously:

1. **Trust signal** — a new user must immediately think *"this is what my stamp could look like"*, not *"this is broken"*.
2. **Feature showcase** — it demonstrates all three core editor capabilities: Frame, Text on Path (top + bottom arc), and Center Text.

#### Design rules (non-negotiable)

- No abridged or placeholder-feeling text (no bare `STAMP`, no `TEST`, no lorem ipsum)
- No text clipping, no frame collision, no oversized glyphs
- No effects active by default (`shabby=false`, `gold=false`, `silver=false`)
- All geometry computed via the safe-area helpers — never hardcoded pixel values
- Visually centred and balanced: top arc weight ≈ bottom arc weight

#### Canonical content

| # | Element type | Text | `inverse` | Role |
|---|---|---|---|---|
| 1 | `frame` | — | — | Outer border ring |
| 2 | `text-on-path` | `STAMPELO.COM` | `false` | Top arc — brand / demo context |
| 3 | `center-text` | `YOUR STAMP` | — | Centre — personalisation placeholder |
| 4 | `text-on-path` | `CREATE IN SECONDS` | `true` | Bottom arc — product promise |

Elements are stored in this exact order (index 0–3). The frame is always the bottom-most layer.

#### Canonical geometry (38 mm round)

All values are computed at runtime by `createDefaultStamp()` using the geometry helpers. The table below shows the expected computed values for a 38 mm round stamp.

| Property | Stored value | Computed / rendered value | Constraint |
|---|---|---|---|
| Shape | `round` | — | Fixed for starter stamp |
| `widthMm` / `heightMm` | `38` / `38` | — | Fixed |
| Frame `radius` | `95` (% of maxR) | 28.58 SVG units | Standard professional border |
| Frame `strokeWidth` | `3` | — | Clean, visible border |
| Frame `lineBreak` | `0` | — | Solid ring, no gap |
| Arc `radius` | `69` (% of maxR) | 20.76 SVG units | Glyph top 23.08 ≤ safeInnerR 24.58 ✓ |
| Arc `fontSize` | `8` pt | 8 pt (auto-fit may reduce `letterSpacing`) | Readable at stamp scale |
| Arc `letterSpacing` | `100` (stored) | Reduced to ≤ 78 by auto-fit for bottom arc | Never overflows arc |
| Arc `bold` | `true` | — | Legibility |
| Centre `fontSize` | `6` pt | `fitCenterTextFontSize("YOUR STAMP", 24.58, 14)` | Width 34.8 ≤ 40.3 available ✓ |
| Centre `x` / `y` | `50` / `50` | Canvas centre (125, 125) | Perfectly centred |
| Centre `bold` | `true` | — | Legibility |
| Colour (all elements) | `#1a3a6b` | — | Classic stamp blue |
| Effects | all `false` | — | Clean default |

#### First-load vs. returning-user behaviour

The store uses Zustand `persist` (localStorage key `stampelo-editor`):

| Scenario | Behaviour |
|---|---|
| **New user** (no localStorage key) | `initialState` in `store.ts` loads the canonical starter stamp |
| **Returning user** (key present) | Persisted stamps are rehydrated — no data loss, no override |
| **`resetEditor()` called** | Always resets to a fresh canonical starter stamp (new IDs) |
| **Template loaded** | `loadState()` replaces the current state — starter stamp is not involved |
| **Share link opened** | `loadState()` replaces the current state — starter stamp is not involved |

#### Implementation

The canonical stamp is produced by `createDefaultStamp("round")` in `client/src/editor/store.ts`. The function:

1. Calls `getStampSafeGeometry(38)` to derive `maxR` and `safeInnerR`
2. Calls `fitArcTextRadius(8, safeInnerR, maxR)` to get the arc radius percentage
3. Calls `fitCenterTextFontSize("YOUR STAMP", safeInnerR, 14)` to get the centre font size
4. Constructs the 4-element array in the order: `frame → topArc → centerText → bottomArc`

Do **not** hardcode SVG-unit values in `createDefaultStamp()`. Always derive them from the helpers so the geometry stays consistent if constants change.

#### Regression tests

All assertions live in `server/defaultStamp.test.ts` (17 tests). Run with `pnpm test`. Tests cover:
- Shape and size (`round`, 38 × 38 mm)
- Exact element count (4) and element order
- Canonical text strings for each layer
- Brand colour `#1a3a6b` on all elements
- All effects off by default
- Arc glyph top ≤ `safeInnerR` (no frame collision)
- Centre text width ≤ available safe width (no clipping)
- Auto-fit produces `fontSize ≥ 6` and the fitted text fits the arc
- Each `createDefaultStamp()` call returns a unique stamp ID

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
