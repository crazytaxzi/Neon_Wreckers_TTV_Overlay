# Phase 1: Structural Cleanup and Stabilization

**Phase ID:** `P1`  
**Status:** In progress  
**Parent authority:** `docs/PRIME_DIRECTIVE.md`  
**Startup authority:** `START_HERE.md`

## Phase Objective

Reduce structural complexity, duplication, stale documentation, and oversized ownership boundaries without changing gameplay, balance, visual design, accessibility behavior, player data, security boundaries, or production behavior.

Phase 1 prepares the repository for the later live-content runtime and desktop Studio. It does not build those systems yet.

## Success Definition

Phase 1 succeeds when the repository is easier to understand, test, and extend while the game behaves the same as it did before the phase began.

A cleaner codebase that changes player outcomes, breaks deployment, weakens security, or silently removes features is a failed Phase 1.

## Included Workstreams

### 1. Administration Frontend Decomposition

- Map all responsibilities in `apps/admin/src/main.tsx`.
- Add regression coverage before risky extraction work.
- Extract feature modules in small, reviewable steps.
- Separate API access, data types, state ownership, forms, panels, and route composition.
- Preserve current administration permissions, behavior, and presentation.

### 2. Administration API Decomposition

- Split unrelated administration route responsibilities into focused modules.
- Keep route modules thin and preserve domain-service boundaries.
- Preserve authorization and audit logging.
- Remove duplicated event-action execution by creating one authoritative shared implementation when safely covered by tests.

### 3. Shared Contract Consolidation

- Identify browser models that duplicate schemas or inferred types in `packages/contracts`.
- Migrate consumers gradually to shared contracts.
- Preserve API response compatibility.
- Avoid a flag-day rewrite.

### 4. Presentation and Styling Ownership Cleanup

- Identify global CSS imports that force unrelated application surfaces to load each other’s styling.
- Separate shared tokens and primitives from app-specific presentation layers.
- Preserve the current visual identity and accessibility behavior.
- Do not redesign components during this phase.

### 5. Asset-Path Consolidation Preparation

- Inventory asset-loading approaches used by the web game, admin console, and overlay.
- Remove hardcoded presentation exceptions only when equivalent shared behavior is proven.
- Define a later migration path toward a unified asset runtime.
- Do not build the upload registry or desktop asset studio during Phase 1.

### 6. Package and Configuration Cleanup

- Verify whether `packages/client-theme` has runtime consumers.
- Remove it only when repository-wide evidence and validation show it is unnecessary.
- Consolidate duplicated Vite or configuration logic only when the result remains clear and testable.
- Remove dependencies only when usage analysis and validation support removal.

### 7. Documentation Reconciliation

- Identify duplicate, stale, historical, or contradictory documents.
- Update active documentation to match the current repository.
- Archive historical material when it retains useful evidence.
- Delete obsolete documentation only when its purpose is fully replaced.
- Keep project-control documents current after every work unit.

## Explicitly Excluded

The following are outside Phase 1:

- New gameplay mechanics
- Balance changes
- New rewards, ships, crew, items, modules, expeditions, or events
- Visual redesign
- New card designs
- Live content revision activation
- Database-backed runtime content packs
- Asset uploads or image processing
- Desktop Neon Wreckers Studio development
- Removal of the browser admin console
- Native Android, iOS, Windows, or macOS player applications
- Production deployment changes unless required to preserve existing behavior after cleanup
- Unrelated bug fixes discovered during cleanup, unless they block safe completion and the user explicitly approves the scope change

Excluded ideas must be recorded as deferred work rather than implemented.

## Recommended Work Units and Chat Boundaries

### `P1-T01`: Baseline and Admin Extraction Map

Inspect the latest source, record current behavior and validation, map the administration frontend, and define the first extraction.

Stop after the baseline is committed.

### `P1-T02`: First Administration Frontend Extraction

Extract one low-risk feature slice with regression tests and no behavior changes.

Stop after validation and commit.

### `P1-T03`: Remaining Administration Frontend Decomposition

Continue in one or more narrow work units. Do not combine all remaining features into one uncontrolled refactor.

### `P1-T04`: Administration API Decomposition

Split route ownership and centralize duplicated event execution with tests.

### `P1-T05`: Contract Consolidation

Move selected browser models to shared contracts without changing API behavior.

### `P1-T06`: Styling, Package, and Configuration Cleanup

Reduce broad CSS coupling, verify package removals, and consolidate safe configuration duplication.

### `P1-T07`: Documentation Reconciliation and Phase Closeout

Reconcile documentation, run the complete validation gate, record evidence, and formally close Phase 1.

A work unit may require more than one chat if implementation or validation becomes too large. Use `docs/CHAT_HANDOFF_PROTOCOL.md` rather than forcing the estimated count.

## Change Rules

Every implementation work unit must:

- Begin from the latest repository state.
- Name the exact objective before code changes.
- List allowed and forbidden files or systems.
- Add or identify regression protection before risky refactoring.
- Keep the diff limited to the active objective.
- Preserve public routes and API response behavior unless explicitly approved.
- Preserve permissions and security checks.
- Preserve accessibility behavior.
- Record deferred ideas instead of implementing them.
- Update project-control files at completion.

## Validation Gates

### Per-Task Gate

Run the smallest relevant checks plus any tests covering changed behavior.

Typical checks include:

```bash
pnpm test:repository
pnpm test:dependencies
pnpm test:content
pnpm test:api
pnpm test:engine
pnpm build
```

Use targeted workspace checks during intermediate work, but do not substitute them for the phase-close gate.

### Phase-Close Gate

Before Phase 1 is complete:

```bash
pnpm install --frozen-lockfile
pnpm verify
```

On a Docker-capable target or validation host:

```bash
bash scripts/verify.sh
```

External Twitch, StreamElements, DNS, TLS, and OBS behavior must be described according to actual evidence. Do not claim external verification from source tests alone.

## Phase Completion Criteria

Phase 1 may be marked complete only when:

- Administration frontend ownership is meaningfully decomposed.
- Administration API responsibilities are separated.
- Duplicated event action execution has one authoritative implementation or a documented reason it remains.
- Selected duplicated browser models use shared contracts.
- Broad presentation and styling coupling is reduced without visual redesign.
- Confirmed dead packages and dependencies are removed.
- Active documentation matches the repository.
- Tests and builds pass according to recorded evidence.
- No gameplay, balance, accessibility, security, or player-data regression is known.
- `docs/PROJECT_STATUS.md` records the completed phase.
- `docs/CURRENT_TASK.md` points to Phase 2 preparation.
- `docs/handoffs/LATEST.md` contains a complete phase-close handoff.

## Rollback Standard

Every work unit must be small enough to revert without unwinding unrelated changes.

When a refactor fails validation:

1. Do not patch around the failure with unrelated changes.
2. Identify the smallest failing change.
3. Revert or repair within the active scope.
4. Record the failure and decision in the handoff.
5. Start a new chat when the failure changes the planned architecture or work order.

## Deferred Destination

Phase 1 prepares, but does not implement, the later architecture for:

- `content-schemas`
- `content-runtime`
- Runtime content revisions
- Unified asset registry
- Shared editable card presentation
- Desktop Neon Wreckers Studio
- Content packs, scheduling, activation, and rollback
