# Deployment verification

Verification date: 2026-07-12.

## Pipeline inventory

The release contains exactly one root `Dockerfile`, one root `compose.yaml`, and one gateway template at `infrastructure/gateway/nginx.conf.template`. Compose contains only PostgreSQL, Redis, setup, API, worker, and gateway services.

Repository tests confirm that the gateway serves `/`, `/admin/`, `/overlay/`, and `/api/`, and that `/api/` forwards WebSocket upgrade headers. Compose contains no source mounts, runtime package installation, MinIO service, recovery service, or alternate gateway.

## Static verification completed

- `compose.yaml` parsed successfully as YAML and exposed the six expected services.
- All operational shell scripts passed `bash -n` syntax validation.
- Environment variables in `.env.example` are covered by `docs/DEPLOYMENT.md`.
- The Dockerfile uses one multi-stage application build and one gateway target with exact base image tags.
- Backup writes checksums; restore verifies checksums and rejects unsafe archive paths.
- Setup applies migrations and the idempotent seed before API and worker startup.

## Build verification completed

The integrations package, database seed, API, worker, player web app, admin app, and overlay all built successfully from the locked npm workspace on Node.js 22.16.0.

## Host-dependent verification

A Docker daemon was not available in the cleanup environment, so `docker compose config`, image construction, container health checks, public TLS issuance, and live service startup could not be executed here. The included `scripts/verify.sh` runs Compose configuration and both image builds automatically when Docker is present. The target host must complete that command before release.

Live Twitch OAuth, StreamElements debit/refund behavior, Certbot issuance, and OBS rendering require production credentials and external services. Those checks must be performed on the deployment host without committing or exporting the credentials.

The source pipeline passed every executable static and build check available in the cleanup environment. Container and external-service verification remains an explicit host release gate rather than an inferred success.
