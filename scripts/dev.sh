#!/usr/bin/env bash
# Dev server at http://localhost:5173/hostbook/ (also reachable from your phone on the LAN).
exec env PORTS=5173:5173 "$(dirname "$0")/ct.sh" npx vite --host 0.0.0.0
