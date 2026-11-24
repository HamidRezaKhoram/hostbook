#!/usr/bin/env bash
# Every check. Must pass before AND after each change (see CONTRIBUTING.md).
#   scripts/test-all.sh            # everything
#   SKIP_E2E=1 scripts/test-all.sh # skip the browser tests
set -euo pipefail
cd "$(dirname "$0")/.."
e2e='echo; echo "== 5/5 e2e (iPhone 13 WebKit + Pixel 7 Chromium) =="; npx playwright test'
[ "${SKIP_E2E:-0}" = 1 ] && e2e='echo "(e2e skipped)"'
exec scripts/ct.sh '
  set -e
  echo "== 1/5 typecheck =="
  npx tsc --noEmit
  echo "tsc: 0 errors"
  echo; echo "== 2/5 lint =="
  npx eslint .
  npx prettier --check . >/dev/null
  echo "eslint + prettier: clean"
  echo; echo "== 3/5 unit ==";  npx vitest run
  echo; echo "== 4/5 build =="; npx vite build
  '"$e2e"
