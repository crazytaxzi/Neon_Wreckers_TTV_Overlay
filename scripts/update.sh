#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"
[[ -f .env ]] || { echo ".env is missing." >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source .env
set +a

if [[ ${1:-} == "--certificate-only" ]]; then
  trap 'docker compose up -d gateway >/dev/null 2>&1 || true' EXIT
  certbot renew --quiet \
    --pre-hook "docker compose stop gateway" \
    --post-hook "docker compose up -d gateway"
  docker compose up -d gateway
  trap - EXIT
  exit 0
fi

scripts/backup.sh
docker compose config --quiet
docker compose build
docker compose rm -sf setup >/dev/null 2>&1 || true
docker compose up -d --remove-orphans
docker image prune -f >/dev/null
curl --fail --silent --show-error --retry 30 --retry-delay 2 "https://${PUBLIC_HOST}/health" >/dev/null
printf 'Update complete: https://%s/\n' "$PUBLIC_HOST"
