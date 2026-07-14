# Deployment verification

Verification date: 2026-07-13.

## Pipeline preservation

Phase 2 retains the working source's single production pipeline without modification:

- one root `Dockerfile`
- one root `compose.yaml`
- one gateway template at `infrastructure/gateway/nginx.conf.template`
- PostgreSQL, Redis, setup, API, worker, and gateway services only

The Dockerfile, Compose file, gateway infrastructure, API, worker, database infrastructure, and Vite proxy files were compared byte for byte with the supplied working source.

## Static verification completed

- Repository tests confirm that the gateway owns `/`, `/admin/`, `/overlay/`, and `/api/` and retains WebSocket upgrade forwarding.
- Compose parsed successfully as YAML with the six expected services.
- All operational scripts passed `bash -n`.
- Environment variables in `.env.example` remain documented in `docs/DEPLOYMENT.md`.
- Backup checksum generation, restore checksum verification, unsafe archive-path rejection, migration setup, and idempotent seed safeguards remain present.
- Repository tests reject duplicate deployment files, source-mounted production services, runtime package installation, recovery services, committed secrets, and generated build output.

## Offline limitation

The pinned pnpm release and locked package tree were not available locally, and registry DNS was unavailable. A full workspace build, `docker compose config`, image construction, container health checks, and public service startup were therefore not executed for this Phase 2 archive. The prior Sprint 1 package's working status is not presented as a fresh Phase 2 build result.

Before deployment, run:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run verify
bash scripts/verify.sh
```

The final command performs Docker-aware checks when Docker is available. Live Twitch OAuth, StreamElements debit and compensation behavior, Certbot issuance, WebSocket delivery through the public gateway, responsive browser review, and OBS transparency must be verified with the target environment and real credentials.
