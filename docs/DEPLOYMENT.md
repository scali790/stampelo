# Deployment

## Production Architecture

Stampelo uses the **Vercel Build Output API** — a custom build script produces `.vercel/output/` directly, bypassing Vercel's framework auto-detection.

```
.vercel/output/
  static/                         ← Vite frontend (SPA)
  functions/
    api/
      server.func/
        index.mjs                 ← esbuild ESM bundle (all JS deps inlined)
        .vc-config.json           ← { runtime: "nodejs22.x", handler: "index.mjs", ... }
        node_modules/
          sharp/                  ← native binary (linux-x64, copied at build time)
          @img/sharp-linux-x64/   ← sharp native addon
  config.json                     ← Vercel routing rules
```

**Routing (`config.json`):**
- `/api/*` → Vercel Function (`/api/server`)
- `/assets/*`, `*.js`, `*.css`, etc. → static files
- Everything else → `/index.html` (SPA fallback)

## Build Process

The build is triggered by `vercel.json`:
```json
{
  "buildCommand": "bash scripts/build-vercel.sh",
  "installCommand": "pnpm install"
}
```

`scripts/build-vercel.sh` performs:
1. `npx vite build` → `dist/public/` → copied to `.vercel/output/static/`
2. `npx esbuild src/server-entry.ts --platform=node --format=esm --bundle --external:sharp` → `index.mjs`
3. Copy `node_modules/sharp` and `node_modules/@img/sharp-linux-x64` into the function directory
4. Write `.vc-config.json` and `config.json`
5. Run `scripts/verify-bundle.sh` to assert no internal project imports remain in the bundle

## esbuild Bundling Strategy

All pure-JS dependencies are bundled into `index.mjs`. `sharp` is kept external because it requires a native binary that must match the Vercel Linux runtime. The `createRequire` banner supports CommonJS interop within the ESM bundle.

## Domain Configuration

In Vercel Dashboard → Project → Settings → Domains:
- `www.stampelo.com` — primary domain
- `stampelo.com` — permanent redirect (308) to `https://www.stampelo.com`

DNS is managed in Cloudflare. Exact DNS targets must be read from the live Vercel domain configuration panel.

## Deployment Trigger

Every push to the `main` branch of `github.com/scali790/stampelo` triggers an automatic Vercel production deployment.

## Known Deployment Lessons

| Issue | Root Cause | Fix |
|---|---|---|
| Raw server bundle served as homepage | Vercel treated `api/server.js` as a static asset | Switched to Build Output API with explicit `.vercel/output/` structure |
| `ERR_UNSUPPORTED_DIR_IMPORT` | Extensionless/directory ESM imports in server code | esbuild bundles all internal modules |
| `ERR_MODULE_NOT_FOUND: dotenv` | `import "dotenv/config"` in server entry | Removed; Vercel injects env vars natively |
| Missing runtime dependencies | External packages not in function filesystem | Pure-JS packages bundled; `sharp` binary copied explicitly |
| `http://` callback URLs in Auth.js | `req.protocol` returns `http` behind Vercel TLS | `app.set("trust proxy", true)` added |
| ESM/CJS interop errors | Some packages use `require()` internally | esbuild `createRequire` banner added |

## Rollback

In Vercel Dashboard → Deployments, select any previous deployment and click **Promote to Production**.
