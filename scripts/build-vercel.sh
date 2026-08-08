#!/bin/bash
set -e

echo "[build] Building Vite frontend..."
npx vite build

echo "[build] Generating route-aware SEO HTML..."
# Expansion pages must be generated from the clean Vite shell. Core generation
# rewrites index.html with homepage fallback content, so running expansion after
# core generation would copy the homepage body into expansion routes.
node scripts/build-seo-expansion.mjs
node scripts/build-seo-pages.mjs
node scripts/verify-seo-output.mjs

echo "[build] Creating .vercel/output structure..."
rm -rf .vercel/output
mkdir -p .vercel/output/static .vercel/output/functions/api/server.func
cp -r dist/public/. .vercel/output/static/

npx esbuild src/server-entry.ts --platform=node --format=esm --bundle --external:@resvg/resvg-wasm --external:sharp --banner:js="import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);" --outfile=.vercel/output/functions/api/server.func/index.mjs
cat > .vercel/output/functions/api/server.func/.vc-config.json << 'VCEOF'
{"runtime":"nodejs20.x","handler":"index.mjs","launcherType":"Nodejs","shouldAddHelpers":true,"maxDuration":60}
VCEOF
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
    { "src": "^/about/?$", "dest": "/about.html" },
    { "src": "^/pricing/?$", "dest": "/pricing.html" },
    { "src": "^/templates/?$", "dest": "/templates.html" },
    { "src": "^/templates/business-stamps/?$", "dest": "/templates-business-stamps.html" },
    { "src": "^/templates/notary-stamps/?$", "dest": "/templates-notary-stamps.html" },
    { "src": "^/templates/medical-stamps/?$", "dest": "/templates-medical-stamps.html" },
    { "src": "^/templates/status-stamps/?$", "dest": "/templates-status-stamps.html" },
    { "src": "^/templates/approved-stamp/?$", "dest": "/templates-approved-stamp.html" },
    { "src": "^/templates/received-stamp/?$", "dest": "/templates-received-stamp.html" },
    { "src": "^/templates/paid-stamp/?$", "dest": "/templates-paid-stamp.html" },
    { "src": "^/templates/confidential-stamp/?$", "dest": "/templates-confidential-stamp.html" },
    { "src": "^/guides/what-is-a-digital-stamp/?$", "dest": "/guides-what-is-a-digital-stamp.html" },
    { "src": "^/guides/how-to-add-a-stamp-to-a-pdf/?$", "dest": "/guides-how-to-add-a-stamp-to-a-pdf.html" },
    { "src": "^/guides/png-vs-svg-vs-pdf-stamp/?$", "dest": "/guides-png-vs-svg-vs-pdf-stamp.html" },
    { "src": "^/guides/company-stamp-requirements/?$", "dest": "/guides-company-stamp-requirements.html" },
    { "src": "^/guides/digital-vs-rubber-stamp/?$", "dest": "/guides-digital-vs-rubber-stamp.html" },
    { "src": "^/guides/round-vs-rectangular-stamp/?$", "dest": "/guides-round-vs-rectangular-stamp.html" },
    { "src": "^/guides/transparent-png-stamp/?$", "dest": "/guides-transparent-png-stamp.html" },
    { "src": "^/faq/?$", "dest": "/faq.html" },
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
bash scripts/verify-bundle.sh .vercel/output/functions/api/server.func/index.mjs
RESVG_DIR="node_modules/@resvg/resvg-wasm"
if [ -d "$RESVG_DIR" ]; then mkdir -p .vercel/output/functions/api/server.func/node_modules/@resvg/resvg-wasm; cp -r "$RESVG_DIR/." .vercel/output/functions/api/server.func/node_modules/@resvg/resvg-wasm/; else echo "[build] WARNING: @resvg/resvg-wasm not found"; fi
# ── Copy sharp native binary ──────────────────────────────────────────────────
SHARP_DIR="node_modules/.pnpm/sharp@0.35.3_@types+node@24.7.0/node_modules/sharp"
if [ -d "$SHARP_DIR" ]; then
  mkdir -p .vercel/output/functions/api/server.func/node_modules/sharp
  cp -r "$SHARP_DIR/." .vercel/output/functions/api/server.func/node_modules/sharp/
  # Copy ALL @img/* packages (Sharp depends on @img/colour, @img/sharp-linux-x64, etc.)
  for IMG_PKG_DIR in node_modules/.pnpm/@img+*/node_modules/@img; do
    if [ -d "$IMG_PKG_DIR" ]; then
      for IMG_PKG in "$IMG_PKG_DIR"/*/; do
        PKG_NAME=$(basename "$IMG_PKG")
        mkdir -p ".vercel/output/functions/api/server.func/node_modules/@img/$PKG_NAME"
        cp -r "$IMG_PKG." ".vercel/output/functions/api/server.func/node_modules/@img/$PKG_NAME/"
      done
    fi
  done
  # Also copy detect-libc (required by Sharp for platform detection)
  for DLIBC in node_modules/.pnpm/detect-libc*/node_modules/detect-libc; do
    [ -d "$DLIBC" ] && mkdir -p ".vercel/output/functions/api/server.func/node_modules/detect-libc" && cp -r "$DLIBC/." ".vercel/output/functions/api/server.func/node_modules/detect-libc/" && break
  done
fi
echo "[build] Done."
