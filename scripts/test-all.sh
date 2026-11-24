#!/usr/bin/env bash
# Every check. Must pass before AND after each change (see CONTRIBUTING.md).
#   scripts/test-all.sh            # everything
#   SKIP_E2E=1 scripts/test-all.sh # skip the browser tests
set -euo pipefail
cd "$(dirname "$0")/.."
e2e='echo; echo "== 6/6 e2e (iPhone 13 WebKit + Pixel 7 Chromium) =="; npx playwright test'
[ "${SKIP_E2E:-0}" = 1 ] && e2e='echo "(e2e skipped)"'
exec scripts/ct.sh '
  set -e
  echo "== 1/6 typecheck =="
  npx tsc --noEmit
  echo "tsc: 0 errors"
  echo; echo "== 2/6 lint =="
  npx eslint .
  npx prettier --check . >/dev/null
  echo "eslint + prettier: clean"
  echo; echo "== 3/6 unit + coverage ==";  npx vitest run --coverage
  echo; echo "== 4/6 Firebase rules + sync (emulators) =="
  if npm run -s test:emulator >/tmp/emulator.log 2>&1; then
    grep -E "✓|Test Files|Tests  " /tmp/emulator.log | grep -v "^i "
  else
    cat /tmp/emulator.log; exit 1
  fi
  echo; echo "== 5/6 build =="; npx vite build
  '"$e2e"
