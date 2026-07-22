#!/bin/sh
set -eu

secret_file="${REDIS_PASSWORD_FILE:-/run/secrets/redis_password}"

read_secret() {
  if [ ! -r "$secret_file" ]; then
    echo "Redis password secret is not readable: $secret_file" >&2
    exit 1
  fi

  password="$(cat "$secret_file")"
  if [ -z "$password" ]; then
    echo "Redis password secret is empty" >&2
    exit 1
  fi
}

case "${1:-server}" in
  server)
    read_secret
    umask 077
    config_file="/tmp/redis.conf"
    cat > "$config_file" <<EOF
appendonly yes
requirepass $password
EOF
    exec redis-server "$config_file"
    ;;
  healthcheck)
    read_secret
    REDISCLI_AUTH="$password" exec redis-cli ping
    ;;
  *)
    echo "Unknown Redis entrypoint mode: $1" >&2
    exit 64
    ;;
esac
