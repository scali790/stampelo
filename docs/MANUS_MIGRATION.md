# Manus Migration

## Original State (Manus-hosted)

| Component | Original (Manus) |
|---|---|
| Hosting | Manus managed hosting (`stampelo-app-5lbna2jy.manus.space`) |
| Source storage | Manus project filesystem |
| Authentication | Manus OAuth (`/api/oauth/callback`, `VITE_APP_ID`, `OAUTH_SERVER_URL`) |
| Database | MySQL/TiDB via Manus `DATABASE_URL` |
| File storage | Manus storage proxy (`/manus-storage/*`, `BUILT_IN_FORGE_API_KEY`) |
| Email | Manus email proxy |
| Analytics | Umami via Manus internal endpoint (`VITE_ANALYTICS_ENDPOINT`) |
| Session | Manus JWT (`JWT_SECRET`) |
| Admin | `OWNER_OPEN_ID` / `OWNER_NAME` env vars |

## Current State (Standalone)

| Component | Current (Standalone) |
|---|---|
| Hosting | Vercel (Autoscale) |
| Source storage | GitHub (`github.com/scali790/stampelo`) |
| Authentication | Auth.js `@auth/express` — Resend magic link + Google OAuth |
| Database | Neon PostgreSQL (Drizzle ORM) |
| File storage | Vercel Blob (`@vercel/blob`) |
| Email | Resend (direct, `noreply@stampelo.com`) |
| Analytics | None active (Umami removed) |
| Session | Auth.js database sessions (`AUTH_SECRET`) |
| Admin | `ADMIN_EMAIL` env var bootstrap |
| Domain | `www.stampelo.com` (canonical) |

## Migration Challenges

The most significant challenge was the Vercel deployment architecture. The original Manus build assumed a persistent Node.js process server; Vercel's serverless model required:

1. Switching from a standard Express server to the Vercel Build Output API
2. Bundling all server-side code with esbuild into a single ESM `.mjs` file
3. Handling `sharp` as an external native binary (copied into the function directory at build time)
4. Adding `app.set("trust proxy", true)` for correct HTTPS URL generation behind Vercel's TLS termination

See `docs/DEPLOYMENT.md` for the full list of deployment lessons.
