# Phase 2 Preparation Handoff

**Date:** 2026-07-28  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Branch:** `main`  
**Preparation starting point:** `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`  
**Main before reconciliation:** `157a0b9ab5631f0f5e82c4e669b947cc75c6db5a`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Current implementation task:** `P1-T04-PLAYERS`, active according to `docs/CURRENT_TASK.md`  
**Prepared future phase:** Phase 2 - Runtime Content Foundation  
**Preparation status:** Documentation prepared; Phase 2 implementation not authorized

## Purpose

This handoff records advance preparation for Phase 2 without changing the active phase, replacing the Phase 1 latest handoff, or authorizing runtime-content implementation.

Phase 1 remains active until its exit gate is formally completed. The existence of Phase 2 files does not permit an assistant, agent, contributor, or automation to skip remaining Phase 1 work.

## Concurrent Phase 1 State

A Phase 1 Players extraction advanced on `main` while the Phase 2 documentation was being prepared.

The final repository check found:

- `docs/CURRENT_TASK.md` identifies `P1-T04-PLAYERS` as the active Phase 1 task.
- Players feature source and focused regression work are present on `main`.
- `docs/PROJECT_STATUS.md` and `docs/handoffs/LATEST.md` still describe the prior Refunds stopping point and may be updated by the active Players work unit.
- This Phase 2 preparation did not edit `docs/CURRENT_TASK.md`, `docs/PROJECT_STATUS.md`, or `docs/handoffs/LATEST.md`.
- The active Players work owns its own validation, status reconciliation, closeout, and handoff.

Any future chat must reconstruct the latest state from the repository rather than treating this supplemental handoff as the current Phase 1 task record.

## Startup and Source Verification Performed

Before writing the Phase 2 documents, the project-control stack and runtime-content seams were inspected from current source.

Verified runtime-content seams:

- `packages/content/src/index.mjs` owns schemas, synchronous `content/base` file reads, validation, deep freezing, cross-reference indexes, and static runtime exports.
- The worker statically imports crafting, events, expeditions, items, modules, seasons, ships, and wreck definitions.
- The worker promotes scheduled `ContentVersion` rows but continues using static imports for most runtime behavior.
- The existing `ContentVersion` model stores per-slug JSON, lifecycle, validation, publication, scheduling, expiry, creator, and version metadata.
- Authored expeditions are merged from active `ContentVersion` rows and expedition records can preserve a definition snapshot.
- The shared realtime union has no `content.revision.changed` event.
- The database seed updates station-module names, visual keys, and effects from source content.
- `content/README.md` establishes declarative content and forbids arbitrary JavaScript.

These findings must be reverified after Phase 1 closes because later Phase 1 work may alter package ownership, API routes, contracts, tests, or operational assumptions.

## Phase 2 Files Prepared

### `docs/phases/PHASE_02.md`

Defines the Phase 2 entry gate, verified baseline, ownership boundaries, ordered tasks, exclusions, activation and rollback rules, validation, exit gate, and start prompt.

Commit:

- `191a0d7c85fc6884fccc61298434732d051ce7d9` - `docs: prepare Phase 2 runtime content plan`

### `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`

Defines the first Phase 2 task as an inspection, validation, migration-map, and test-planning work unit. It explicitly forbids runtime implementation in the same chat.

Commit:

- `9e1dfa25093e346b4f3433f67d7e603241cbfed8` - `docs: define Phase 2 baseline task`

### `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`

Defines the prepared technical target for the canonical content envelope, pure schemas, shared resolver, immutable revisions, active pointer, transition from `ContentVersion`, digest, cache invalidation, realtime notification, durable activity binding, seed safety, API operations, cutover, failure behavior, observability, and tests.

Commit:

- `903bda92db8bc4e4b18923badd4ca88536e0bc1e` - `docs: add Phase 2 technical blueprint`

### `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`

Records the accepted Phase 2 authority model: immutable whole revisions, one atomic pointer, shared API and worker resolver, database authority after cutover, source bootstrap and recovery, publication separate from activation, rollback by prior-revision activation, durable content binding, and no executable uploaded content.

Commit:

- `69bdc1d042a260c34c506736fa2a066c51ce889d` - `docs: record runtime content authority decision`

### `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`

Defines the first Phase 2 implementation sprint: pure schema extraction, canonical envelope, deterministic source compilation and digest, immutable revision persistence, active pointer persistence, and explicit source revision bootstrap.

Commit:

- `bce02546f591bf6efce3639db1dd93789574b542` - `docs: prepare first Phase 2 sprint`

### This supplemental handoff

Records preparation scope and keeps the active Phase 1 task authoritative.

Initial commit:

- `157a0b9ab5631f0f5e82c4e669b947cc75c6db5a` - `docs: record Phase 2 preparation handoff`

## Behavior Changed

No Phase 2 application, API, worker, database, seed, content, contract, gameplay, UI, deployment, or runtime behavior changed.

The preparation work added future-phase documentation only.

The Players files present in the overall repository diff belong to the separate active `P1-T04-PLAYERS` work unit, not to Phase 2 preparation.

## Behavior Deliberately Preserved

- Phase 1 remains active.
- `P1-T04-PLAYERS` remains governed by its current task file.
- This work did not change the Players source, test, scope, or validation requirements.
- `docs/handoffs/LATEST.md` remains the active Phase 1 handoff until the Players work updates it.
- No content source import moved.
- No schema moved.
- No Prisma migration was created.
- No content revision was created or activated.
- No realtime contract changed.
- No seed behavior changed.

## Validation Performed

Documentation and repository-state validation only:

- Confirmed the selected Phase 2 file paths did not already exist.
- Confirmed the current content loader, worker imports, Prisma models, expedition override path, realtime contract, and seed behavior from repository source.
- Confirmed every new Phase 2 document was accepted on `main`.
- Compared the starting repository state with final `main` and identified the concurrent Players work rather than incorrectly claiming it belonged to Phase 2.
- Re-read `docs/CURRENT_TASK.md` and corrected this handoff to identify `P1-T04-PLAYERS` as active.

Application tests and builds were not run for the Phase 2 preparation because the Phase 2 commits changed documentation only.

This is not a fresh executable baseline. The active Players task owns its own tests, and `P2-T00` must run the actual post-Phase-1 baseline later.

## Known Risks

- Phase 1 can change admin API boundaries, shared contracts, packages, tests, and docs before Phase 2 starts.
- Deployed `ContentVersion` rows and authored expeditions must be inventoried before migration.
- Prepared model and package names remain conceptual until `P2-T00` verifies the final Phase 1 repository.
- Concurrent work can make supplemental handoffs stale quickly; `START_HERE.md`, `docs/CURRENT_TASK.md`, actual source, and recent commits remain authoritative.
- Direct documentation commits to `main` created several small commits. Application work should follow the repository's branch and review policy.

## Rollback Method

Revert the Phase 2 documentation commits in reverse order when the preparation must be removed.

No database, content, API, worker, gameplay, or deployment rollback is required.

Do not revert or modify the Players work as part of Phase 2 documentation rollback.

## Current Next Objective

Continue or safely close only the active `P1-T04-PLAYERS` work according to `docs/CURRENT_TASK.md` and the actual latest repository state.

Do not activate `P2-T00` while Phase 1 remains incomplete.

## Future Phase 2 Start Prompt

Use only after Phase 1 is formally complete:

> Pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Follow `START_HERE.md` completely and verify from repository evidence that Phase 1 passed every exit criterion. Read `docs/phases/PHASE_02.md`, `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`, `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`, `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`, and `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`. Replace `docs/CURRENT_TASK.md` with only `P2-T00`, complete the runtime-content baseline and migration map, update the control files, and stop before implementation.