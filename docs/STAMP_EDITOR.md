# Stamp Editor

## Overview

The stamp editor is a client-side SVG canvas editor built with React 19, Zustand (state), and a custom SVG renderer (`client/src/editor/svgUtils.ts`). All rendering is pure SVG.

## Shapes

| Shape | Default size |
|---|---|
| Round | 38 mm diameter |
| Oval | 50 x 30 mm |
| Rectangular | 55 x 25 mm |
| Triangular | 38 mm |

Size is configurable from 10 mm to 150 mm.

## Element Types

| Type | Description |
|---|---|
| `frame` | Ring/border — configurable radius, stroke width, line break (gap), color |
| `text-on-path` | Text along a circular arc — radius, start angle, letter spacing, font, size, bold, italic, align, inverse |
| `center-text` | Free-positioned text — x/y position, font, size, bold, italic |
| `image` | SVG icon or custom SVG — x/y position, scale, color |

## Layers

Elements are rendered in array order (first = bottom layer). The Layers panel shows elements in reverse order (top first). Users can reorder, toggle visibility, duplicate, and delete elements.

## Effects

| Effect | Description |
|---|---|
| Shabby / Aged | SVG `feTurbulence` filter — simulates worn/aged ink |
| Gold Metallic | Linear gradient replacing the stamp color |
| Silver Metallic | Linear gradient replacing the stamp color |

## Save and Share

Designs are saved to the `designs` table via `design.save`. Each design gets a unique `shareToken` for shareable URLs (`/editor?share=TOKEN`).

## SVG Renderer

`renderStampSvg(stamp, opts?)` in `client/src/editor/svgUtils.ts`:

- Internal canvas is always 250 x 250 units with the stamp centered at (125, 125)
- `textPath` `<path>` definitions are hoisted to the top-level `<defs>` section (outside the clip group) to prevent clipping
- The clip path constrains all elements to the stamp shape boundary
- The watermark is rendered outside the clip group

## Editor Viewport

**Status: PARTIALLY IMPLEMENTED — under active refinement**

The editor viewport auto-fits the stamp to ~75% of the available workspace. A measurement grid, zoom controls (Zoom In / Zoom Out / Fit to Workspace), and a physical size label are present. See `docs/OPEN_ITEMS.md` for remaining verification items.
