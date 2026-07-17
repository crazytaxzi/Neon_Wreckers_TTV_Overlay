# Architecture guide

## System boundary

The API is authoritative for identity, station state, cooldowns, rewards, inventory, construction, expeditions, loyalty transactions, and administration. Browser clients render state and request actions. They do not select loot, calculate success, set prices, or mutate durable game state directly.

```text
Browser / OBS
     |
     v
Nginx gateway
  |       |
static   /api and WebSocket
          |
          v
       Fastify API ---- PostgreSQL
          |
          +---- Redis / BullMQ ---- Worker
          |
          +---- Twitch and StreamElements adapters
```

## Runtime applications

`apps/web` is the player-facing React application. `apps/admin` is the streamer control center. `apps/overlay` is the transparent OBS browser source. All three are static Vite builds served by the gateway.

`apps/api` is a Fastify service. Route modules are thin HTTP adapters grouped by domain. Shared persistence and game operations live in services and libraries. Salvage operations are shared by normal, admin, and point-funded routes without calling the HTTP server internally.

`apps/worker` consumes one supported delayed BullMQ job, `resolve-expedition`. It resolves only active records, updates state atomically, creates the return notification in the same transaction, and rejects unknown job names.

## Packages

`packages/game-engine` contains deterministic rules with no database, filesystem, content, or network dependency. Wrecks, items, balance, and initial state are injected by callers.

`packages/content` validates and exposes the canonical items, wrecks, modules, initial station, balance, and expedition definitions. The API, worker, database seed, and engine tests consume the same exports.

`packages/integrations` contains Twitch, StreamElements, and Redis adapters. Provider-specific protocol details, timeouts, and error messages stay outside route modules.

`packages/browser-client` contains same-origin API request and error-envelope handling shared by web, admin, and overlay.

`packages/ui` contains the shared React components, semantic icons, theme tokens, responsive framework, motion, and accessibility behavior used by all browser surfaces. `packages/client-theme` is a compatibility stylesheet entry that forwards older imports to UI.

## Durable state and concurrency

PostgreSQL is the only durable runtime datastore. The Prisma schema is authoritative, and `infrastructure/database/prisma/migrations` contains deployable SQL history. Redis is transient queue infrastructure, not a second source of truth.

Database uniqueness protects Twitch identity, sessions, inventory stacks, content versions, and loyalty idempotency. PostgreSQL transaction advisory locks serialize operations that span multiple records:

- current-wreck scans and salvage runs;
- module construction plus player material deductions;
- first-login starter ship and crew creation;
- version-number allocation for an admin content slug.

Expedition resolution and claiming additionally use conditional status transitions so a worker, administrator, or repeated request cannot apply the same terminal action twice.

## Authentication and external providers

Twitch OAuth state and application sessions use signed, HTTP-only cookies. Session bearer values are random and stored only as SHA-256 hashes. Viewer provider tokens remain transient; the streamer's renewable EventSub authorization is stored with authenticated AES-256-GCM encryption.

Point-funded actions use the database `LoyaltyTransaction` record as the local idempotency and reconciliation source. A debit is attempted before gameplay execution. A post-debit gameplay failure triggers compensation; compensation failure is recorded as ambiguous for manual review.

## Gateway

The gateway has four public surfaces:

- `/` serves the player client.
- `/admin/` serves the admin client.
- `/overlay/` serves the OBS overlay.
- `/api/` proxies HTTP and WebSocket traffic to the API.

It terminates TLS, redirects HTTP to HTTPS, suppresses server version disclosure, forwards request identity headers, and preserves WebSocket upgrade headers.

## Configuration

Runtime environment configuration is parsed once in `apps/api/src/env.ts`. Canonical game content is parsed once per process by `@neon-wreckers/content`. Effective costs, wreck ranges, item metadata, expedition definitions, salvage cooldowns, construction progress rules, and initial station modules are not duplicated in application code. Frontend clients use same-origin `/api` paths, so client-specific API URL variables do not exist.

## Extension rules

New mechanics belong in `packages/game-engine` with deterministic tests. New external providers belong in `packages/integrations`. New persistent behavior requires a Prisma schema change and migration. New endpoints belong in a focused route module and call a domain service instead of another route. New visual keys must be added to `assets/manifest.json` before content references them. New reusable interface behavior belongs in `packages/ui`; app-local CSS is reserved for surface-specific composition.
