# Stampelo Documentation Index

## ARCHITECTURE

| Document | Description |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System overview, stack, design decisions, file structure |
| [BUILD_PIPELINE.md](./BUILD_PIPELINE.md) | Build commands, esbuild bundling, generated artifacts |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel Build Output API, deployment process, known lessons |

## DEVELOPMENT

| Document | Description |
|---|---|
| [ENVIRONMENT.md](./ENVIRONMENT.md) | All environment variables — purpose, required/optional, format |
| [DATABASE.md](./DATABASE.md) | Neon PostgreSQL, Drizzle schema, migrations, seeding |
| [TESTING.md](./TESTING.md) | Vitest + Playwright test suites, commands, current status |

## PRODUCTION

| Document | Description |
|---|---|
| [DOMAIN_DNS.md](./DOMAIN_DNS.md) | Canonical domain, apex redirect, Cloudflare DNS, SSL |
| [OPERATIONS.md](./OPERATIONS.md) | Deploy, rollback, migrations, admin bootstrap, incident response |
| [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md) | Post-deployment verification checklist |
| [OPEN_ITEMS.md](./OPEN_ITEMS.md) | P0/P1/P2/P3 backlog |

## PRODUCT

| Document | Description |
|---|---|
| [STAMP_EDITOR.md](./STAMP_EDITOR.md) | Editor shapes, elements, effects, SVG renderer |
| [TEMPLATES.md](./TEMPLATES.md) | Template library — 318 templates, categories, seeding |
| [ICON_LIBRARY.md](./ICON_LIBRARY.md) | 292 built-in icons across 19 categories |
| [EXPORT_PIPELINE.md](./EXPORT_PIPELINE.md) | PNG/SVG/EPS/PDF/DOCX — formats, dimensions, entitlements |
| [PDF_EDITOR.md](./PDF_EDITOR.md) | PDF upload, stamp placement, server merge |

## SECURITY

| Document | Description |
|---|---|
| [SECURITY.md](./SECURITY.md) | Auth, admin roles, webhook verification, SVG sanitization |
| [AUTH.md](./AUTH.md) | Auth.js configuration, providers, trust proxy, callback URLs |
| [ADMIN.md](./ADMIN.md) | Admin bootstrap, authorization model, testing |

## PAYMENTS AND EMAIL

| Document | Description |
|---|---|
| [STRIPE.md](./STRIPE.md) | Plans, checkout flow, webhook, idempotency, test cards |
| [EMAIL.md](./EMAIL.md) | Resend integration, magic links, fulfillment email |

## OPERATIONS

| Document | Description |
|---|---|
| [SEO_GEO.md](./SEO_GEO.md) | Canonical domain, metadata, sitemap, i18n, future work |

## MIGRATION

| Document | Description |
|---|---|
| [MANUS_MIGRATION.md](./MANUS_MIGRATION.md) | Original Manus state vs current standalone architecture |
| [MANUS_DECOMMISSION.md](./MANUS_DECOMMISSION.md) | Decommission audit — all Manus dependencies replaced |
