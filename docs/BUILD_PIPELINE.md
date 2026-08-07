# Build Pipeline

## Package Manager

`pnpm` (v9+). Install: `pnpm install`.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start local dev server (Express + Vite HMR on port 3000) |
| `pnpm build` | Production build (calls `scripts/build-vercel.sh`) |
| `pnpm typecheck` | TypeScript type check (`tsc --noEmit`) |
| `pnpm test` | Run Vitest unit/integration tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate Drizzle migration SQL from schema changes |
| `pnpm db:migrate` | Apply pending migrations to the database |

## Production Build (`scripts/build-vercel.sh`)

1. **Vite frontend build** → `dist/public/` → copied to `.vercel/output/static/`
2. **esbuild server bundle** → `src/server-entry.ts` → `.vercel/output/functions/api/server.func/index.mjs`
   - `--platform=node --format=esm --bundle`
   - `--external:sharp` (native binary, handled separately)
   - `createRequire` banner for CJS interop
3. **sharp native binary** → `node_modules/sharp` and `node_modules/@img/sharp-linux-x64` copied into function directory
4. **`.vc-config.json`** written with `runtime: "nodejs22.x"`, `handler: "index.mjs"`
5. **`config.json`** written with routing rules
6. **Bundle verification** → `scripts/verify-bundle.sh` asserts no internal project imports remain

## Source of Truth

**Source of truth:** TypeScript source files in `src/`, `server/`, `client/`, `shared/`.

**Generated bundles** (`.vercel/output/`, `dist/`) are **not canonical source** and are **not manually edited**. They are gitignored.

## Gitignored Generated Artifacts

```
.vercel/output/
dist/
.local-storage/
```

## Bundle Verification Guard

`scripts/verify-bundle.sh` runs after every build and fails if the generated `index.mjs` contains any runtime imports to internal project paths. This prevents the `ERR_UNSUPPORTED_DIR_IMPORT` class of errors from reaching production.
