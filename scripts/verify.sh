#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

npm ci --no-audit --no-fund
npm run verify
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  docker compose config --quiet
  docker compose build
else
  echo "Docker is unavailable; Compose configuration and image builds were not executed." >&2
fi
