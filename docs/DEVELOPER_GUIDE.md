# Developer guide

## Requirements

Use Node.js 22.16 or newer and npm 10.9 or newer. npm is the only package manager for this repository.

```bash
npm ci
npm run test
npm run build
```

`package-lock.json` is canonical. Do not add pnpm or Yarn metadata.

## Development services

Production always uses `compose.yaml`. During source development, applications may run directly against disposable PostgreSQL and Redis instances using a local `.env`. This is a development workflow, not another deployment method.

```bash
npm run dev -w @neon-wreckers/api
npm run dev -w @neon-wreckers/worker
npm run dev -w @neon-wreckers/web
npm run dev -w @neon-wreckers/admin
npm run dev -w @neon-wreckers/overlay
```

Every Vite client uses same-origin `/api` requests. Its checked-in development proxy forwards that path to `http://127.0.0.1:8787`, so no client-specific API URL variable exists. Local sign-in uses a real Twitch development application and callback; synthetic identities are not supported.

## Repository boundaries

- `apps/` owns deployable processes and browser applications.
- `packages/game-engine/` owns deterministic mechanics and accepts content through explicit inputs.
- `packages/content/` owns source-controlled JSON loading, validation, and typed exports.
- `packages/integrations/` owns external provider HTTP and Redis connection parsing.
- `packages/browser-client/` owns browser API envelopes and error handling.
- `packages/client-theme/` owns the unchanged shared player/admin stylesheet.
- `content/` and `assets/manifest.json` are the canonical data and visual-key sources.
- `infrastructure/` owns schema, migrations, and gateway configuration.

An application may depend on a package. Packages must not import application source. Browser applications must not become authoritative for costs, rewards, probability, cooldowns, inventory mutation, or station mutation.

## Database changes

1. Edit `infrastructure/database/prisma/schema.prisma`.
2. Create a named SQL migration under `infrastructure/database/migrations`.
3. Keep schema and migration enums, models, relations, defaults, and indexes aligned.
4. Verify the migration against an empty database and an upgraded database.
5. Keep seed behavior idempotent and safe for existing production data.
6. Run all quality gates.

Never replace migration history with a comment, use `db push` for production, or depend on generated client files committed to the repository.

State-changing operations that can race must serialize at the database boundary. Existing examples use PostgreSQL advisory transaction locks, conditional updates, and status transitions. A read followed by an unconditional write is not sufficient for inventory, wreck, expedition, or content-version mutations.

## API changes

Routes are grouped by domain in `apps/api/src/routes`. Shared behavior belongs in `apps/api/src/services` or `apps/api/src/lib`. A route must not call another route through HTTP or `app.inject`; both routes should call the same service.

Successful API responses use `{ data, requestId }`, except health-style endpoints. Errors use `{ error: { code, message }, requestId }`. Logs include the same request ID. Input from environment, path, query, headers, and body must be validated before use.

Authentication uses signed OAuth state and session cookies backed by hashed database session tokens. Do not retain Twitch access or refresh tokens unless a reviewed feature requires them and includes a documented storage and rotation design.

## Game rules and content

Sprint 1 preserves effective mechanics and balance. Rule changes belong in `packages/game-engine/src/core.mjs` and require deterministic tests. Runtime tuning already represented in content must be read from the canonical content file rather than duplicated in route code.

For content changes, edit `content/base`, update `assets/manifest.json` for each visual key, and keep the schemas in `packages/content/src/index.mjs` aligned, then run:

```bash
npm run test:content
```

Validation enforces JSON structure, unique slugs, cross-file references, used visual keys, initial-station references, wreck ranges, lifecycle values, season windows, and positive balance values.

## Dependency changes

Use exact versions. Add a package only to the workspace that imports it. Run `npm install --save-exact` or `npm install --save-dev --save-exact`, inspect the lockfile, run the full verification suite, run `npm audit --omit=dev`, and update `docs/DEPENDENCY_AUDIT.md` with the package purpose.

## Quality gates

```bash
npm run test:engine
npm run test:api
npm run test:content
npm run test:dependencies
npm run test:repository
npm run build
bash -n scripts/*.sh
bash scripts/verify.sh
```

Repository tests protect the single deployment pipeline and reject recovery copies, generated build artifacts, committed secrets, extra lockfiles, unfinished markers, undocumented variables, unsafe route drift, schema/migration drift, and removed mock or token-retention code.
