#!/usr/bin/env bash
# Test the database rules in the emulator, then deploy them to the live project named in .env.local.
# Needs a one-time scripts/firebase-login.sh first.
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env.local ] || { echo "Missing .env.local (copy .env.example and fill it in)"; exit 1; }
exec scripts/ct.sh 'set -a; . ./.env.local; set +a
  npm run -s test:emulator >/tmp/emulator.log 2>&1 || { cat /tmp/emulator.log; exit 1; }
  echo "rules tests: passed"
  npm run -s deploy:rules'
