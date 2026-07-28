# Neon Wreckers Project Status

**Status:** Active project ledger  
**Last updated:** 2026-07-27  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Implementation state:** `P1-T01` complete; `P1-T02` ready to start

This file records the verified state of the project. Update it at the end of every completed work unit. Do not use it as a wish list.

## Current Objective

Reduce structural complexity, duplication, stale documentation, and oversized ownership boundaries without changing gameplay, balance, visual design, accessibility behavior, player data, security boundaries, or production behavior.

The controlling objective and non-negotiable rules are defined in `docs/PRIME_DIRECTIVE.md`. The active work unit is defined in `docs/CURRENT_TASK.md`.

## Current Phase

Phase 1 is **Structural Cleanup and Stabilization**.

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
- Inspected the complete administration workspace and its direct browser-client, shared-UI, route, test, and configuration dependencies.
- Mapped the approximately 2,251-line `apps/admin/src/main.tsx` entrypoint.
- Recorded all current pages, remote state, local state, API calls, mutations, redirects, confirmations, forms, utilities, and side effects.
- Identified existing regression protection and authenticated-interaction coverage gaps.
- Defined dependency direction and an ordered feature extraction plan.
- Selected the read-only Server diagnostics feature as the first implementation slice.
- Made no application source, API, database, styling, gameplay, content, or deployment change.

Baseline record commit:

- `537140208c289b6be92b33849f63d0d5cd0b90ca` - `docs: record admin extraction baseline`

Next-task definition commit:

- `3a9651c43766e8ce3143f994018f0f9ad9c3b790` - `docs: define first admin extraction task`

## Verified Current Architecture

The current repository is a pnpm monorepo containing:

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

## Verified Administration Frontend Baseline

The administration console currently:

- Uses React 19 and Vite at `/admin/`.
- Uses state-based tab composition rather than URL routing.
- Loads ten remote resources through one `Promise.all` refresh owned by `AdminApp`.
- Refreshes every resource after successful mutations.
- Defines local response models instead of passing endpoint-specific runtime schemas to `requestApi`.
- Contains Operations, Expedition Creator, Integrations, Commands, Server, Timers, Players, Refunds, Config, and UI Library destinations in one entrypoint.
- Depends on shared UI components and the complete shared UI stylesheet stack.
- Preserves reduced-motion, low-effects, keyboard, responsive, and forced-colors behavior through shared and administration-specific presentation layers.

The first implementation task must preserve the shell, refresh, API ownership, navigation, styling, and all current behavior while extracting only the Server diagnostics feature.

## Verified Structural Problems

The current cleanup plan is based on these verified problems:

- The administration frontend is concentrated in an oversized `apps/admin/src/main.tsx` file.
- The administration API combines unrelated responsibilities in a large route module.
- Several browser-facing data types are handwritten even though shared contracts or server schemas already exist.
- The administration frontend does not pass endpoint-specific runtime schemas into `requestApi`.
- Shared UI styling is imported too broadly across application surfaces.
- Asset loading is split between multiple incompatible approaches.
- Crew portraits are stored inside the player application instead of a shared asset system.
- Most source-controlled game content is loaded at process startup and is not truly live-editable.
- Generic content-version activation exists, but most runtime systems still use statically imported content.
- Runtime event action execution is duplicated between the API and worker.
- Some documentation is duplicated or stale.
- The `client-theme` package appears to be a compatibility shim and remains a deletion candidate pending Phase 1 verification.

## Existing Test Position

Existing protection includes:

- Repository route inventory
- Administration production build in the root build pipeline
- Anonymous administration authentication-boundary coverage
- Anonymous administration accessibility and screenshot coverage
- Shared UI and administration graphics assertions
- StreamElements safety-boundary assertions
- Expedition Creator source assertions
- Authenticated administration visual-proof captures

Missing protection includes authenticated interaction tests for feature mutations, full-refresh behavior, redirect behavior, confirmation cancellation, request payloads, success and error toasts, and several feature-local state transitions.

Each extraction must add focused regression protection before or alongside moving behavior.

## Baseline Validation Limitation

No fresh pnpm test or build command was completed during `P1-T01`.

The execution environment could inspect and update the repository through the GitHub connector, but a local clone failed because `github.com` could not be resolved. GitHub also reported no workflow runs or combined commit statuses for the inspected starting commit.

This is a verified source-inspection baseline, not a fresh passing executable baseline. `P1-T02` must begin in a clone-capable environment and run the minimum commands defined in `docs/CURRENT_TASK.md`.

## Not Yet Implemented

The following remain planned work, not completed features:

- Any administration frontend source extraction
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

Do not describe any item in this section as complete until repository evidence and validation support that claim.

## Known Risks

- Cleanup work can accidentally change game behavior if refactoring and feature work are mixed.
- The administration full-refresh callback couples every page to every remote resource.
- Source-string tests and visual captures do not fully protect authenticated mutations or local editor state.
- Moving response models and components together can accidentally become premature contract consolidation.
- Seed behavior may overwrite future live-edited content fields unless redesigned later.
- Static content imports currently prevent ordinary content activation from becoming live without restart.
- Running expeditions and delayed worker jobs must retain stable definitions during future content changes.
- Asset changes can break the game, admin preview, or overlay if logical keys are not validated across every client.
- Repository documentation contains stale counts and duplicated historical material that must be handled carefully rather than deleted blindly.

## Current Readiness

`P1-T01` is complete and creates a clean new-chat boundary.

`P1-T02` is ready to start. Its single objective is to extract the read-only Server diagnostics feature with focused regression protection and no behavior change.

Before code changes begin, the next work session must:

1. Follow `START_HERE.md`.
2. Verify the latest `main` branch and commit.
3. Read `docs/phases/P1_T01_ADMIN_BASELINE.md`.
4. Run or honestly document the pre-change executable baseline.
5. Complete only the task defined in `docs/CURRENT_TASK.md`.
6. Stop after the Server extraction is validated and committed.

## Deferred Work

Ideas discovered during Phase 1 that are not required for structural cleanup must be recorded here or in a dedicated backlog rather than implemented immediately.

Current deferred categories:

- Desktop Studio user interface design
- New game mechanics
- New ships, crew, events, rewards, or balance changes
- Holiday and seasonal content creation
- New overlay presentation features
- Native mobile applications
- Refresh decomposition beyond what a future explicit task authorizes
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
