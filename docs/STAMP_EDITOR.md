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

### Round text-path geometry (`getTextPathGeometry`)

Round `text-on-path` elements use an explicit semantic arc, not a full circle.

Coordinate convention:

- `0°` = `12 o'clock`
- `90°` = `3 o'clock`
- `180°` = `6 o'clock`
- `270°` = `9 o'clock`
- positive rotation = clockwise

For round/oval arc text, the renderer builds a single open semantic arc with a fixed sweep of `140°`:

| Arc role | Center angle when `startAngle = 0` | Path start | Path end | Sweep flag | Read order |
|---|---:|---:|---:|---:|---|
| Top (`inverse = false`) | `0°` | `290°` | `70°` | `1` | Left-to-right across the upper arc |
| Bottom (`inverse = true`) | `180°` | `250°` | `110°` | `0` | Left-to-right across the lower arc |

`startAngle` rotates the semantic arc center around the plate. It no longer means "where a full-circle path starts"; it means "rotate the top/bottom arc from its canonical center".

This model guarantees:

- top text is centered on `12 o'clock`
- bottom text is centered on `6 o'clock`
- both arcs stay on their intended half of the plate
- preview/export/editor all share the same path semantics

Oval stamps use the same semantic top/bottom model, but the renderer emits an **elliptical** `A rx,ry` path instead of forcing the arc onto a circle. This is critical for 45 × 30 mm oval templates because a circular fallback underestimates both the usable path length and the visual frame geometry.

### Arc-length auto-fit (`fitArcText`)

Every `text-on-path` element is auto-fitted against the usable portion of its semantic arc:

```
availableArc = pathLength × 0.88
requiredArc  = numChars × fontSize × 0.58 + letterSpacingExtra
```

Fit strategy:
1. Try requested `fontSize` + `letterSpacing`
2. Reduce `fontSize` while preserving the requested spacing
3. Reduce `letterSpacing` only if the minimum readable font size is still too long

Guard rails:
- minimum arc font size = `5`
- minimum arc letter spacing = `85`

This keeps whitespace near the arc endpoints while ensuring the string fits the actual rendered path.

### Geometry helpers

| Function | Purpose |
|---|---|
| `getStampSafeGeometry(widthMm)` | Returns `maxR`, `safeInnerR` (frame inner edge minus 2.5 SVG units safety margin) |
| `fitArcTextRadius(fontSize, safeInnerR, maxR)` | Returns safe baseline radius for text-on-path (glyph top guaranteed ≤ safeInnerR) |
| `fitCenterTextFontSize(text, safeInnerR, maxFontSize)` | Returns max safe font size for center text using Arial Bold char width ratio (0.58) |

These helpers are used in `createDefaultStamp()` and by the shared SVG renderer. Template previews and exports do not maintain a separate geometry implementation.

### Template normalization and repair

Seeded template states are not treated as trusted final geometry. Before preview, load, or audit, the shared normalizer (`shared/templateStateNormalization.ts`) performs:

1. **Schema normalization** — legacy `textOnPath` / `centerText` element names are converted to the canonical element types and missing `heightMm` is filled in shape-safely.
2. **Arc repair** — `text-on-path` is fitted against the real semantic arc length with a visual occupancy cap (`renderedTextLength <= arcLength × 0.78`). For multi-ring seals, the fitter also normalizes the nearest inner ring so top/bottom arc text has explicit breathing room instead of merely avoiding mathematical overlap.
3. **Center-text repair** — center text is fitted as a **stack**, not as isolated elements. The fitter reserves a central band between any top/bottom arc text, applies a visual width/height cap, then rescales and repositions the lines vertically.
4. **Center-text wrapping** — if a long center phrase still cannot fit at the minimum readable font size, the normalizer tries balanced 2-line / 3-line wraps before accepting overflow.

This is the canonical rule for:
- template library previews
- source-fallback templates when `DATABASE_URL` is absent
- template states loaded into the editor
- geometry audit / repair scripts

The rule is deterministic: malformed template data may still be repaired at the source, but the runtime renderer is guarded so future bad states do not reintroduce clipped previews.

### Template categories

The template drawer category strip must come from the live template source, not a hard-coded frontend list.

- With a database: categories come from `template.categories`
- Without a database: categories are derived from `server/seed300Templates.ts`

This avoids stale categories such as `Legal / Notary` or `Wedding` showing up in the UI when the actual source catalog only contains `Legal` and no wedding templates.

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
| Arc `radius` | derived by `fitArcTextRadius(6, safeInnerR, maxR)` | `~71%` of maxR (`~21.40` SVG units) | Baseline stays inside the safe frame area |
| Top arc `fontSize` | `6` pt | `6` pt | Primary outer label |
| Bottom arc `fontSize` | `4` pt | `4` pt | Deliberately more restrained than the top arc |
| Arc `letterSpacing` | `100` (stored) | Reduced only if needed to fit the rendered arc | Never overflows arc |
| Arc `bold` | `true` | — | Legibility |
| Top arc center | `startAngle = 0` | `12 o'clock` | Semantic top arc | Deterministic |
| Bottom arc center | `startAngle = 0`, `inverse = true` | `6 o'clock` | Semantic bottom arc | Deterministic |
| Centre `fontSize` | `7` pt | `fitCenterTextFontSize("YOUR STAMP", 24.58, 7)` | Width 40.6 ≤ 42.3 available ✓ |
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
2. Calls `fitArcTextRadius(6, safeInnerR, maxR)` to get the shared arc radius percentage
3. Calls `fitCenterTextFontSize("YOUR STAMP", safeInnerR, 7)` to get the centre font size
4. Constructs the 4-element array in the order: `frame → topArc → centerText → bottomArc`
5. Uses a smaller bottom arc font size than the top arc to keep `CREATE IN SECONDS` tightly centred around `6 o'clock`

Do **not** hardcode SVG-unit values in `createDefaultStamp()`. Always derive them from the helpers so the geometry stays consistent if constants change.

#### Renderer relationship

`renderStampSvg()` is the single geometry implementation for:

- main editor canvas
- preview modal
- stamp thumbnails
- template library previews
- PDF editor preview
- SVG export
- PNG export
- PDF stamping/export rasterisation

Do not introduce renderer-specific arc workarounds. If round text geometry changes, it must change here.

#### Starter-stamp persistence policy

The persisted editor state uses Zustand `persist` with schema version `3`.

- New users get the current canonical starter stamp.
- Returning users keep their persisted work.
- Migration only replaces a stamp when it still matches the untouched historical starter signature.
- User-customized stamps must not be overwritten just because the canonical starter changed.

#### Regression tests

Starter assertions live in `server/defaultStamp.test.ts`. Catalog normalization assertions live in `server/templateGeometry.test.ts`. Run with `pnpm test`. Coverage includes:
- Shape and size (`round`, 38 × 38 mm)
- Exact element count (4) and element order
- Canonical text strings for each layer
- Brand colour `#1a3a6b` on all elements
- All effects off by default
- Arc glyphs remain below the strict occupancy cap and maintain ring/frame clearance
- Centre text width and height stay below the visual occupancy caps (not just the hard bounds)
- Starter bottom arc is no larger than the top arc fit
- Catalog audit flags the unnormalized 318-template source set
- Catalog normalization reduces repaired invalid templates to `0`
- Round, oval, rectangular, and triangular template examples fit within safe bounds
- Each `createDefaultStamp()` call returns a unique stamp ID

### Physical size label

Displayed below the stamp: `38 mm` for round/triangular, `50 × 25 mm` for oval/rectangular.

### Grid and zoom controls

The grid is an editor-only SVG overlay and is **never included in exports**. Zoom controls (−, %, +, ⊞) appear in the bottom-right corner of the stage.

---

## Image / Icon Element

The **Image** toolbar button opens the `IconPickerDrawer` (292 icons across 19 categories) and a custom SVG upload (max 50 KB, client-side sanitisation). Built-in icons are served from `shared/iconData.ts` via `trpc.icon.list`; inserted artwork is represented in stamp state as an `ImageElement` with inline `svgContent`. There is no separate persisted `icon` element type today.

---

## Export

The editor viewport (zoom, grid, stage) is **never included in exports**. `renderStampSvg()` is called identically for editor display and all export formats. Physical dimensions are determined solely by `stamp.widthMm` / `stamp.heightMm` and the export DPI (300 DPI for PNG).
