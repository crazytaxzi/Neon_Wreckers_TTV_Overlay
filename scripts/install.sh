#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "Run this installer as root: sudo bash scripts/install.sh" >&2
  exit 1
fi

[[ -f /etc/os-release ]] || { echo "Unable to identify the operating system." >&2; exit 1; }
# shellcheck disable=SC1091
source /etc/os-release
[[ ${ID:-} == "ubuntu" && ${VERSION_ID:-} == "24.04" ]] || {
  echo "The supported production host is Ubuntu 24.04 LTS." >&2
  exit 1
}

[[ -f .env ]] || { echo "Create .env from .env.example before installing." >&2; exit 1; }
chmod 600 .env
set -a
# shellcheck disable=SC1091
source .env
set +a

required=(PUBLIC_HOST ACME_EMAIL PUBLIC_WEB_URL CORS_ORIGINS POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB REDIS_PASSWORD DATABASE_URL REDIS_URL SESSION_SECRET TWITCH_CLIENT_ID TWITCH_CLIENT_SECRET TWITCH_REDIRECT_URI STREAMER_TWITCH_ID)
for name in "${required[@]}"; do
  [[ -n ${!name:-} ]] || { echo "Missing required environment variable: $name" >&2; exit 1; }
done

hostname_pattern='^([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?$'
[[ $PUBLIC_HOST =~ $hostname_pattern ]] || {
  echo "PUBLIC_HOST must be a fully qualified DNS hostname without a scheme, port, or path." >&2
  exit 1
}
[[ ${PUBLIC_WEB_URL%/} == "https://${PUBLIC_HOST}" ]] || { echo "PUBLIC_WEB_URL must be https://${PUBLIC_HOST}." >&2; exit 1; }
[[ $TWITCH_REDIRECT_URI == "https://${PUBLIC_HOST}/api/v1/auth/twitch/callback" ]] || { echo "TWITCH_REDIRECT_URI does not match PUBLIC_HOST." >&2; exit 1; }
[[ ${#SESSION_SECRET} -ge 32 ]] || { echo "SESSION_SECRET must contain at least 32 characters." >&2; exit 1; }
[[ ${NODE_ENV:-} == "production" ]] || { echo "NODE_ENV must be production." >&2; exit 1; }
[[ ${TRUST_PROXY:-} == "true" ]] || { echo "TRUST_PROXY must be true." >&2; exit 1; }
[[ ${COOKIE_SECURE:-} == "true" ]] || { echo "COOKIE_SECURE must be true." >&2; exit 1; }
[[ ${BACKUP_RETENTION_DAYS:-} =~ ^[1-9][0-9]*$ ]] || { echo "BACKUP_RETENTION_DAYS must be a positive integer." >&2; exit 1; }
[[ ${IMAGE_TAG:-} =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || { echo "IMAGE_TAG contains unsupported characters." >&2; exit 1; }
if grep -Eq 'replace-with|example\.com' .env; then
  echo ".env still contains example values." >&2
  exit 1
fi

if [[ ${FEATURE_POINTS_ACTIONS:-false} == "true" ]]; then
  [[ ${STREAMELEMENTS_PROVIDER:-disabled} == "streamelements" ]] || { echo "FEATURE_POINTS_ACTIONS requires STREAMELEMENTS_PROVIDER=streamelements." >&2; exit 1; }
  [[ -n ${STREAMELEMENTS_CHANNEL_ID:-} ]] || { echo "STREAMELEMENTS_CHANNEL_ID is required when point actions are enabled." >&2; exit 1; }
  [[ -n ${STREAMELEMENTS_JWT:-} ]] || { echo "STREAMELEMENTS_JWT is required when point actions are enabled." >&2; exit 1; }
fi

install_docker() {
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat > /etc/apt/sources.list.d/docker.sources <<DOCKER_REPOSITORY
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
DOCKER_REPOSITORY
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
}

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  install_docker
fi
if ! command -v certbot >/dev/null 2>&1; then
  apt-get update
  DEBIAN_FRONTEND=noninteractive apt-get install -y certbot
fi

docker info >/dev/null
docker compose config --quiet

if [[ ! -s "/etc/letsencrypt/live/${PUBLIC_HOST}/fullchain.pem" ]]; then
  certbot certonly --non-interactive --agree-tos --email "$ACME_EMAIL" --standalone -d "$PUBLIC_HOST"
fi

docker compose up -d --build --remove-orphans

cat > /etc/systemd/system/neon-wreckers-certificate.service <<SERVICE
[Unit]
Description=Renew the Neon Wreckers TLS certificate
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$ROOT_DIR
ExecStart=$ROOT_DIR/scripts/update.sh --certificate-only
SERVICE

cat > /etc/systemd/system/neon-wreckers-certificate.timer <<'TIMER'
[Unit]
Description=Check the Neon Wreckers TLS certificate twice daily

[Timer]
OnBootSec=20min
OnUnitActiveSec=12h
RandomizedDelaySec=20min
Persistent=true

[Install]
WantedBy=timers.target
TIMER

cat > /etc/systemd/system/neon-wreckers-backup.service <<SERVICE
[Unit]
Description=Back up Neon Wreckers
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=$ROOT_DIR
ExecStart=$ROOT_DIR/scripts/backup.sh
SERVICE

cat > /etc/systemd/system/neon-wreckers-backup.timer <<'TIMER'
[Unit]
Description=Create a daily Neon Wreckers backup

[Timer]
OnCalendar=*-*-* 04:17:00
RandomizedDelaySec=20min
Persistent=true

[Install]
WantedBy=timers.target
TIMER

systemctl daemon-reload
systemctl enable --now neon-wreckers-certificate.timer neon-wreckers-backup.timer

curl --fail --silent --show-error --retry 30 --retry-delay 2 "https://${PUBLIC_HOST}/health" >/dev/null
curl --fail --silent --show-error --retry 30 --retry-delay 2 "https://${PUBLIC_HOST}/ready" >/dev/null
printf 'Neon Wreckers is online at https://%s/\n' "$PUBLIC_HOST"
