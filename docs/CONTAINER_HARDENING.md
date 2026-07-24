# Container and Secret Hardening

The root `compose.yaml` remains the only supported production deployment model.

## Redis credentials

`REDIS_PASSWORD` remains in the protected host `.env`. The install and update scripts materialize it into the ignored `.secrets/redis_password` runtime file before invoking Docker Compose. Compose mounts that file at `/run/secrets/redis_password`, which is compatible with the Redis service's read-only root filesystem. The Redis image reads the mounted file at startup, writes a mode-0600 configuration into the container tmpfs, and starts Redis with the configuration path only. The password is therefore absent from Redis process arguments.

The host `.secrets` directory is mode 0700 and excluded from both Git and the Docker build context. The materialized file is mode 0444 because file-backed Compose secrets use a bind mount and the unprivileged `redis` user must be able to read the mounted file. Host access remains restricted by the parent directory.

The health check uses the same mounted secret through `REDISCLI_AUTH`; it does not use `redis-cli -a` and does not place the credential in the health-check command string.

Operators must continue to keep `.env` outside source control and restrict its host permissions. Rotate `REDIS_PASSWORD` before deploying this change if the current value has ever appeared in logs, shell history, support bundles, or process listings.

## Service controls

| Service | Controls |
| --- | --- |
| `setup` | non-root `node`, read-only root filesystem, `/tmp` tmpfs, all capabilities dropped, no-new-privileges, init process, 30-second stop grace, rotated logs, CPU and memory limits |
| `api` | same application controls as `setup`; only port 8787 is exposed to the internal network |
| `worker` | same application controls as `setup`; no published ports |
| `redis` | dedicated image, non-root `redis`, secret-file authentication, read-only root filesystem, explicit `/data` volume, `/tmp` tmpfs, all capabilities dropped, no-new-privileges, rotated logs, CPU and memory limits |
| `postgres` | explicit data volume and runtime tmpfs paths, no-new-privileges, 60-second stop grace, rotated logs, CPU and memory limits |
| `gateway` | read-only root filesystem, explicit tmpfs paths required by nginx startup/runtime, TLS mount read-only, bounded capabilities, no-new-privileges, rotated logs, CPU and memory limits |

PostgreSQL retains its normal image entrypoint and startup privileges because it must initialize and repair ownership of a new data volume. The gateway retains only the capabilities needed to bind ports 80/443 and drop privileges to nginx workers. These exceptions are narrower than running with Docker's default capability set.

## Upgrade procedure

1. Confirm `.env` contains a non-empty `REDIS_PASSWORD` and is readable only by the deployment account.
2. Pull the release and run `sudo bash scripts/update.sh`. The script refreshes `.secrets/redis_password` before Compose validation and startup.
3. Confirm `postgres` and `redis` become healthy, `setup` exits successfully, then `api`, `worker`, and `gateway` become healthy.
4. Verify Redis process arguments do not contain the password with the host's process inspection tooling.
5. Verify backup, restore, certificate renewal, API readiness, and worker queue processing in the deployment environment.

For manual recovery after images have already been built, source `.env`, run `materialize_runtime_secrets` from `scripts/materialize-secrets.sh`, and then run `docker compose up -d --remove-orphans`.

## Validation boundary

CI validates the Compose model, builds production images, runs repository invariants, and executes `pnpm verify`. It does not prove host-level certificate paths, production resource sizing, backup storage, external OAuth credentials, or real service availability. CPU and memory limits are conservative starting points and should be tuned from observed production metrics rather than removed.
