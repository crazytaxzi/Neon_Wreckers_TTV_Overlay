# Neon Wreckers Project Status

**Status:** Active project ledger  
**Last updated:** 2026-07-28  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Implementation state:** `P1-T03` complete and validated; pending final merge closeout

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

Final merge commit:

- `4cb1b8049ce6e546121e90beb81e2b16be9fb28e` - `refactor(admin): extract server diagnostics`

The historical handoff is preserved at `docs/handoffs/2026-07-28-p1-t02-server-diagnostics.md`.

### `P1-T02-FIX1` - Authenticated Visual-Proof Fixture Repair

Completed on 2026-07-28.

- Reproduced the existing Admin and Overlay Visual Proof failure before editing.
- Confirmed that frozen installation, production builds, browser installation, and preview startup succeeded while three administration requests fell through to the inactive preview proxy.
- Added deterministic visual-proof-only responses for `/api/v1/admin/balance-telemetry`, `/api/v1/admin/live-ops`, and `/api/v1/admin/expedition-creator`.
- Preserved the administration console's existing ten-resource `Promise.all` refresh and all production application behavior.
- Added `tools/test/admin-visual-proof-fixture.test.mjs` to derive the ten refresh endpoints from the actual administration source and require an explicit fixture response for every endpoint.
- Passed the focused regression, full `pnpm verify`, admin and overlay production builds, and the exact authenticated Admin and Overlay Visual Proof workflow.
- Produced all 26 existing visual-proof captures without changing screenshot names, viewports, navigation, authentication, overlay modes, styling, accessibility, or runtime behavior.
- Made no workflow, administration application, Server, Timers, API, database, CSS, shared UI, browser-client, gameplay, content, or deployment change.

Final merge commit:

- `e206d43eb97bdf5d5d4cc366ef9faa9ed8fa7c79` - `fix(visual-proof): cover admin refresh fixtures`

### `P1-T03` - Timers Administration Extraction

Completed and validated on 2026-07-28. Final merge closeout is pending.

- Completed the mandatory startup sequence from `main` commit `78646d84e8b47b73dd3cf4cf3cce61dfc02e6cbd`.
- Verified `P1-T02-FIX1`, merge `e206d43eb97bdf5d5d4cc366ef9faa9ed8fa7c79`, and the latest documented main closeout before implementation.
- Recorded the existing Timers rendering, data flow, confirmation, exact bodyless POST, toast, refresh, cancellation, visual-proof, API, authorization, and Server-overview relationship before editing.
- Extracted only the Timers page, Timers-specific presentation, confirmation, and force-resolve command into `apps/admin/src/features/timers/timers-page.tsx`.
- Preserved `AdminApp` ownership of authentication, navigation, page composition, overview loading, the complete ten-resource refresh, and cross-feature orchestration.
- Continued passing `overview?.timers ?? []`, `refresh`, and `pushToast` through props.
- Preserved the exact request method, route, bodyless payload, confirmation copy, success and failure toasts, locale date rendering, full refresh after success, and no side effects after cancellation or failure.
- Added six focused regression tests in `tools/test/admin-timers-feature.test.mjs`.
- Passed full `pnpm verify`, administration and overlay builds, browser integration, UI verification, CodeQL, security gates, and the exact authenticated Admin and Overlay Visual Proof workflow.
- Produced the existing 26 captures, including the desktop Timers proof, without changing screenshots, CSS, graphics, navigation, accessibility, or runtime behavior.
- Made no Refunds, Players, Commands, Integrations, Expedition Creator, Config, Operations, Server, refresh decomposition, API, database, browser-client, shared UI, gameplay, content, worker, deployment, Docker, nginx, Vite, or workflow change.

Validated source head:

- `ca1a3f9470d0fcfe35024fdae2bfa1de1e9a97f1`

Final merge commit will be recorded during the post-merge closeout.

The detailed handoff is preserved at `docs/handoffs/2026-07-28-p1-t03-timers.md`.

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
- Keeps Operations, Expedition Creator, Integrations, Commands, Players, Refunds, Config, and UI Library in the oversized entrypoint.
- Loads Server diagnostics from `apps/admin/src/features/server/server-page.tsx`.
- Loads Timers administration from `apps/admin/src/features/timers/timers-page.tsx`.
- Passes shell-owned overview timer records, full refresh, and toast delivery into the Timers feature.
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
- Focused Timers composition, ownership, data shape, rendering, confirmation, request, cancellation, toast, refresh, visual-proof, and authorization assertions
- Browser integration tests
- Authenticated administration and overlay visual-proof capture using production-built surfaces
- Focused protection requiring every endpoint in the administration ten-resource refresh to have an explicit authenticated visual-proof fixture response

Missing protection still includes authenticated interaction tests for the remaining administration mutations, full-refresh failure behavior, redirect behavior, and several unrelated feature-local state transitions.

Each future extraction must add focused regression protection before or alongside moving behavior.

## Validation Position

### `P1-T03` executable pre-change baseline

Task-definition commit `cca0abea2c75b9f30352bd1a62536a9e02126641` changed documentation only and retained application source from starting `main`.

- CI run `30371064822`, job `90314741971`: frozen install and complete `pnpm verify`, success

### `P1-T03` validated source head

Commit `ca1a3f9470d0fcfe35024fdae2bfa1de1e9a97f1` passed:

- CI run `30372552445`, job `90319894219`: frozen install and complete `pnpm verify`, success
- Admin and Overlay Visual Proof run `30372551080`, job `90319889665`: production builds, built previews, exact authenticated capture, and artifact upload, success
- CodeQL run `30372552587`, job `90319894144`: success
- UI Revamp Verify run `30372551099`, job `90319888544`: success
- Browser integration tests run `30372551084`: success
- CI and security gates run `30372551055`: success

Visual artifact `8693597195`, digest `sha256:b9bdd3dec9c1443c6e0be9bd4c47ee6a6ceae232a33748719168c639465dfcec`, contains the existing 26 captures.

The local container could not resolve GitHub or the npm registry, so the executable baseline and final validation ran through the repository's authenticated GitHub Actions environment.

## Known Risks and Limitations

- Cleanup work can accidentally change behavior if refactoring and feature work are mixed.
- The administration full-refresh callback couples every page to every remote resource.
- Source-string command tests and visual captures do not replace full authenticated end-to-end mutation coverage.
- The fixture-coverage regression intentionally couples visual proof to the current refresh endpoint list so a future refresh change fails loudly until the fixture is reconciled.
- Moving response models and components together can accidentally become premature contract consolidation.
- Seed behavior may overwrite future live-edited content fields unless redesigned later.
- Static content imports prevent ordinary content activation from becoming live without restart.
- Running expeditions and delayed worker jobs must retain stable definitions during future content changes.
- Asset changes can break the game, admin preview, or overlay if logical keys are not validated across every client.
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

`P1-T03` is complete, validated, and ready for final merge and post-merge documentation closeout.

This is a required stopping boundary after closeout. No next implementation task is active.

The next chat must:

1. Follow `START_HERE.md` from the latest `main` branch.
2. Verify the final `P1-T03` merge and documented main closeout recorded in `docs/handoffs/LATEST.md`.
3. Choose exactly one next objective within Phase 1.
4. Replace `docs/CURRENT_TASK.md` before implementation.
5. Do not begin Refunds, Players, refresh decomposition, or another administration task in this completed Timers chat.

## Deferred Work

- Continue administration frontend decomposition one narrow feature at a time
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
