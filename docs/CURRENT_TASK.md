# Neon Wreckers Current Task

**Task ID:** `P1-T01`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Ready to start  
**Phase authority:** `docs/phases/PHASE_01.md`

Only one task may be active in this file at a time.

## Objective

Establish a verified Phase 1 baseline and produce the exact extraction map for decomposing the administration frontend without changing runtime behavior.

This is a preparation and boundary-locking task. It must finish before the first administration frontend refactor begins.

## Required Work

1. Pull and inspect the latest `main` branch.
2. Read every file required by `START_HERE.md`.
3. Inspect the complete `apps/admin` workspace.
4. Identify the responsibilities currently held by `apps/admin/src/main.tsx`.
5. Identify its direct imports, API dependencies, shared types, routing responsibilities, state ownership, forms, panels, and side effects.
6. Identify existing tests and missing regression coverage for the administration frontend.
7. Record a proposed feature-module extraction order.
8. Run the available baseline validation without changing application behavior.
9. Update this file with the first implementation task after the baseline is verified.

## Expected Deliverable

A committed Phase 1 baseline record that identifies:

- Existing admin features
- Proposed module boundaries
- Dependency direction
- Shared code that must remain unchanged initially
- Tests required before each extraction
- First implementation work unit
- Baseline validation results and environmental limitations

The baseline record may be added under `docs/phases/` or `docs/handoffs/` as appropriate.

## Allowed Scope

For this task, changes are limited to:

- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/phases/PHASE_01.md`
- `docs/handoffs/LATEST.md`
- A new Phase 1 baseline or extraction-map document
- Tests only when needed to capture existing behavior before refactoring

Source inspection may cover the entire repository, but implementation changes are not yet allowed.

## Forbidden Changes

Do not perform any of the following during this task:

- Refactor `apps/admin/src/main.tsx`
- Change API routes
- Change database models or migrations
- Change game mechanics
- Change rewards, balance, loot, cooldowns, or progression
- Redesign the administration interface
- Change visual styling
- Add new ships, crew, items, expeditions, events, or content
- Begin the desktop Studio application
- Remove packages or documentation
- Deploy to production

## Required Validation

Record the exact commands that were actually run and their results.

Preferred baseline commands:

```bash
pnpm install --frozen-lockfile
pnpm test:repository
pnpm test:dependencies
pnpm test:content
pnpm test:api
pnpm test:engine
pnpm build
```

Use `pnpm verify` when the environment supports the complete source-level gate.

If a command cannot run because the environment lacks Node.js, pnpm, PostgreSQL, Redis, Docker, credentials, or network access, record the limitation. Do not label an unrun check as passing.

## Completion Criteria

This task is complete only when:

- The latest repository state has been inspected.
- The administration frontend responsibilities have been mapped.
- Existing test coverage and missing protection have been identified.
- Baseline validation results are recorded honestly.
- The first implementation work unit is narrow and explicit.
- `docs/PROJECT_STATUS.md` is updated.
- `docs/handoffs/LATEST.md` is updated.
- This file is replaced with the next active task.
- The new-chat check has been performed.

## Expected Stopping Point

Stop after the baseline and extraction map are committed.

The first actual frontend extraction should begin in a new chat unless the user explicitly directs otherwise and the handoff protocol still considers continuation safe.
