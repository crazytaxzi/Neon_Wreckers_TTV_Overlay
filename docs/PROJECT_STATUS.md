# Neon Wreckers Project Status

**Status:** Active project ledger  
**Last updated:** 2026-07-28  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Implementation state:** `P1-T02` complete; next task not yet authorized

This file records the verified state of the project. Update it at the end of every completed work unit. Do not use it as a wish list.

## Current Objective

Reduce structural complexity, duplication, stale documentation, and oversized ownership boundaries without changing gameplay, balance, visual design, accessibility behavior, player data, security boundaries, or production behavior.

The controlling objective and non-negotiable rules are defined in `docs/PRIME_DIRECTIVE.md`. The most recently completed work unit is recorded in `docs/CURRENT_TASK.md` until the next chat replaces it with one active task.

## Current Phase

Phase 1 is **Structural Cleanup and Stabilization** and remains in progress.

Its scope is defined in `docs/phases/PHASE_01.md`.

The Phase 1 administration baseline and extraction order are recorded in `docs/phases/P1_T01_ADMIN_BASELINE.md`.

## Completed Project-Control Work

- Created `docs/PRIME_DIRECTIVE.md` as the authoritative project objective and rule set.
- Created `docs/CHAT_HANDOFF_PROTOCOL.md` to define chat boundaries and repository-backed handoffs.
- Created root `START_HERE.md` as the mandatory startup entry point.
- Established this project-status ledger.
- Established a current-task file, Phase 1 scope document, and latest-handoff record.
- Added a root README notice directing development work to `START_HERE.md`.

## Completed Phase 1 Work

### `P1-T01` - Baseline and Administration Extraction Map

Completed on 2026-07-27.

Evidence recorded in `docs/phases/P1_T01_ADMIN_BASELINE.md`:

- Inspected `main` at starting commit `7375ad7a0af70d36c72d621237c8292b17b4359e`.
- Completed the mandatory startup sequence.
- Inspected the complete administration workspace and direct dependencies.
- Mapped the approximately 2,251-line `apps/admin/src/main.tsx` entrypoint.
- Defined dependency direction and an ordered feature extraction plan.
- Selected the read-only Server diagnostics feature as the first implementation slice.
- Made no application source or runtime change.

Baseline record commit:

- `537140208c289b6be92b33849f63d0d5cd0b90ca` - `docs: record admin extraction baseline`

### `P1-T02` - Server Diagnostics Extraction

Completed on 2026-07-28.

- Corrected stale Phase 1 and task statuses before implementation.
- Established an executable pre-change baseline through GitHub Actions CI against unchanged application source.
- Extracted only the read-only Server diagnostics page, its response models, and its formatting helpers into `apps/admin/src/features/server/server-page.tsx`.
- Preserved `AdminApp` ownership of state, both endpoint requests, the ten-resource refresh, navigation, and page composition.
- Added focused source and behavior regression protection in `tools/test/admin-server-feature.test.mjs`.
- Passed the focused test, the complete repository source-test set, `pnpm verify`, browser integration, UI verification, CodeQL, and CI security gates.
- Made no API, database, styling, shared-package, gameplay, content, deployment, or second-feature change.

Source extraction commit:

- `60afb9759ba0dc9480e20871a76b637b8a7eefda` - `refactor(admin): extract server diagnostics`

The final merge commit is recorded in `docs/handoffs/LATEST.md`.

## Verified Current Architecture

The repository remains a pnpm monorepo containing:

- Player web application
- Browser-based administration console
- OBS browser overlay
- Fastify API
- BullMQ worker
- Shared packages for UI, contracts, browser access, integrations, content, and game rules
- PostgreSQL persistence
- Redis-backed queues
- Docker Compose production deployment

The API remains the authoritative runtime boundary for identity, inventory, rewards, progression, administration, and persistent game state.

## Verified Administration Frontend State

The administration console currently:

- Uses React 19 and Vite at `/admin/`.
- Uses state-based tab composition rather than URL routing.
- Loads ten remote resources through one `Promise.all` refresh owned by `AdminApp`.
- Refreshes every resource after successful mutations.
- Defines local response models instead of passing endpoint-specific runtime schemas to `requestApi`.
- Keeps Operations, Expedition Creator, Integrations, Commands, Timers, Players, Refunds, Config, and UI Library in the oversized entrypoint.
- Loads the Server diagnostics page from a focused feature module.
- Depends on shared UI components and the complete shared UI stylesheet stack.
- Preserves reduced-motion, low-effects, keyboard, responsive, and forced-colors behavior.

## Verified Structural Problems

The current cleanup plan remains based on these verified problems:

- Most administration frontend responsibilities remain concentrated in `apps/admin/src/main.tsx`.
- The administration API combines unrelated responsibilities in a large route module.
- Several browser-facing data types duplicate shared or server schemas.
- The administration frontend does not pass endpoint-specific runtime schemas into `requestApi`.
- Shared UI styling is imported too broadly across application surfaces.
- Asset loading is split between incompatible approaches.
- Crew portraits are stored inside the player application instead of a shared asset system.
- Most source-controlled game content is loaded at process startup and is not truly live-editable.
- Generic content-version activation exists, but most runtime systems still use statically imported content.
- Runtime event action execution is duplicated between the API and worker.
- Some documentation is duplicated or stale.
- The `client-theme` package remains a deletion candidate pending verification.

## Existing Test Position

Protection now includes:

- Repository route inventory
- Administration production build in the root build pipeline
- Anonymous administration authentication-boundary coverage
- Anonymous administration accessibility and screenshot coverage
- Shared UI and administration graphics assertions
- StreamElements safety-boundary assertions
- Expedition Creator source assertions
- Focused Server extraction, telemetry, optional-panel, no-direct-API, and formatting assertions
- Browser integration tests
- Authenticated administration visual-proof tooling, with a known stale fixture limitation described below

Missing protection still includes authenticated interaction tests for feature mutations, full-refresh behavior, redirect behavior, confirmation cancellation, request payloads, success and error toasts, and several feature-local state transitions.

Each future extraction must add focused regression protection before or alongside moving behavior.

## Validation Position

The executable pre-change baseline and final extracted state both passed the repository CI `pnpm verify` gate using Node.js 22.16.0 and pnpm 10.32.0.

The local container could not resolve GitHub or the npm registry, so local pnpm installation and production builds were unavailable. The exact checkout was transferred through a temporary branch-only workflow, tested locally with Node's test runner, then the temporary workflow was deleted before final validation and is absent from the final diff.

## Known Risks and Limitations

- Cleanup work can accidentally change behavior if refactoring and feature work are mixed.
- The administration full-refresh callback couples every page to every remote resource.
- Source-string tests and visual captures do not fully protect authenticated mutations or local editor state.
- Moving response models and components together can accidentally become premature contract consolidation.
- Seed behavior may overwrite future live-edited content fields unless redesigned later.
- Static content imports prevent ordinary content activation from becoming live without restart.
- Running expeditions and delayed worker jobs must retain stable definitions during future content changes.
- Asset changes can break the game, admin preview, or overlay if logical keys are not validated across every client.
- The authenticated visual-proof fixture does not mock `/api/v1/admin/balance-telemetry`, `/api/v1/admin/live-ops`, or `/api/v1/admin/expedition-creator`; screenshot capture therefore falls through to an inactive proxy. The production builds and all required validation gates pass. Fixture repair is deferred.
- Repository documentation contains stale counts and duplicated historical material that must be handled carefully rather than deleted blindly.

## Not Yet Implemented

The following remain planned work, not completed features:

- Further administration frontend feature extractions
- Administration shell and refresh decomposition
- Administration API decomposition
- Shared contract consolidation
- Live database-backed content revisions
- Runtime content cache invalidation
- Unified asset upload and asset registry
- Shared editable card templates
- Separate desktop Neon Wreckers Studio
- Scheduled content-pack activation
- Seasonal, holiday, subscriber, and one-time event packs
- Instant rollback of active runtime content revisions
- Removal of the current browser administration console

## Current Readiness

`P1-T02` is complete, validated, documented, and committed.

This is a required new-chat boundary. No next implementation task is active.

The next chat must:

1. Follow `START_HERE.md` from the latest `main` branch.
2. Verify the final `P1-T02` commit recorded in `docs/handoffs/LATEST.md`.
3. Choose exactly one next objective within Phase 1.
4. Replace `docs/CURRENT_TASK.md` before implementation.
5. Do not silently combine visual-proof fixture repair with another feature extraction.

## Deferred Work

- Authenticated visual-proof fixture reconciliation
- Desktop Studio user interface design
- New game mechanics
- New ships, crew, events, rewards, or balance changes
- Holiday and seasonal content creation
- New overlay presentation features
- Native mobile applications
- Refresh decomposition beyond a future explicit task
- Endpoint-specific runtime schema adoption beyond the contract-consolidation workstream

## Update Requirements

At the end of each completed work unit, update:

- Last-updated date
- Current phase
- Current implementation state
- Completed work and commit evidence
- Verified risks or blockers
- Next required work
- Deferred ideas discovered during implementation

Claims in this file must be supported by repository state, test output, deployment evidence, or explicit user decisions.
