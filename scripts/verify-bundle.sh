#!/bin/bash
# Post-build guard: fail if the generated Vercel function handler contains
# any runtime references to internal project modules.
# These should be ZERO after esbuild bundles everything at build time.
set -e

HANDLER="${1:-.vercel/output/functions/api/server.func/index.mjs}"

if [ ! -f "$HANDLER" ]; then
  echo "ERROR: Handler not found: $HANDLER"
  exit 1
fi

echo "[verify] Checking $HANDLER for internal runtime imports..."

FAIL=0

# Patterns that must NOT appear as runtime imports (not comments)
# We check for import() calls or string literals containing internal paths
# esbuild source comments are "// path" - we exclude those

check_pattern() {
  local pattern="$1"
  local desc="$2"
  # Search for the pattern but exclude comment lines (starting with //)
  local matches
  matches=$(grep -n "$pattern" "$HANDLER" | grep -v "^[0-9]*:[[:space:]]*//" | grep -v "^[0-9]*:[[:space:]]*/\*" | head -5)
  if [ -n "$matches" ]; then
    echo "FAIL: Found internal runtime import pattern '$desc':"
    echo "$matches"
    FAIL=1
  fi
}

# Check for dynamic import() calls with internal paths
check_pattern 'import("\.\./server' 'dynamic import of ../server'
check_pattern "import('\.\./server" "dynamic import of ../server (single quote)"
check_pattern 'import("\.\./shared' 'dynamic import of ../shared'
check_pattern 'import("\.\/routers' 'dynamic import of ./routers'
check_pattern 'import("\.\/server' 'dynamic import of ./server'

# Check for string literals that look like internal module paths
# (these would appear in require() or import() calls)
check_pattern '"\.\.\/server\/' 'string literal ../server/'
check_pattern '"\.\.\/shared\/' 'string literal ../shared/'
check_pattern '"/var/task/server' 'absolute path /var/task/server'
check_pattern '"/var/task/shared' 'absolute path /var/task/shared'

if [ $FAIL -eq 0 ]; then
  echo "[verify] PASS: No internal runtime imports found in bundle."
  echo "[verify] Bundle size: $(wc -c < "$HANDLER") bytes"
  echo "[verify] Dynamic imports (external only):"
  grep -n "import(" "$HANDLER" | sed 's/^/  /' | head -10
else
  echo "[verify] FAIL: Internal runtime imports found. Fix before deploying."
  exit 1
fi
