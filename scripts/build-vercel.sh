#!/bin/bash
# Vercel Build Output API script
# Source: src/server-entry.ts (maintainable)
# Generated: .vercel/output/functions/api/server.func/index.mjs (gitignored)
#
# BUNDLING STRATEGY:
# - All pure-JS packages are bundled into index.mjs (no node_modules needed at runtime)
# - sharp is kept external (native binary) and its linux-x64 build is copied into .func/
# - pg is bundled (uses pure-JS fallback, no native binding needed)
set -e

echo "[build] Building Vite frontend..."
npx vite build

echo "[build] Creating .vercel/output structure..."
rm -rf .vercel/output
mkdir -p .vercel/output/static
mkdir -p .vercel/output/functions/api/server.func

echo "[build] Copying frontend to .vercel/output/static..."
cp -r dist/public/. .vercel/output/static/

echo "[build] Bundling src/server-entry.ts with esbuild..."
npx esbuild src/server-entry.ts \
  --platform=node \
  --format=esm \
  --bundle \
  --external:@resvg/resvg-wasm \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);" \
  --outfile=.vercel/output/functions/api/server.func/index.mjs

echo "[build] Writing .vc-config.json..."
cat > .vercel/output/functions/api/server.func/.vc-config.json << 'VCEOF'
{
  "runtime": "nodejs20.x",
  "handler": "index.mjs",
  "launcherType": "Nodejs",
  "shouldAddHelpers": true,
  "maxDuration": 60
}
VCEOF

echo "[build] Writing routing config..."
cat > .vercel/output/config.json << 'CFGEOF'
{
  "version": 3,
  "routes": [
    { "src": "^/api/test-a$", "dest": "/test-a" },
    { "src": "^/api/test-b$", "dest": "/test-b" },
    { "src": "^/api(/.*)?$", "dest": "/api/server" },
    { "src": "^/assets/(.*)$", "dest": "/assets/$1" },
    { "src": "^/(.*\\.(js|css|png|svg|ico|json|txt|xml|woff|woff2|ttf|eot))$", "dest": "/$1" },
    { "src": "^/(.*)$", "dest": "/index.html" }
  ]
}
CFGEOF

echo "[build] Running bundle verification..."
bash scripts/verify-bundle.sh .vercel/output/functions/api/server.func/index.mjs
echo "[build] Done. Static: $(ls .vercel/output/static | wc -l) files. Function: $(wc -c < .vercel/output/functions/api/server.func/index.mjs) bytes"

# ── Copy @resvg/resvg-wasm (WASM binary must be accessible at runtime) ──────────
echo "[build] Copying @resvg/resvg-wasm..."
RESVG_DIR="node_modules/@resvg/resvg-wasm"
if [ -d "$RESVG_DIR" ]; then
  mkdir -p .vercel/output/functions/api/server.func/node_modules/@resvg/resvg-wasm
  cp -r "$RESVG_DIR/." .vercel/output/functions/api/server.func/node_modules/@resvg/resvg-wasm/
  echo "[build] @resvg/resvg-wasm copied (includes index_bg.wasm)."
else
  echo "[build] WARNING: @resvg/resvg-wasm not found — PDF stamp export will fail"
fi
