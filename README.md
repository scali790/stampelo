# Stampelo — Professional Online Stamp Maker

**Production URL:** https://www.stampelo.com
**Repository:** https://github.com/scali790/stampelo
**Stack:** React 19 + Vite + Express + tRPC + Drizzle ORM + PostgreSQL + Auth.js + Vercel Blob + Stripe + Resend

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/scali790/stampelo.git
cd stampelo

# 2. Install
pnpm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials (see docs/ENVIRONMENT.md)

# 4. Run database migrations
pnpm db:migrate

# 5. Seed templates and icons
pnpm db:seed

# 6. Start development server
pnpm dev
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server (localhost:3000) |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit/integration tests |
| `pnpm test:e2e` | Run Playwright cross-browser tests |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Seed templates and icons |

## Architecture

- **Frontend:** React 19 + Vite + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 4 + tRPC 11 (type-safe API)
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Auth:** Auth.js v5 (email magic link + Google OAuth)
- **Storage:** Vercel Blob
- **Payments:** Stripe (CHF)
- **Email:** Resend
- **Hosting:** Vercel
- **CI:** GitHub Actions

## Documentation

See the `docs/` directory for detailed documentation on each subsystem.

## Manus Independence

This application is **completely independent of Manus infrastructure**.
See `docs/MANUS_DECOMMISSION.md` for the full decommission audit.

**MANUS PRODUCTION DEPENDENCIES: 0**
