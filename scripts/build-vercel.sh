#!/bin/bash
# Vercel Build Output API script
# Source: api/server.ts (maintainable)
# Generated: .vercel/output/functions/api/server.func/index.js (gitignored)
set -e

echo "[build] Building Vite frontend..."
npx vite build

echo "[build] Creating .vercel/output structure..."
rm -rf .vercel/output
mkdir -p .vercel/output/static
mkdir -p .vercel/output/functions/api/server.func

echo "[build] Copying frontend to .vercel/output/static..."
cp -r dist/public/. .vercel/output/static/

echo "[build] Bundling api/server.ts with esbuild..."
npx esbuild api/server.ts \
  --platform=node \
  --format=esm \
  --bundle \
  --external:sharp \
  --external:@vercel/blob \
  --external:pdf-lib \
  --external:docx \
  --external:pg \
  --external:express \
  --external:stripe \
  --external:@auth/express \
  --external:@auth/drizzle-adapter \
  --external:drizzle-orm \
  --external:@trpc/server \
  --external:zod \
  --external:superjson \
  --external:nanoid \
  --external:dotenv \
  --external:@aws-sdk/client-s3 \
  --external:@aws-sdk/s3-request-presigner \
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
    { "src": "^/api(/.*)?$", "dest": "/api/server" },
    { "src": "^/assets/(.*)$", "dest": "/assets/$1" },
    { "src": "^/(.*\\.(js|css|png|svg|ico|json|txt|xml|woff|woff2|ttf|eot))$", "dest": "/$1" },
    { "src": "^/(.*)$", "dest": "/index.html" }
  ]
}
CFGEOF

echo "[build] Done. Static: $(ls .vercel/output/static | wc -l) files. Function: $(wc -c < .vercel/output/functions/api/server.func/index.mjs) bytes"
