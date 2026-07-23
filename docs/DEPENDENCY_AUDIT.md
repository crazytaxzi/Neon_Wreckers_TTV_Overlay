# Dependency audit

Audit date: 2026-07-23. JavaScript versions are exact and locked by `pnpm-lock.yaml`.

## Current result

The repository contains 11 active workspaces. `node tools/audit-dependencies.mjs` verifies that each source import is owned by the importing workspace, CSS package imports are declared, versions are pinned, root dependencies are documented, and unused workspace declarations are rejected.

Stage 10 adds exact, workspace-owned browser verification dependencies. Registry-backed dependency review runs on pull requests, while the lockfile remains the canonical reproducible dependency record.

## Root build and verification dependencies

- `prisma` provides migration and Prisma client generation commands.
- `@prisma/client` is the generated database client runtime.
- `typescript` compiles packages, infrastructure, services, workers, and browser type checks.
- `tsx` runs TypeScript development processes and tests.
- `@types/node`, `@types/react`, and `@types/react-dom` provide compile-time declarations.
- `@neon-wreckers/game-engine` and `@neon-wreckers/content` support root migration, seed, and verification workflows.
- `@playwright/test` owns deterministic Chromium browser integration and visual regression execution.
- `@axe-core/playwright` performs automated accessibility analysis inside Playwright pages.

## API and worker

The API owns `fastify`, `@fastify/cookie`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/websocket`, `@prisma/client`, `bullmq`, `zod`, canonical content, deterministic game rules, and provider integrations. The worker owns `bullmq`, `@prisma/client`, canonical content, deterministic game rules, and shared integration configuration.

## Shared packages

- `@neon-wreckers/content` uses `zod` to validate canonical JSON.
- `@neon-wreckers/game-engine` uses Node built-ins at runtime and references content only for deterministic tests.
- `@neon-wreckers/integrations` uses `undici` for bounded provider HTTP requests.
- `@neon-wreckers/browser-client` is dependency-free and centralizes browser response envelopes.
- `@neon-wreckers/ui` uses `lucide-react` and declares React and React DOM as exact peer dependencies.
- `@neon-wreckers/client-theme` depends on UI because its stylesheet forwards legacy imports to the shared package.

## Browser applications

The player, admin, and overlay applications declare `react`, `react-dom`, Vite, the Vite React plugin, browser client, and UI package only where imported. Browser test dependencies remain root-owned because one suite exercises all three built surfaces and their shared contracts.

## Container dependencies

The root Dockerfile and Compose file remain the only production pipeline. Their pinned Node, Nginx, PostgreSQL, and Redis images are unchanged by Stage 10.

## Upgrade policy

Use exact versions and the canonical pnpm lockfile. Add runtime dependencies only to the workspace that imports them. Cross-surface verification tooling may remain root-owned when it exercises multiple workspaces. Run dependency ownership checks, the full verification suite, browser tests, production builds, and registry-backed dependency review before release. Major upgrades require an explicit compatibility review.
