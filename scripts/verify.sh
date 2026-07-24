#!/usr/bin/env bash
set -Eeuo pipefail
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"
# shellcheck disable=SC1091
source scripts/materialize-secrets.sh

npm ci --no-audit --no-fund
npm run verify
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  [[ -f .env ]] || { echo ".env is required for Compose verification." >&2; exit 1; }
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
  materialize_runtime_secrets "$ROOT_DIR"
  docker compose config --quiet
  docker compose build
else
  echo "Docker is unavailable; Compose configuration and image builds were not executed." >&2
fi
