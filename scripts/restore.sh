#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

ARCHIVE=${1:-}
CONFIRM=${2:-}
RESTORE_ENV=${3:-}
[[ -n $ARCHIVE && -f $ARCHIVE ]] || { echo "Usage: scripts/restore.sh BACKUP.tar.gz --confirm [--restore-env]" >&2; exit 1; }
[[ $CONFIRM == "--confirm" ]] || { echo "Restore replaces the live database and source-controlled content. Re-run with --confirm." >&2; exit 1; }
[[ -z $RESTORE_ENV || $RESTORE_ENV == "--restore-env" ]] || { echo "Unknown restore option: $RESTORE_ENV" >&2; exit 1; }
[[ -f .env ]] || { echo ".env is missing." >&2; exit 1; }

WORK_DIR=$(mktemp -d "$ROOT_DIR/restore-work.XXXXXX")
trap 'rm -rf "$WORK_DIR"' EXIT
if tar -tzf "$ARCHIVE" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  echo "Backup archive contains an unsafe path." >&2
  exit 1
fi
tar -xzf "$ARCHIVE" -C "$WORK_DIR" --strip-components=1
(
  cd "$WORK_DIR"
  sha256sum -c SHA256SUMS
)

for required in database.pgdump config/environment.env config/content config/assets config/overlay/overlay-config.json; do
  [[ -e "$WORK_DIR/$required" ]] || { echo "Backup is missing $required." >&2; exit 1; }
done

if [[ $RESTORE_ENV == "--restore-env" ]]; then
  mkdir -p backups
  ENV_SNAPSHOT="backups/environment-before-restore-$(date -u +%Y%m%dT%H%M%SZ).env"
  cp .env "$ENV_SNAPSHOT"
  chmod 600 "$ENV_SNAPSHOT"
  cp "$WORK_DIR/config/environment.env" .env
  chmod 600 .env
fi

set -a
# shellcheck disable=SC1091
source .env
set +a
[[ $POSTGRES_DB =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || { echo "POSTGRES_DB contains unsafe characters." >&2; exit 1; }

docker compose stop setup api worker gateway >/dev/null 2>&1 || true
docker compose up -d postgres redis
until docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d postgres >/dev/null 2>&1; do sleep 2; done

docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
  -c "DROP DATABASE IF EXISTS \"$POSTGRES_DB\";" \
  -c "CREATE DATABASE \"$POSTGRES_DB\";"
docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner < "$WORK_DIR/database.pgdump"

rm -rf content assets
cp -R "$WORK_DIR/config/content" content
cp -R "$WORK_DIR/config/assets" assets
cp "$WORK_DIR/config/overlay/overlay-config.json" apps/overlay/public/overlay-config.json

docker compose rm -f setup >/dev/null 2>&1 || true
docker compose up -d --build --remove-orphans
printf 'Restore complete from %s\n' "$ARCHIVE"
