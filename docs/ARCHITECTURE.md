# Architecture

## Overview

Stampelo is a full-stack TypeScript SaaS application — an online stamp maker with a rich SVG editor, template library, Stripe payments, and server-side export pipeline. It is deployed on Vercel with Neon PostgreSQL, Vercel Blob storage, Auth.js authentication, Stripe payments, and Resend email delivery.

## System Diagram

```
Browser
  → https://www.stampelo.com  (canonical domain, Cloudflare DNS)
  → Vercel CDN
      → /assets/*, /*.js, /*.css, /index.html  →  .vercel/output/static/  (Vite SPA)
      → /api/*                                  →  .vercel/output/functions/api/server.func/
          → Express 4 app
              → /api/trpc/*         → tRPC router (server/routers/)
              → /api/auth/*         → Auth.js (@auth/express)
              → /api/stripe/webhook → Stripe webhook handler
          → Neon PostgreSQL  (Drizzle ORM)
          → Vercel Blob      (file storage)
          → Stripe           (payments)
          → Resend           (transactional email)
```

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 5, Tailwind CSS 4, shadcn/ui, Zustand, Wouter |
| API | Express 4, tRPC 11 (type-safe end-to-end), Zod |
| Database | Neon PostgreSQL (serverless), Drizzle ORM |
| Auth | @auth/express v0.12 — Resend magic link + Google OAuth |
| Storage | Vercel Blob (`@vercel/blob`) |
| Payments | Stripe (CHF, webhook-driven fulfillment) |
| Email | Resend (`noreply@stampelo.com`) |
| Hosting | Vercel (Autoscale, Build Output API) |
| Source | GitHub (`github.com/scali790/stampelo`) |
| Domain | `www.stampelo.com` (canonical) |

## Key Design Decisions

**tRPC-first API.** All backend procedures are defined in `server/routers/` and consumed via typed hooks in the frontend. No manual REST routes or shared contract files.

**Auth.js database sessions.** Sessions are stored in the `sessions` PostgreSQL table, not JWTs, enabling server-side revocation. `app.set("trust proxy", true)` is required so Auth.js generates `https://` callback URLs behind Vercel's TLS termination.

**Vercel Blob for exports.** Generated files (PNG/SVG/EPS/PDF/DOCX) are stored in Vercel Blob with public URLs. The `BLOB_READ_WRITE_TOKEN` is auto-injected by Vercel.

**Stripe webhook fulfillment.** Downloads are only generated after `checkout.session.completed` webhook confirmation. A browser redirect to a success page never marks an order as paid.

**ADMIN_EMAIL bootstrap.** The first sign-in with the configured `ADMIN_EMAIL` address auto-promotes that user to `admin` role in the database. No manual SQL is required.

**Vercel Build Output API.** The project uses a custom `scripts/build-vercel.sh` that produces `.vercel/output/` directly — Vite frontend in `.vercel/output/static/`, Express server bundled with esbuild into `.vercel/output/functions/api/server.func/index.mjs`.

## File Structure

```
client/              React 19 SPA (Vite)
  src/
    editor/          Stamp editor (SVG canvas, store, types)
    pages/           Route-level components
    components/      Shared UI (shadcn/ui wrappers)
    i18n/            EN/DE locale strings
server/              Express backend
  routers/           tRPC procedure routers
  auth.ts            Auth.js configuration
  exportService.ts   PNG/SVG/EPS/PDF/DOCX generation
  webhookHandler.ts  Stripe webhook + fulfillment
  storage.ts         Vercel Blob helpers
  db.ts              Drizzle database helpers
drizzle/             Schema + migrations
shared/              Types and constants shared between client and server
src/
  server-entry.ts    Vercel function entry point (Express app)
scripts/
  build-vercel.sh    Production build script (Build Output API)
docs/                All canonical documentation
```
