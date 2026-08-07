# Manus Decommission Audit

This document records every Manus dependency that existed in the original development build and confirms its replacement in the production standalone architecture.

## Decommission Status

| Manus Service | Replacement | Status |
|---|---|---|
| Manus Hosting | Vercel | REPLACED |
| Manus Source Storage | GitHub (`github.com/scali790/stampelo`) | REPLACED |
| Manus OAuth | Auth.js v5 (email magic link + Google OAuth) | REPLACED |
| Manus Database (MySQL/TiDB) | Neon PostgreSQL | REPLACED |
| Manus Storage Proxy (`/manus-storage/*`) | Vercel Blob | REPLACED |
| Manus Domain (`stampelo-app-5lbna2jy.manus.space`) | `www.stampelo.com` | REPLACED |
| Manus Email Proxy | Resend (direct, `noreply@stampelo.com`) | REPLACED |
| Manus Built-in Forge API (LLM, image gen) | Not used in production | REMOVED |
| Manus Heartbeat SDK | Not used in production | REMOVED |
| Manus Analytics (Umami via Manus) | Removed from production build | REMOVED |
| `VITE_APP_ID` (Manus OAuth app ID) | `AUTH_SECRET` (Auth.js) | REPLACED |
| `OWNER_OPEN_ID` / `OWNER_NAME` | `ADMIN_EMAIL` (env-based admin bootstrap) | REPLACED |
| `BUILT_IN_FORGE_API_KEY/URL` | Not needed | REMOVED |
| `vite-plugin-manus-runtime` | Removed from `vite.config.ts` | REMOVED |
| `server/_core/sdk.ts` (Manus SDK) | Removed entirely | REMOVED |
| `server/_core/oauth.ts` (Manus OAuth) | Removed entirely | REMOVED |

## Verification

No production request routes through `*.manus.space` or `*.manus.im`. No production secret is managed by Manus. The application builds and runs from a fresh GitHub clone with only the documented env vars in `docs/ENVIRONMENT.md`. Deleting the Manus project has zero impact on `www.stampelo.com`.

## Conclusion

**MANUS PRODUCTION DEPENDENCIES: 0**

**SAFE TO DECOMMISSION OLD MANUS PRODUCTION ENVIRONMENT: YES**
