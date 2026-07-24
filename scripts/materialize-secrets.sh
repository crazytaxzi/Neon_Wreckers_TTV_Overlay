#!/usr/bin/env bash
set -Eeuo pipefail

materialize_runtime_secrets() {
  local root_dir=${1:?repository root is required}
  local owner_uid
  local owner_gid
  local secret_dir="$root_dir/.secrets"
  local secret_file="$secret_dir/redis_password"
  local temp_file

  [[ -n ${REDIS_PASSWORD:-} ]] || {
    echo "REDIS_PASSWORD is missing." >&2
    return 1
  }

  if [[ -f "$root_dir/.env" ]]; then
    owner_uid=$(stat -c '%u' "$root_dir/.env")
    owner_gid=$(stat -c '%g' "$root_dir/.env")
  else
    owner_uid=${SUDO_UID:-$(id -u)}
    owner_gid=${SUDO_GID:-$(id -g)}
  fi

  if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
    install -d -m 0700 -o "$owner_uid" -g "$owner_gid" "$secret_dir"
  else
    install -d -m 0700 "$secret_dir"
  fi

  temp_file=$(mktemp "$secret_dir/.redis_password.XXXXXX")
  trap 'rm -f -- "${temp_file:-}"' RETURN

  printf '%s' "$REDIS_PASSWORD" > "$temp_file"
  if [[ ${EUID:-$(id -u)} -eq 0 ]]; then
    chown "$owner_uid:$owner_gid" "$temp_file"
  fi
  chmod 0444 "$temp_file"
  mv -f "$temp_file" "$secret_file"

  trap - RETURN
}
