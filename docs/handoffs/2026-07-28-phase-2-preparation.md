# Phase 2 Preparation Handoff

**Date:** 2026-07-28  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Branch:** `main`  
**Starting commit:** `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Current implementation task:** None authorized after completed `P1-T03-REFUNDS`  
**Prepared future phase:** Phase 2 - Runtime Content Foundation  
**Preparation status:** Documentation complete; implementation not authorized

## Purpose

This handoff records advance preparation for Phase 2 without changing the active phase, replacing the Phase 1 latest handoff, or authorizing runtime-content implementation.

Phase 1 remains active until its exit gate is formally completed. The existence of Phase 2 files does not permit an assistant, agent, contributor, or automation to skip remaining Phase 1 work.

## Startup Verification Performed

The preparation work began by reading the current project-control stack and reconstructing the latest repository state.

Verified:

- `START_HERE.md` remains the mandatory entry point.
- `docs/PRIME_DIRECTIVE.md` defines Phase 2 as Runtime Content Foundation.
- `docs/CHAT_HANDOFF_PROTOCOL.md` requires one objective per chat and a repository-backed handoff.
- `docs/PROJECT_STATUS.md` still records Phase 1 in progress.
- `docs/CURRENT_TASK.md` records `P1-T03-REFUNDS` as complete and stopped.
- `docs/phases/PHASE_01.md` remains active and explicitly excludes Phase 2 implementation.
- `docs/handoffs/LATEST.md` records no next Phase 1 task as authorized.
- Latest `main` before this preparation was `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`.

## Source Seams Reverified

The Phase 2 preparation was grounded in current source rather than only the earlier architecture discussion.

Verified:

- `packages/content/src/index.mjs` owns schemas, synchronous `content/base` file reads, validation, deep freezing, cross-reference indexes, and static runtime exports.
- The worker statically imports crafting, events, expeditions, items, modules, seasons, ships, and wreck definitions.
- The worker promotes scheduled `ContentVersion` rows but continues using static imports for most runtime behavior.
- The existing `ContentVersion` model stores per-slug JSON, lifecycle, validation, publication, scheduling, expiry, creator, and version metadata.
- Authored expeditions are merged from active `ContentVersion` rows and expedition records can preserve a definition snapshot.
- The shared realtime union has no `content.revision.changed` event.
- The database seed updates station-module names, visual keys, and effects from source content.
- `content/README.md` already establishes declarative content and forbids arbitrary JavaScript.

These findings must be reverified after Phase 1 closes because later Phase 1 work may alter package ownership, API routes, contracts, or tests.

## Files Created

### `docs/phases/PHASE_02.md`

Defines:

- Phase state and entry gate
- Verified current baseline
- Target ownership boundaries
- Ordered work units from baseline through closeout
- Explicit exclusions
- Content safety
- Activation and rollback rules
- Validation requirements
- Phase exit gate
- Phase 2 start prompt

Commit:

- `191a0d7c85fc6884fccc61298434732d051ce7d9` - `docs: prepare Phase 2 runtime content plan`

### `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`

Defines the first Phase 2 task as a documentation, inspection, validation, and migration-mapping unit.

It explicitly forbids implementation and requires:

- Content domain inventory
- Static import graph
- Persistence gap report
- Durable activity binding matrix
- Seed and deployment mutation report
- Realtime and cache invalidation map
- Migration sequence
- Test matrix
- One narrow first implementation task

Commit:

- `9e1dfa25093e346b4f3433f67d7e603241cbfed8` - `docs: define Phase 2 baseline task`

### `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`

Defines the prepared technical target for:

- Canonical whole-content envelope
- Pure schema package
- Shared runtime resolver
- Immutable revision persistence
- Atomic active pointer
- Existing `ContentVersion` transition
- Canonical serialization and digest
- Redis-assisted invalidation with database recovery
- Public revision-change event
- Activation transaction
- Durable activity binding
- Seed safety
- API surface draft
- Incremental cutover
- Failure behavior, observability, and tests

Commit:

- `903bda92db8bc4e4b18923badd4ca88536e0bc1e` - `docs: add Phase 2 technical blueprint`

### `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`

Records the binding Phase 2 architecture decision:

- One immutable whole-revision system
- One atomic active pointer
- Database authority after cutover
- Source content retained for bootstrap and recovery
- Shared API and worker resolver
- Publication separated from activation
- Rollback as prior-revision activation
- Durable activity revision binding or snapshots
- No executable uploaded content
- Safe transition from existing `ContentVersion`

Commit:

- `69bdc1d042a260c34c506736fa2a066c51ce889d` - `docs: record runtime content authority decision`

### `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`

Defines the first Phase 2 implementation sprint:

- Pure schema extraction
- Canonical revision envelope
- Deterministic source compilation and digest
- Immutable revision persistence
- Atomic pointer persistence
- Explicit source revision bootstrap

It forbids runtime cutover, activation, rollback, invalidation, seed redesign, and Studio work during Sprint 1.

Commit:

- `bce02546f591bf6efce3639db1dd93789574b542` - `docs: prepare first Phase 2 sprint`

## Behavior Changed

No application, API, worker, database, seed, content, contracts, gameplay, UI, deployment, or runtime behavior changed.

Only future-phase documentation was added.

## Behavior Deliberately Preserved

- Phase 1 remains active.
- `docs/CURRENT_TASK.md` remains stopped at completed `P1-T03-REFUNDS`.
- `docs/handoffs/LATEST.md` remains the current Phase 1 handoff.
- No next implementation task was authorized.
- No source import moved.
- No schema moved.
- No Prisma migration was created.
- No content revision was created or activated.
- No realtime contract changed.
- No seed behavior changed.

## Validation Performed

Documentation and repository-state validation only:

- Confirmed Phase 2 files did not previously exist at the selected paths.
- Confirmed current content loader, worker imports, Prisma models, expedition override path, realtime contract, and seed behavior from `main` source.
- Confirmed each new file was accepted on `main` by GitHub.

Application tests and builds were not run because no application or configuration behavior changed.

This is not a fresh executable application baseline. `P2-T00` must run and record the actual post-Phase-1 baseline.

## Known Risks

- Phase 1 may change the admin API, shared contracts, package boundaries, tests, or documentation before Phase 2 starts.
- Deployed `ContentVersion` rows and authored expeditions must be inventoried before any migration.
- The prepared data-model names are conceptual and must be checked against the post-Phase-1 Prisma schema.
- A new assistant may mistake prepared documents for an active phase unless it follows `START_HERE.md` and the activation gates.
- Direct documentation commits to `main` create several small commits; future application work should follow the repository branch and review policy.

## Rollback Method

These preparation files can be removed by reverting their individual documentation commits in reverse order.

No database, content, application, worker, or deployment rollback is required.

## Current Next Objective

This handoff does not choose the next Phase 1 implementation objective.

A future Phase 1 chat must:

1. Pull latest `main`.
2. Follow `START_HERE.md`.
3. Verify the completed Refunds handoff and the new documentation-only commits.
4. Choose exactly one remaining Phase 1 objective.
5. Replace `docs/CURRENT_TASK.md` before implementation.
6. Ignore the dormant Phase 2 implementation plan until Phase 1 closes.

## Future Phase 2 Start Prompt

Use only after Phase 1 is formally complete:

> Pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Follow `START_HERE.md` completely and verify from repository evidence that Phase 1 passed every exit criterion. Read `docs/phases/PHASE_02.md`, `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`, `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`, `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`, and `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`. Replace `docs/CURRENT_TASK.md` with only `P2-T00`, complete the runtime-content baseline and migration map, update the control files, and stop before implementation.