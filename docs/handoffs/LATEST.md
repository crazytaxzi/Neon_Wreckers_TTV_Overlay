# Neon Wreckers Latest Handoff

**Handoff date:** 2026-07-27  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Branch:** `main`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Current task:** `P1-T01` - Baseline and administration extraction map  
**Handoff status:** Ready for a new development chat

This is the current handoff. Replace its contents at the end of every completed work unit. Historical handoffs may be copied to a dated file before replacement when they retain useful evidence.

## Read First

The next chat must begin with:

1. `START_HERE.md`
2. `docs/PRIME_DIRECTIVE.md`
3. `docs/CHAT_HANDOFF_PROTOCOL.md`
4. `docs/PROJECT_STATUS.md`
5. `docs/CURRENT_TASK.md`
6. `docs/phases/PHASE_01.md`
7. This handoff
8. The latest repository state and recent commits

Do not rely on the previous conversation as the source of truth.

## Work Completed

The repository now contains a complete project-control foundation:

- `docs/PRIME_DIRECTIVE.md` defines the permanent project objective and non-negotiable boundaries.
- `docs/CHAT_HANDOFF_PROTOCOL.md` defines when a chat must stop and how the next chat reconstructs state.
- `START_HERE.md` is the mandatory root-level startup entry point.
- `docs/PROJECT_STATUS.md` records the verified project state, completed work, known structural problems, and deferred work.
- `docs/CURRENT_TASK.md` defines one active task with allowed scope, forbidden changes, validation, and stopping point.
- `docs/phases/PHASE_01.md` defines the full Phase 1 scope, exclusions, work units, validation gates, completion criteria, and rollback rules.
- The root `README.md` now prominently directs contributors and AI-assisted work to `START_HERE.md`.

## Relevant Commits

- `f072f28453969130229bc6d690857360e330a3d8` - Add Prime Directive
- `c5990fdf320fb20da2c61afce3bb3b57c482b5fc` - Add chat handoff protocol
- `cf7316cda7a2b052b6a87def8af2d9054dc48bbf` - Add repository startup protocol
- `d5317c021708da55c9d9a5e6fce39cc0281566ff` - Add project status ledger
- `8d406fc67b91bce662894afdb79379952f15ac2b` - Define initial Phase 1 task
- `2ab6579c7d01e0685783d847c343a775d03f811e` - Define Phase 1 scope and gates
- `6e4c3cbffba701f761b6bfc5e8899ce0c5ab22be` - Direct README users to `START_HERE.md`

## Validation Performed

No application source, configuration, dependencies, database schema, content, or deployment behavior changed in this documentation-only work unit.

Validation performed:

- Confirmed the two existing governing documents were present on `main`.
- Confirmed the new files were created on `main`.
- Confirmed the README update was accepted by GitHub.
- Verified the README was preserved while adding the startup notice.

Application tests and production builds were not run because this work unit changed documentation only. Do not interpret that as a fresh baseline pass for the application.

## Current Task

The next chat must perform `P1-T01` exactly as defined in `docs/CURRENT_TASK.md`.

Primary objective:

> Establish a verified Phase 1 baseline and produce the exact extraction map for decomposing the administration frontend without changing runtime behavior.

The next chat is an inspection, validation, and planning work unit. It must not begin the actual frontend refactor.

## Required Next Actions

1. Pull the latest `main` branch.
2. Complete the `START_HERE.md` startup sequence.
3. Inspect the complete `apps/admin` workspace and all direct dependencies of `apps/admin/src/main.tsx`.
4. Map existing responsibilities, feature boundaries, API usage, state ownership, forms, routes, and side effects.
5. Identify existing tests and missing regression protection.
6. Run the available baseline checks and record exactly what did or did not run.
7. Commit the baseline and extraction map.
8. Update project status, current task, and this handoff.
9. Stop at the chat boundary before the first extraction task.

## Allowed Scope

Use the exact allowed scope in `docs/CURRENT_TASK.md`.

Source may be inspected repository-wide. Application implementation changes are not permitted during `P1-T01`.

## Known Risks and Limitations

- The prior architecture audit was connector-backed and did not produce a fresh local build result.
- The application baseline must still be run from an environment with the required toolchain and services.
- The admin frontend is large enough that extraction boundaries must be mapped before edits begin.
- Documentation claims must continue to be checked against actual source rather than assumed correct.
- Direct pushes to `main` were used for these user-requested documentation files. Future code work should use the repository’s chosen branch and review policy unless the user explicitly directs otherwise.

## Deferred Ideas

Do not begin these during `P1-T01`:

- Desktop Studio implementation
- Live content revisions
- Asset upload registry
- Shared editable card designer
- Seasonal and holiday packs
- New game content or mechanics
- Visual redesign

## New-Chat Prompt

> Pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Read `START_HERE.md` and every file it requires before planning or changing anything. Reconstruct the current state from the repository, confirm task `P1-T01` and its boundaries, then complete only that baseline and administration extraction-map task. Do not begin the actual refactor in the same chat.
