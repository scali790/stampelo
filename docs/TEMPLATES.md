# Template System

## Overview

Stampelo currently has **318 active template records** in the production Neon database.

Do **not** equate the database row count with 318 visually distinct, production-quality templates. The 2026-08-08 audit found that the original catalogue was generated from a small set of structural builders and stored with a legacy editor-state schema that the current renderer does not fully understand without normalization.

Until the visual-quality audit is completed, the canonical product statement is **"318 active template records"**, not "318 distinct designs".

## 2026-08-08 production audit

Verified directly against `stampelo-db`:

- 318 active rows.
- 318/318 states use legacy `centerText` element types instead of canonical `center-text`.
- 171/318 states use legacy `textOnPath` instead of canonical `text-on-path`.
- 318/318 states omit `heightMm`.
- 318/318 rows have `thumbnailSvg = NULL`.
- The catalogue is generated from only six basic structural layout archetypes when grouped by shape and element structure.
- The largest archetype is a two-ring round stamp with one arc-text element and one center-text element (156 templates).
- Rectangular templates are heavily concentrated in one-frame/two-or-three-line layouts.

These findings explain the previous Template Library behaviour: frames rendered because `frame` remained a valid element type, while legacy text elements were ignored by the current renderer; rectangular/oval previews could also become invalid because their height was missing.

The application now normalizes these legacy states at read time. The production rows may therefore remain in the legacy representation until a deliberate data-cleanup migration is approved; that cleanup is not required for the library to render correctly.

## Canonical editor-state schema

Template state must use the same schema as `client/src/editor/types.ts`:

- `text-on-path`, not `textOnPath`
- `center-text`, not `centerText`
- `frame.lineBreak`, not `lineBreakGap`
- every stamp must have both `widthMm` and `heightMm`
- `selectedElementId` should be present at state level (normally `null` for templates)

`shared/templateStateNormalization.ts` provides backward-compatible normalization for existing stored templates.

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

## Categories: canonical source of truth

The live database currently contains 14 active categories:

Business, Approval, Finance, Document, Logistics, Legal, Medical, Personal, Construction, Custom, Education, Real Estate, Retail, Utility.

The Template Library must obtain its filter categories from the `template.categories` API, which is derived from active database rows. It must **not** use the historical hard-coded `TEMPLATE_CATEGORIES` list for editor filtering. This prevents category drift such as `Corporate` vs `Business`, `Legal / Notary` vs `Legal`, and `Finance / Banking` vs `Finance`.

A future taxonomy redesign may rename or group categories, but that must be implemented as an explicit mapping/migration. Until then, the live active database categories are the factual filtering source.

## Preview Generation

Template thumbnails are rendered client-side from normalized `stateJson` using `renderStampSvg()`. `thumbnailSvg` is only a fallback and is currently absent for all 318 production records.

The Template Library must distinguish API/database failure from a genuine zero-result query. A backend error must never be displayed as "No templates".

## Audit and repair commands

Run the read-only production audit:

```bash
DATABASE_URL="$DATABASE_URL" pnpm template:audit
```

Include the per-template A/B/C review queue:

```bash
DATABASE_URL="$DATABASE_URL" pnpm template:audit -- --details
```

The audit reports:

- schema compatibility issues;
- category and shape counts;
- structural-layout diversity and largest repeated layout families;
- exact duplicate groups;
- same-shape/same-text duplicate signals;
- provisional A/B/C review counts and reasons.

The automated A/B/C result is intentionally **provisional**. It is a prioritised review queue, not a substitute for rendered visual inspection.

Preview the canonical state repair without changing data:

```bash
DATABASE_URL="$DATABASE_URL" pnpm template:repair
```

Apply only the schema-normalization repair after review:

```bash
DATABASE_URL="$DATABASE_URL" pnpm template:repair -- --apply
```

The repair changes only legacy state-schema fields and missing dimensions; it does not claim to create unique designs or solve catalogue quality by itself.

## Quality classification

Every active template must ultimately receive a human-confirmed classification:

- **A — usable:** complete, readable and meaningfully distinct.
- **B — repairable:** useful concept but geometry/content/distinctness needs redesign.
- **C — duplicate/junk:** empty, misleading, effectively identical or not useful as a separate template.

The automated audit uses conservative candidate rules to surface the highest-risk rows first. Final classification requires rendered visual comparison, especially within large structural clusters.

The active marketing count must eventually reflect usable templates, not raw rows.

## Source catalogue

The current generated source catalogue is `server/seed300Templates.ts`, invoked by `pnpm db:seed`. The older documentation reference to `scripts/seed-templates.ts` was incorrect.

The historical seeder is the origin of the legacy schema and repeated layout families. New templates must be authored against the canonical editor-state schema and must pass the visual-quality gate before activation.
