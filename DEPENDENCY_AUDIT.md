# Dependency audit

Audit date: 2026-07-12. All JavaScript package versions are exact and locked by `package-lock.json`.

## Audit result

The repository contains 10 active workspaces and 44 direct dependency declarations. `npm audit --omit=dev` reported 0 known vulnerabilities across all severities on 2026-07-12.

`npm outdated` and a per-major registry check found the retained major lines current for Fastify rate limiting, Prisma, Node type declarations, the Vite React plugin, TypeScript, Vite, and Zod. `lucide-react` has a newer 0.x release, but that line does not promise minor-version compatibility and can change rendered icon output, so it was deferred to preserve the artwork and UI. Available next-major migrations include `@fastify/rate-limit` 11, Prisma 7, Node type declarations 26, `@vitejs/plugin-react` 6, `lucide-react` 1, TypeScript 7, Vite 8, and Zod 4; all require a separate compatibility review.

## Root build dependencies

- `prisma` provides production migration commands and Prisma client generation.
- `typescript` compiles the integrations, database seed, API, worker, and React type checks.
- `tsx` runs TypeScript during development and executes TypeScript tests.
- `@types/node`, `@types/react`, and `@types/react-dom` provide compile-time declarations.

## API

- `fastify` is the HTTP server.
- `@fastify/cookie`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, and `@fastify/websocket` provide cookies, origin controls, security headers, rate limiting, and WebSockets.
- `@prisma/client` is the database client.
- `bullmq` submits delayed expedition jobs.
- `zod` validates environment, path, query, header, and body input.
- `@neon-wreckers/content` provides validated canonical items, wrecks, modules, initial station, balance, and expedition definitions.
- `@neon-wreckers/game-engine` provides authoritative rules.
- `@neon-wreckers/integrations` provides Twitch, StreamElements, and Redis configuration adapters.

## Worker

- `bullmq` consumes expedition jobs.
- `@prisma/client` persists resolved outcomes and notifications.
- `@neon-wreckers/content` supplies canonical reward item definitions.
- `@neon-wreckers/game-engine` resolves expeditions.
- `@neon-wreckers/integrations` supplies shared Redis URL parsing.

## Shared packages

- `@neon-wreckers/content` uses `zod` to validate source-controlled JSON before exposing immutable definitions.
- `@neon-wreckers/game-engine` uses only Node built-ins at runtime. Its content package reference is development-only for deterministic tests.
- `@neon-wreckers/integrations` uses `undici` for server-side Twitch and StreamElements HTTP requests with explicit timeouts.
- `@neon-wreckers/browser-client` is dependency-free and centralizes browser request envelopes and errors.
- `@neon-wreckers/client-theme` contains the unchanged shared player/admin stylesheet and no JavaScript runtime.

## Browser applications

- `react` and `react-dom` render all three browser applications.
- `vite` and `@vitejs/plugin-react` build each browser application.
- `lucide-react` is used only by the player app for its existing iconography.
- The player, admin, and overlay consume only the shared workspace packages they import.

## Container dependencies

- `node:22.16.0-bookworm-slim` is the exact build and application runtime base.
- `nginx:1.27.5-alpine` is the exact gateway base.
- `postgres:16.10-alpine` is the exact database image.
- `redis:7.4.5-alpine` is the exact queue/cache image.

These tags are centralized in the root Dockerfile and Compose file. There are no alternate Dockerfiles or Compose definitions.

## Removed dependencies and packages

- Direct `ioredis` dependencies were removed because BullMQ owns the Redis client; connection parsing is shared without creating another client.
- Direct `pino` was removed because Fastify supplies logger integration.
- Direct API `undici` was removed because only the integrations package performs provider HTTP requests.
- `lucide-react` was removed from admin and overlay because neither imports it.
- The former unused `packages/game-config`, `packages/shared-types`, and `packages/ui` were removed. The active `@neon-wreckers/content` package is a new, consumed boundary with API, worker, seed, and test owners.
- MinIO and object-storage deployment components were removed because no application code used them.
- Synthetic Twitch identities and the process-local loyalty provider were removed rather than retained as runtime dependencies.

## Upgrade policy

Use exact versions. Review upgrades per workspace, update the lockfile with npm, run every automated suite and build, rerun the production vulnerability audit, and record the decision here. Major upgrades require an explicit compatibility pass; security upgrades still require the same release gates.
