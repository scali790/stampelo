# Template System

## Overview

Stampelo ships with **318 editable templates** across 14 categories. The marketing claim "300+ editable templates" is valid as long as the active template count remains >= 300.

**Current active count: 318** (verified 2026-08-07).

## Template Model

Each template is stored in the `templates` PostgreSQL table with:

| Field | Description |
|---|---|
| `name` | English display name |
| `nameDE` | German display name |
| `category` | Category string |
| `shape` | `round`, `oval`, `rectangular`, or `triangular` |
| `stateJson` | Full editor state (stamps array + activeStampId) |
| `thumbnailSvg` | Pre-generated SVG thumbnail (optional) |
| `isActive` | Boolean — inactive templates are hidden from users |
| `sortOrder` | Display order within category |
| `slug` | URL-friendly identifier |
| `searchTerms` | Additional search keywords |

## Categories (14 active)

Corporate, Medical, Legal / Notary, Wedding, Finance / Banking, Education, Government, Real Estate, Construction, Transport, Retail, Restaurant / Food, Technology, Creative / Design.

## Shapes

Round (161), Rectangular (143), Oval (10), Triangular (4).

## Preview Generation

Template thumbnails are generated **client-side** from `stateJson` using `renderStampSvg()`. If `thumbnailSvg` is populated in the database, it is used directly; otherwise the client renders a live preview.

## Search and Filter

The `template.list` tRPC procedure supports category filter, shape filter, full-text search, and pagination.

## Seeding

Templates are seeded via `scripts/seed-templates.ts`. The seed script is idempotent (upsert by slug).
