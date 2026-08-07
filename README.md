# Stampelo — Online Stamp Maker

**Production:** https://www.stampelo.com

Stampelo is a full-featured online stamp maker SaaS. Users design custom stamps (round, oval, rectangular, triangular) with a rich SVG editor, add text on paths, frames, and icons, then purchase and download in PNG, SVG, EPS, PDF, and DOCX formats.

## Architecture Summary

```
Browser → Vercel CDN
  → /api/*  → Express 4 + tRPC 11 (Vercel Node Function)
               → Neon PostgreSQL (Drizzle ORM)
               → Vercel Blob (file storage)
               → Stripe (payments)
               → Resend (email)
  → /*      → Vite SPA (React 19 + Tailwind 4)
```

Auth: Auth.js (`@auth/express`) — Resend magic link + Google OAuth

## Local Setup

```bash
git clone https://github.com/scali790/stampelo
cd stampelo
pnpm install
cp .env.example .env.local   # Edit with your credentials (see docs/ENVIRONMENT.md)
pnpm db:migrate
pnpm dev                     # http://localhost:3000
```

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start dev server (port 3000) |
| `pnpm build` | Production build (Vercel Build Output API) |
| `pnpm test` | Run 84 Vitest tests |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:generate` | Generate migration SQL |
| `pnpm db:migrate` | Apply migrations |

## Deployment

Every push to `main` triggers an automatic Vercel production deployment. See `docs/DEPLOYMENT.md` for full details.

## Documentation

Full documentation is in `docs/`. Start with `docs/README.md` for the index.

| Quick links | |
|---|---|
| Architecture | `docs/ARCHITECTURE.md` |
| Environment variables | `docs/ENVIRONMENT.md` |
| Deployment | `docs/DEPLOYMENT.md` |
| Authentication | `docs/AUTH.md` |
| Stripe payments | `docs/STRIPE.md` |
| Open items / backlog | `docs/OPEN_ITEMS.md` |
