# Dependency audit

Audit date: 2026-07-13. JavaScript versions are exact and locked by `pnpm-lock.yaml`.

## Phase 2 result

The repository contains 11 active workspaces and 51 direct dependency, development-dependency, and peer-dependency declarations. `node tools/audit-dependencies.mjs` verifies that each source import is owned by the importing workspace, CSS package imports are declared, versions are pinned, root dependencies are documented, and unused declarations are rejected.

A registry-backed vulnerability scan was not rerun during this offline UI rebuild. The current source lockfile and backend dependency versions were preserved; Phase 2 adds no new registry package. `lucide-react` already existed in the working source and is now owned by `@neon-wreckers/ui` rather than the player app.

## Root build dependencies

- `prisma` provides migration and Prisma client generation commands.
- `@prisma/client` is the generated database client runtime.
- `typescript` compiles packages, infrastructure, services, workers, and browser type checks.
- `tsx` runs TypeScript development processes and tests.
- `@types/node`, `@types/react`, and `@types/react-dom` provide compile-time declarations.
- `@neon-wreckers/game-engine` and `@neon-wreckers/content` support root migration, seed, and verification workflows.

## API and worker

The API owns `fastify`, `@fastify/cookie`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/websocket`, `@prisma/client`, `bullmq`, `zod`, canonical content, deterministic game rules, and provider integrations. The worker owns `bullmq`, `@prisma/client`, canonical content, deterministic game rules, and shared integration configuration. Phase 2 does not change these declarations.

## Shared packages

- `@neon-wreckers/content` uses `zod` to validate canonical JSON.
- `@neon-wreckers/game-engine` uses Node built-ins at runtime and references content only for deterministic tests.
- `@neon-wreckers/integrations` uses `undici` for bounded provider HTTP requests.
- `@neon-wreckers/browser-client` is dependency-free and centralizes browser response envelopes.
- `@neon-wreckers/ui` uses `lucide-react` and declares React and React DOM as exact peer dependencies.
- `@neon-wreckers/client-theme` depends on UI because its stylesheet forwards legacy imports to the shared package.

## Browser applications

The player, admin, and overlay applications declare `react`, `react-dom`, Vite, the Vite React plugin, browser client, and UI package only where imported. Direct icon-library ownership was removed from the player app because semantic icons are now supplied by the UI package.

## Container dependencies

The root Dockerfile and Compose file remain the only production pipeline. Their pinned Node, Nginx, PostgreSQL, and Redis images are unchanged by Phase 2.

## Upgrade policy

Use exact versions and the canonical pnpm lockfile. Add a dependency only to the workspace that imports it. Run dependency ownership checks, the full verification suite, production builds, and a registry-backed vulnerability audit before release. Major upgrades require an explicit compatibility review.
