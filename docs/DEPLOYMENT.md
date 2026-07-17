# Deployment guide

## Supported production method

Neon Wreckers has one supported production deployment: the root `compose.yaml`, built from the root `Dockerfile`, on an Ubuntu 24.04 LTS host with a public hostname and TLS. The scripts in `scripts/` are the supported operational entry points.

The stack contains PostgreSQL, Redis, a one-shot migration and seed service, the API, the worker, and the Nginx gateway. There is no alternate Compose file, recovery installer, mutable source mount, container-commit workflow, or overlay-specific deployment.

The application build uses `node:22.16.0-bookworm-slim`; the gateway uses `nginx:1.27.5-alpine`; Compose uses `postgres:16.10-alpine` and `redis:7.4.5-alpine`. Application images receive the deterministic `IMAGE_TAG` from `.env`.

## Host preparation

Point the production hostname at the host, allow inbound TCP 80 and 443, and keep outbound HTTPS available for operating-system packages, container images, Twitch, StreamElements, and certificate issuance.

```bash
git clone <your-private-repository> neon-wreckers
cd neon-wreckers
cp .env.example .env
chmod 600 .env
```

Replace every example value. Generate secrets with a password manager or an operating-system random source. The password embedded in `DATABASE_URL` must match `POSTGRES_PASSWORD`; the password embedded in `REDIS_URL` must match `REDIS_PASSWORD`.

Run:

```bash
sudo bash scripts/install.sh
```

The installer validates `.env`, installs Docker and Certbot when absent, validates Compose, builds the images, obtains the certificate, starts the stack, installs systemd timers for backups and certificate renewal, and verifies the public health endpoints.

## Environment reference

### Public identity

- `PUBLIC_HOST`: production DNS hostname used by Nginx and Certbot.
- `ACME_EMAIL`: certificate account and expiration contact.
- `PUBLIC_WEB_URL`: canonical player-app origin used after OAuth.
- `CORS_ORIGINS`: comma-separated browser origins permitted to send credentialed API requests.

### Runtime

- `NODE_ENV`: runtime mode. Production deployment requires `production`.
- `TRUST_PROXY`: enables Fastify proxy awareness behind Nginx. Production value is `true`.
- `COOKIE_SECURE`: restricts session cookies to HTTPS. Production value is `true`.
- `LOG_LEVEL`: Fastify/Pino log level.
- `RATE_LIMIT_MAX`: maximum requests per client within one rate-limit window.
- `RATE_LIMIT_WINDOW_SECONDS`: rate-limit window length in seconds.

### PostgreSQL

- `POSTGRES_USER`: database owner created by the PostgreSQL container.
- `POSTGRES_PASSWORD`: database password.
- `POSTGRES_DB`: application database name.
- `DATABASE_URL`: Prisma connection URL using host `postgres` inside Compose.

### Redis

- `REDIS_PASSWORD`: Redis authentication password.
- `REDIS_URL`: application Redis URL using host `redis` inside Compose.

### Sessions

- `SESSION_COOKIE_NAME`: browser session cookie name.
- `SESSION_SECRET`: at least 32 random bytes used to sign OAuth state and session cookies.

### Twitch

- `TWITCH_CLIENT_ID`: Twitch application client ID.
- `TWITCH_CLIENT_SECRET`: Twitch application client secret.
- `TWITCH_REDIRECT_URI`: exact HTTPS callback registered with Twitch, normally `https://PUBLIC_HOST/api/v1/auth/twitch/callback`.
- `TWITCH_REQUIRED_SCOPES`: space- or comma-separated OAuth scopes.
- `TWITCH_EVENTSUB_SECRET`: high-entropy 10–100 character secret shared with Twitch to verify EventSub webhook signatures.
- `CREDENTIAL_ENCRYPTION_KEY`: separate high-entropy secret used to encrypt the streamer's renewable Twitch authorization at rest.
- `STREAMER_TWITCH_ID`: immutable Twitch user ID that receives streamer and admin roles during sign-in.

### StreamElements

- `STREAMELEMENTS_PROVIDER`: `disabled` or `streamelements`.
- `STREAMELEMENTS_CHANNEL_ID`: broadcaster channel identifier.
- `STREAMELEMENTS_JWT`: broadcaster-owned API credential. It must never enter browser code, content, screenshots, or support bundles.
- `STREAMELEMENTS_API_BASE`: StreamElements API root.
- `FEATURE_POINTS_ACTIONS`: enables point-funded routes. Enabling it requires the StreamElements provider, channel ID, and JWT.

### Operations

- `BACKUP_RETENTION_DAYS`: positive integer controlling local backup retention.
- `IMAGE_TAG`: exact tag assigned to both locally built Neon Wreckers images.

## Update process

Pull or place the reviewed source revision on the host, then run from the repository root:

```bash
sudo bash scripts/update.sh
```

The update process validates configuration, creates a backup, validates Compose, rebuilds both image targets, applies migrations and the idempotent seed, replaces services, removes unused images, and checks the HTTPS health endpoints. It does not mutate running containers or install dependencies inside them.

## Backup process

```bash
sudo bash scripts/backup.sh
```

A backup contains a PostgreSQL custom-format dump, `.env`, canonical content, the asset manifest, and overlay configuration. SHA-256 checksums are stored inside the archive. Archives contain secrets and must be copied to encrypted storage with restricted access.

## Restore process

```bash
sudo bash scripts/restore.sh backups/neon-wreckers-YYYYMMDDTHHMMSSZ.tar.gz --confirm
```

Add `--restore-env` only when the archived environment should replace the current `.env`. Restore rejects unsafe archive paths, verifies checksums, stops stateful consumers, recreates the database, restores content and configuration, rebuilds images, starts the stack, and checks health.

## Service checks

```bash
docker compose ps
docker compose logs --tail=200 api worker gateway
curl --fail https://PUBLIC_HOST/health
curl --fail https://PUBLIC_HOST/ready
```

`/health` verifies the API process. `/ready` also verifies the database connection.

## Credential rotation

The imported pre-2.0 source contained committed environment files. Before the first 2.0 deployment, rotate PostgreSQL, Redis, session, Twitch, StreamElements, and any credentials that appeared in an earlier package. Do not reuse values from an earlier ZIP.

## Verification record

The release-specific static, build, and environment-dependent verification results are recorded in [DEPLOYMENT_VERIFICATION.md](DEPLOYMENT_VERIFICATION.md) and [TEST_REPORT.md](TEST_REPORT.md).
