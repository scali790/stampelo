# Architecture

## Overview

Stampelo is a full-stack TypeScript web application with a React frontend and Express/tRPC backend,
deployed on Vercel with Neon PostgreSQL, Vercel Blob storage, Auth.js authentication, Stripe payments,
and Resend email delivery.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS 4, shadcn/ui |
| API | Express 4, tRPC 11 (type-safe end-to-end) |
| Database | Neon PostgreSQL, Drizzle ORM |
| Auth | Auth.js v5 (email magic link + Google OAuth) |
| Storage | Vercel Blob |
| Payments | Stripe (CHF, webhook-driven fulfillment) |
| Email | Resend |
| Hosting | Vercel (Autoscale) |
| CI | GitHub Actions |
| Domain | www.stampelo.com |

## Key Design Decisions

1. **tRPC-first API**: All backend procedures are defined in `server/routers/` and consumed via typed hooks.
2. **Auth.js database sessions**: Sessions stored in PostgreSQL, not JWTs, for revocability.
3. **Vercel Blob for exports**: Generated files (PNG/SVG/EPS/PDF/DOCX) stored in Vercel Blob with public URLs.
4. **Stripe webhook fulfillment**: Downloads only generated after webhook confirmation, never on checkout redirect.
5. **ADMIN_EMAIL bootstrap**: First sign-in with the configured admin email auto-promotes to admin role.
