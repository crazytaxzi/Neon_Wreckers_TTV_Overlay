#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"
[[ -f .env ]] || { echo ".env is missing." >&2; exit 1; }
set -a
# shellcheck disable=SC1091
source .env
set +a

STAMP=$(date -u +%Y%m%dT%H%M%SZ)
RETENTION=${BACKUP_RETENTION_DAYS:-14}
[[ $RETENTION =~ ^[1-9][0-9]*$ ]] || { echo "BACKUP_RETENTION_DAYS must be a positive integer." >&2; exit 1; }
WORK_DIR="backups/.work-$STAMP"
ARCHIVE="backups/neon-wreckers-$STAMP.tar.gz"
mkdir -p "$WORK_DIR/config"
chmod 700 backups "$WORK_DIR"
trap 'rm -rf "$WORK_DIR"' EXIT

docker compose exec -T postgres pg_dump \
  --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --format=custom \
  > "$WORK_DIR/database.pgdump"
cp .env "$WORK_DIR/config/environment.env"
cp -R content "$WORK_DIR/config/content"
cp -R assets "$WORK_DIR/config/assets"
mkdir -p "$WORK_DIR/config/overlay"
cp apps/overlay/public/overlay-config.json "$WORK_DIR/config/overlay/overlay-config.json"
(
  cd "$WORK_DIR"
  find database.pgdump config -type f -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
)
chmod -R go-rwx "$WORK_DIR"
tar -czf "$ARCHIVE" -C backups ".work-$STAMP"
chmod 600 "$ARCHIVE"
find backups -maxdepth 1 -type f -name 'neon-wreckers-*.tar.gz' -mtime "+$RETENTION" -delete
printf 'Backup created: %s\n' "$ARCHIVE"
