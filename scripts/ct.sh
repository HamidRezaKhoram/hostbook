#!/usr/bin/env bash
# Run a command inside the dev container (Node 22 + Chromium/WebKit + Java 21 for Firebase emulators).
# The host needs only podman (preferred) or docker. node_modules lives in a volume
# keyed on package.json + lockfile, so installs happen only when dependencies change.
#   scripts/ct.sh npm run build
#   PORTS=5173:5173 scripts/ct.sh npx vite --host 0.0.0.0
set -euo pipefail
cd "$(dirname "$0")/.."
CT=${CT:-$(command -v podman || command -v docker)}
PW_VERSION=1.49.1   # keep equal to @playwright/test in package.json
IMG=localhost/hostbook-dev:pw$PW_VERSION-jre21   # built from scripts/Containerfile on first use
"$CT" image inspect "$IMG" >/dev/null 2>&1 || "$CT" build -q -t "$IMG" -f scripts/Containerfile scripts >&2
lock=$( (cat package.json package-lock.json 2>/dev/null || true) | sha1sum | cut -c1-12)
args=(--rm --init --ipc=host -w /app -e CI="${CI:-}"
  -v "$PWD":/app:z -v "hostbook-nm-$lock":/app/node_modules -v hostbook-npm:/root/.npm
  -v hostbook-firebase-cache:/root/.cache/firebase -v hostbook-config:/root/.config)
if [ "$(basename "$CT")" = docker ]; then args+=(-u "$(id -u):$(id -g)" -e HOME=/tmp); fi
if [ -t 0 ] && [ -t 1 ]; then args+=(-it); fi
if [ -n "${PORTS:-}" ]; then args+=(-p "$PORTS"); fi
exec "$CT" run "${args[@]}" "$IMG" bash -c '
  if [ ! -f node_modules/.ok ]; then
    { [ -f package-lock.json ] && npm ci --no-audit --no-fund; } || npm install --no-audit --no-fund
    touch node_modules/.ok
  fi
  '"$*"
