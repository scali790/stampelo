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

echo "[build] Generating route-aware SEO HTML..."
node scripts/build-seo-pages.mjs
node scripts/verify-seo-output.mjs

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
  --external:sharp \
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
    { "src": "^/(.*\\.(js|css|png|jpg|jpeg|webp|avif|svg|ico|json|txt|xml|woff|woff2|ttf|eot))$", "dest": "/$1" },
    { "src": "^/$", "dest": "/index.html" },
    { "src": "^/editor/?$", "dest": "/editor.html" },
    { "src": "^/pdf-editor/?$", "dest": "/pdf-editor.html" },
    { "src": "^/privacy/?$", "dest": "/privacy.html" },
    { "src": "^/terms/?$", "dest": "/terms.html" },
    { "src": "^/refund/?$", "dest": "/refund.html" },
    { "src": "^/account/?$", "dest": "/account.html" },
    { "src": "^/admin/?$", "dest": "/admin.html" },
    { "src": "^/download/?$", "dest": "/download.html" },
    { "src": "^/404/?$", "dest": "/404.html", "status": 404 },
    { "src": "^/.*$", "dest": "/404.html", "status": 404 }
  ]
}
CFGEOF

echo "[build] Running bundle verification..."
bash scripts/verify-bundle.sh .vercel/output/functions/api/server.func/index.mjs
echo "[build] Done. Static: $(ls .vercel/output/static | wc -l) files. Function: $(wc -c < .vercel/output/functions/api/server.func/index.mjs) bytes"

# ── Copy sharp native binary for Linux x64 (Vercel runtime) ──────────────────
echo "[build] Copying sharp native binary for linux-x64..."
SHARP_LINUX_DIR="node_modules/@img/sharp-linux-x64"
if [ -d "$SHARP_LINUX_DIR" ]; then
  mkdir -p .vercel/output/functions/api/server.func/node_modules/@img/sharp-linux-x64
  cp -r "$SHARP_LINUX_DIR/." .vercel/output/functions/api/server.func/node_modules/@img/sharp-linux-x64/
  echo "[build] sharp linux-x64 binary copied."
else
  echo "[build] WARNING: sharp linux-x64 binary not found at $SHARP_LINUX_DIR — PDF export may fail"
fi
# Also copy sharp itself (the JS wrapper that loads the binary)
if [ -d "node_modules/sharp" ]; then
  mkdir -p .vercel/output/functions/api/server.func/node_modules/sharp
  cp -r "node_modules/sharp/." .vercel/output/functions/api/server.func/node_modules/sharp/
  echo "[build] sharp JS wrapper copied."
fi
# Copy ALL @img/* packages (sharp depends on @img/colour and others at runtime)
if [ -d "node_modules/@img" ]; then
  mkdir -p .vercel/output/functions/api/server.func/node_modules/@img
  for pkg in node_modules/@img/*/; do
    pkgname=$(basename "$pkg")
    dest=".vercel/output/functions/api/server.func/node_modules/@img/$pkgname"
    if [ ! -d "$dest" ]; then
      cp -r "$pkg" "$dest"
      echo "[build] copied @img/$pkgname"
    fi
  done
  echo "[build] all @img/* packages copied."
else
  echo "[build] WARNING: node_modules/@img not found — Sharp runtime deps may be missing"
fi
# Copy detect-libc (required by sharp for platform detection)
if [ -d "node_modules/detect-libc" ]; then
  mkdir -p .vercel/output/functions/api/server.func/node_modules/detect-libc
  cp -r "node_modules/detect-libc/." .vercel/output/functions/api/server.func/node_modules/detect-libc/
  echo "[build] detect-libc copied."
fi
