#!/usr/bin/env bash
set -Eeuo pipefail

materialize_runtime_secrets() {
  local root_dir=${1:?repository root is required}
  local owner_uid=${SUDO_UID:-$(id -u)}
  local owner_gid=${SUDO_GID:-$(id -g)}
  local secret_dir="$root_dir/.secrets"
  local secret_file="$secret_dir/redis_password"
  local temp_file

  [[ -n ${REDIS_PASSWORD:-} ]] || {
    echo "REDIS_PASSWORD is missing." >&2
    return 1
  }

  install -d -m 0700 -o "$owner_uid" -g "$owner_gid" "$secret_dir"
  temp_file=$(mktemp "$secret_dir/.redis_password.XXXXXX")
  trap 'rm -f -- "${temp_file:-}"' RETURN

  printf '%s' "$REDIS_PASSWORD" > "$temp_file"
  chown "$owner_uid:$owner_gid" "$temp_file"
  chmod 0444 "$temp_file"
  mv -f "$temp_file" "$secret_file"

  trap - RETURN
}
