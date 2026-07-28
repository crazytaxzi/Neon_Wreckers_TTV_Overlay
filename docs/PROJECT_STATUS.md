# Neon Wreckers Project Status

**Status:** Active project ledger  
**Last updated:** 2026-07-27  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Implementation state:** `P1-T01` baseline complete on documentation branch; `P1-T02` is the next implementation task

This file records the verified state of the project. Update it at the end of every completed work unit. Do not use it as a wish list.

## Current Objective

Prepare Neon Wreckers for a controlled conversion into a modular, data-driven game with a separate desktop management application, while preserving current gameplay, accessibility, visual identity, player data, security boundaries, and deployment stability.

The controlling objective and non-negotiable rules are defined in `docs/PRIME_DIRECTIVE.md`.

## Current Phase

Phase 1 is **Structural Cleanup and Stabilization**.

Its scope is defined in `docs/phases/PHASE_01.md`.

The immediate active task is defined in `docs/CURRENT_TASK.md`.

The verified administration baseline and extraction order are recorded in `docs/phases/P1_T01_ADMIN_BASELINE.md`.

## Completed Project-Control Work

- Created `docs/PRIME_DIRECTIVE.md` as the authoritative project objective and rule set.
- Created `docs/CHAT_HANDOFF_PROTOCOL.md` to define chat boundaries and repository-backed handoffs.
- Created root `START_HERE.md` as the mandatory startup entry point.
- Established this project-status ledger.
- Established a current-task file, Phase 1 scope document, and latest-handoff record.
- Added a root README notice directing development work to `START_HERE.md`.

## Completed Phase 1 Work

### `P1-T01` - Baseline and administration extraction map

Completed on branch `agent/p1-t01-admin-baseline` from `main` commit `7375ad7a0af70d36c72d621237c8292b17b4359e`.

Verified and recorded:

- The complete seven-file `apps/admin` workspace.
- The 2,251-line responsibility surface in `apps/admin/src/main.tsx`.
- Bootstrap, authentication, role gating, navigation, shell, global refresh, forms, mutations, page state, side effects, and handwritten response models.
- Every administration frontend API path, method, and request-body dependency.
- Direct browser-client behavior.
- Shared UI providers, shell, navigation, modal, toast, table, form, accessibility, theme, and CSS side effects.
- Administration-specific CSS order and accessibility/responsive behavior.
- Existing browser, repository, API-route, and visual-proof coverage.
- Missing authenticated administration regression coverage.
- Four repository tests that read `apps/admin/src/main.tsx` directly and must follow extracted features.
- A feature extraction order that begins with the read-only Server page and leaves shell/data orchestration until later.

No application source, API, database, gameplay, styling, content, dependency, or deployment file was changed during `P1-T01`.

## Verified Current Architecture

The current repository is a pnpm monorepo containing:

- Player web application.
- Browser-based administration console.
- OBS browser overlay.
- Fastify API.
- BullMQ worker.
- Shared packages for UI, contracts, browser access, integrations, content, and game rules.
- PostgreSQL persistence.
- Redis-backed queues.
- Docker Compose production deployment.

The API remains the authoritative runtime boundary for identity, inventory, rewards, progression, administration, and persistent game state.

The administration frontend currently:

- Uses React 19 and Vite under `/admin/`.
- Imports shared UI and browser-client packages.
- Holds all administration pages in `apps/admin/src/main.tsx`.
- Loads ten data domains through one application-level refresh.
- Uses handwritten TypeScript response models without administration-specific runtime payload schemas.
- Relies on the API's `requireAdmin` boundary, which accepts `admin` or `streamer` roles.
- Preserves accessibility behavior through shared UI components and administration-specific reduced-motion/forced-colors CSS.

## Verified Structural Problems

The current cleanup plan is based on these verified problems:

- The administration frontend is concentrated in an oversized `apps/admin/src/main.tsx` file.
- The administration API combines unrelated responsibilities in a large route module.
- Several browser-facing data types are handwritten even though shared contracts already exist.
- Administration responses are envelope-validated but not payload-validated at runtime because no schemas are passed to `requestApi`.
- Shared UI styling is imported broadly across application surfaces.
- Administration tests do not exercise an authenticated feature workflow.
- Several repository tests use source-text assertions tied to the monolithic admin file path.
- The authenticated visual-proof script is useful but is not an automated validation gate.
- Asset loading is split between multiple incompatible approaches.
- Crew portraits are stored inside the player application instead of a shared asset system.
- Most source-controlled game content is loaded at process startup and is not truly live-editable.
- Generic content-version activation exists, but most runtime systems still use statically imported content.
- Runtime event action execution is duplicated between the API and worker.
- Some documentation is duplicated or stale.
- The `client-theme` package appears to be a compatibility shim and remains a deletion candidate pending later Phase 1 verification.

## Validation State

`P1-T01` completed repository-backed source inspection, but it did not produce a fresh application build or test pass.

Environment evidence:

- Node.js `v22.16.0` was available.
- No local repository checkout was available.
- Cloning failed because DNS could not resolve `github.com`.
- `pnpm` was not installed.
- Corepack could not download pnpm because DNS could not resolve `registry.npmjs.org`.
- The inspected `main` commit had no attached status checks or pull-request workflow runs.

The following are therefore **not claimed as passing** for the inspected baseline:

- `pnpm install --frozen-lockfile`
- `pnpm test:repository`
- `pnpm test:dependencies`
- `pnpm test:content`
- `pnpm test:api`
- `pnpm test:engine`
- `pnpm build`
- `pnpm verify`
- `pnpm test:browser`

The next implementation environment must run the relevant pre-change baseline and record any failure before source movement begins.

## Next Required Work

The next active task is `P1-T02`.

It must extract only the read-only Server administration page, its owned telemetry types, and its pure byte/duration formatters.

`P1-T02` must:

1. Add a narrow authenticated Server-page Playwright fixture and smoke test.
2. Create the Server feature module.
3. Leave authentication, navigation, global refresh, API requests, data ownership, CSS, visible copy, and behavior unchanged.
4. Run and record the available validation.
5. Commit, update the handoff, and stop before the next extraction.

Exact scope and stopping rules are in `docs/CURRENT_TASK.md`.

## Not Yet Implemented

The following remain planned work, not completed features:

- Any administration frontend extraction.
- Per-feature administration data fetching or refresh invalidation.
- Administration runtime response schemas.
- Administration shell/bootstrap extraction.
- Administration API route decomposition.
- Live database-backed content revisions.
- Runtime content cache invalidation.
- Unified asset upload and asset registry.
- Shared editable card templates.
- Separate desktop Neon Wreckers Studio.
- Scheduled content-pack activation.
- Seasonal, holiday, subscriber, and one-time event packs.
- Instant rollback of active content revisions.
- Removal of the current browser administration console.

Do not describe any item in this section as complete until repository evidence and validation support that claim.

## Known Risks

- Cleanup work can accidentally change game behavior if refactoring and feature work are mixed.
- The current environment did not produce a fresh executable baseline.
- Moving feature text out of `main.tsx` can break static source-text tests without changing runtime behavior.
- Authenticated administration behavior currently lacks automated browser regression coverage.
- Global refresh couples every feature to ten GET requests and must remain unchanged during initial component movement.
- Shared UI root imports pull broad stylesheet side effects into the administration app.
- Seed behavior may overwrite future live-edited content fields unless redesigned later.
- Static content imports currently prevent ordinary content activation from becoming live without restart.
- Running expeditions and delayed worker jobs must retain stable definitions during future content changes.
- Asset changes can break the game, admin preview, or overlay if logical keys are not validated across every client.
- Repository documentation contains stale counts and duplicated historical material that must be handled carefully rather than deleted blindly.

## Deferred Work

Ideas discovered during Phase 1 that are not required for structural cleanup must be recorded here or in a dedicated backlog rather than implemented immediately.

Current deferred categories:

- Desktop Studio user interface design.
- New game mechanics.
- New ships, crew, events, rewards, or balance changes.
- Holiday and seasonal content creation.
- New overlay presentation features.
- Native mobile applications.

## Update Requirements

At the end of each completed work unit, update:

- Last-updated date.
- Current phase.
- Current implementation state.
- Completed work.
- Verified risks or blockers.
- Validation evidence.
- Next required work.
- Deferred ideas discovered during implementation.

Claims in this file must be supported by repository state, test output, deployment evidence, or explicit user decisions.
