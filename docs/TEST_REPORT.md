# Test report

> Historical evidence snapshot. This document records checks performed on 2026-07-13 and must not be read as proof for the current commit or a later deployment. Current releases require a new record based on `docs/RELEASE_EVIDENCE_TEMPLATE.md`.

Verification date: 2026-07-13.

## Completed checks

The rebuilt Phase 2 source passed every dependency-free verification gate available in the offline build environment.

- Dependency ownership: 11 workspaces and 51 direct dependency, development-dependency, and peer-dependency declarations passed `node tools/audit-dependencies.mjs`.
- Canonical content: 8 items, 5 wrecks, 9 modules, 1 initial station, 3 events, 2 seasons, 2 themes, and 23 asset records passed validation.
- Repository, route, and database invariants: 15 Node subtests passed with no failures.
- TypeScript syntax: all 42 `.ts` and `.tsx` implementation files parsed with zero compiler syntax diagnostics.
- Browser semantic checks: `@neon-wreckers/ui`, web, admin, and overlay passed strict `tsc --noEmit` checks using temporary local declaration scaffolding for the locked React, React DOM, Lucide, and Vite packages. The scaffolding was removed before packaging.
- Shell scripts: all files under `scripts/*.sh` passed `bash -n`.
- YAML: `pnpm-lock.yaml` parsed with 12 importers and `compose.yaml` parsed with the expected PostgreSQL, Redis, setup, API, worker, and gateway services.
- Frontend static checks: no explicit `any`, emoji interface graphics, or app-local hexadecimal palette literals were found in the product UI source.

## Current-source preservation

The following protected paths were compared byte for byte with the supplied working source and remain unchanged:

- `apps/api`
- `apps/worker`
- `packages/game-engine`
- `packages/content`
- `packages/integrations`
- `packages/browser-client`
- `infrastructure`
- `content/base`
- `assets/manifest.json`
- root `Dockerfile` and `compose.yaml`
- all three Vite configuration files

This confirms that Phase 2 changed the browser interface layer, workspace wiring, UI-focused documentation, and associated repository checks without modifying backend behavior, persistence, gameplay, balance, content, deployment topology, or development proxy behavior.

## Checks not executed in this environment

A full `pnpm install --frozen-lockfile`, `pnpm run verify`, and production Vite build could not be executed because Corepack attempted to fetch the pinned pnpm release and the environment could not resolve the npm registry. The environment also had no installed workspace dependency tree. No successful full-build claim is made for this rebuilt archive.

The unchanged backend and game-engine tests were not rerun through the root pnpm workflow for the same dependency limitation. Their source, canonical content, and lockfile entries remain identical to the supplied working repository, while the dependency-free route, database, repository, and content gates were rerun successfully.

Docker Compose configuration, image construction, live service startup, Twitch OAuth, StreamElements transactions, TLS issuance, WebSocket behavior through the deployed gateway, and OBS rendering remain target-host verification gates. Run `bash scripts/verify.sh` in a networked environment with Docker before production release.
