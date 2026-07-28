# P2-T00: Runtime Content Baseline and Migration Map

**Task ID:** `P2-T00`  
**Phase:** Phase 2 - Runtime Content Foundation  
**Status:** Prepared, dormant until Phase 1 closes  
**Phase authority:** `docs/phases/PHASE_02.md`  
**Technical authority:** `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`  
**Decision authority:** `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`

## Activation Condition

Do not activate this task merely because this file exists.

`P2-T00` may replace `docs/CURRENT_TASK.md` only after all of the following are true:

- `docs/phases/PHASE_01.md` is marked complete.
- `docs/PROJECT_STATUS.md` records Phase 1 completion.
- The Phase 1 closeout validation and commit evidence are recorded.
- `docs/handoffs/LATEST.md` explicitly authorizes Phase 2 preparation.
- The latest `main` branch has been inspected after the Phase 1 merge and closeout.
- No unfinished Phase 1 implementation task remains active.

If any condition is missing or contradictory, Phase 1 remains active and this task stays dormant.

## Objective

Produce a verified, implementation-ready map for migrating Neon Wreckers from static process-imported content to one immutable revision system shared by the API and worker, without changing application behavior.

This is an inspection, validation, data-model confirmation, dependency-mapping, and task-planning work unit. It must not perform the runtime migration.

## Required Reading

After completing the normal `START_HERE.md` sequence, read:

1. `docs/phases/PHASE_02.md`
2. `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`
3. `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`
4. `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`
5. `content/README.md`
6. Content, database, worker, API, contracts, deployment, and test files identified during the repository audit

Do not rely on this preparation document when the actual source differs.

## Starting Questions

The baseline must answer, from repository evidence:

1. Which content domains exist now?
2. Where is each domain schema defined?
3. Where is each domain loaded?
4. Which processes import each static content export?
5. Which routes and services read content directly?
6. Which worker jobs read content directly?
7. Which tests depend on source paths, export names, object identity, or frozen values?
8. What does `ContentVersion` currently control in practice?
9. Which active `ContentVersion` rows may exist in deployed data?
10. How are authored expeditions merged with source content?
11. Which durable records already store snapshots or revision-like data?
12. Which durable records currently depend on whatever content is active at resolution time?
13. Which seed operations write fields that Phase 2 intends to make live-authored?
14. How are realtime events contracted, broadcast, received, and recovered after disconnect?
15. How can the API and worker invalidate content caches across processes using existing infrastructure?
16. What is the safest migration and rollback path for existing deployments?
17. Which Phase 1 changes alter the assumptions recorded in the prepared Phase 2 blueprint?

## Mandatory Repository Inspection

Inspect at minimum:

### Content source and validation

- `content/`
- `packages/content/`
- `packages/contracts/`
- Content tests and repository validation tools
- Asset-key validation only as needed to preserve content cross-references

### API consumers

- Every API import from `@neon-wreckers/content`
- Content administration routes
- Expedition definition services
- Salvage, construction, fleet, crew, marketplace, crafting, quarters, endgame, events, and station services where applicable
- Realtime hub and realtime contracts
- Authentication, authorization, and audit utilities used by administrative mutations

### Worker consumers

- Complete `apps/worker` workspace
- Every queue job and reconciliation loop
- Scheduled `ContentVersion` activation
- Event evaluation and action execution
- Season resolution
- Expedition and crafting resolution

### Persistence

- Prisma schema
- Every migration involving content, expeditions, crafting, events, seasons, audit, or seed state
- Database seed
- Backup, restore, update, and deployment scripts that copy or mutate content

### Browser consumers

- Player web content assumptions
- Administration content tools
- Overlay content and theme assumptions
- Browser-client and realtime recovery behavior

### Tests and operational evidence

- Content tests
- Contract tests
- API tests
- Worker and game-engine tests
- Repository and dependency audits
- Migration parity tests
- Build and deployment verification scripts
- Existing Phase 1 handoffs that changed packages or consumers relevant to content

## Required Deliverables

Create one committed baseline record under `docs/phases/` containing all sections below.

### 1. Content Domain Inventory

For every domain, record:

- Domain name
- Current source file
- Current schema owner
- Current exported shape
- Current consumers
- Cross-references
- Whether it is safe to activate independently
- Whether existing durable data stores its slug, a snapshot, or neither

Domains must include at least:

- Items
- Wrecks
- Station modules
- Initial station
- Balance
- Ship purchases, skins, and upgrades
- Crew rules
- Marketplace
- Crafting
- Quarters
- Expeditions
- Events
- Seasons
- Themes
- Point actions

### 2. Static Import Graph

Record every production import of `@neon-wreckers/content` grouped by:

- API
- Worker
- Seed and migrations
- Browser applications
- Tests and tools

For each import, classify it as:

- Request-time lookup
- Process-start singleton
- Durable-job resolution dependency
- Bootstrap-only dependency
- Validation-only dependency

### 3. Persistence Gap Report

Record:

- Existing `ContentVersion` schema and real consumers
- Lifecycle semantics in code
- Scheduling and expiry behavior
- Current uniqueness guarantees
- Missing global compatibility boundary
- Existing audit behavior
- Existing expedition authoring data that must be migrated or retained
- Representative deployed-data assumptions that require confirmation before migration

### 4. Durable Activity Binding Matrix

For each durable activity, record:

- Record or queue type
- Creation path
- Resolution path
- Content fields used at creation
- Content fields used later
- Existing snapshot or revision data
- Required Phase 2 binding strategy
- Backward-compatibility behavior for old records

### 5. Seed and Deployment Mutation Report

Record every operation that can modify persisted content-like fields during:

- Initial installation
- Normal update
- Database seed
- Backup and restore
- Test setup

Identify fields that must become bootstrap-only or protected after runtime content cutover.

### 6. Realtime and Cache Invalidation Map

Record:

- Current API realtime event contract
- Public and player-specific hubs
- Browser reconnect and polling behavior
- Existing Redis capabilities
- Candidate cross-process invalidation mechanisms
- Lost-message recovery requirement
- Process restart behavior
- Recommended bounded pointer-revalidation interval or operation-boundary check

### 7. Proposed Migration Sequence

Define the narrow task order that moves from current source content to the target system without a flag-day rewrite.

The sequence must identify:

- Compatibility adapter lifetime, if one is genuinely required
- First low-risk content domain to cut over
- First worker job to bind to a revision
- Point at which publication may begin
- Point at which activation may begin
- Point at which legacy `ContentVersion` reads may stop
- Point at which old tables or fields may be retired
- Rollback boundary for each stage

### 8. Test Matrix

Map each target behavior to an executable test or check, including:

- Schema validation
- Cross-reference rejection
- Deterministic content digest
- Immutable revision persistence
- Concurrent activation
- Invalid activation rejection
- API and worker revision agreement
- Lost invalidation recovery
- Rollback
- Old durable activity resolution after activation
- Seed non-overwrite behavior
- Migration of existing authored expeditions
- Full build and repository gates

### 9. First Implementation Task

Define exactly one next task small enough for one chat and one reviewable commit series.

The first task should normally establish pure schema ownership and parity without changing runtime loading. Change that order only when repository evidence proves a safer prerequisite is required.

## Allowed Changes

During `P2-T00`, changes are limited to:

- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/phases/PHASE_02.md`
- `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`
- `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`
- `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`
- `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`
- `docs/handoffs/LATEST.md`
- A new Phase 2 baseline and migration-map document
- Tests only when required to capture existing behavior before later refactoring, and only after the need is documented in `docs/CURRENT_TASK.md`

Source inspection may cover the whole repository.

## Forbidden Changes

Do not perform any of the following during `P2-T00`:

- Create the new runtime packages
- Move schemas
- Change content JSON
- Change content exports
- Change API or worker content imports
- Add or alter database models or migrations
- Modify seed behavior
- Add publication, activation, or rollback endpoints
- Broadcast a content revision event
- Change queue payloads
- Backfill revision identifiers
- Change gameplay, balance, rewards, or progression
- Add new content
- Begin Studio, asset registry, card designer, or pack implementation
- Deploy to production

## Required Baseline Validation

Record the exact commands actually run and their results.

Preferred source-level baseline:

```bash
pnpm install --frozen-lockfile
pnpm test:content
pnpm test:contracts
pnpm test:api
pnpm test:engine
pnpm test:repository
pnpm test:dependencies
pnpm build
pnpm verify
```

When PostgreSQL, Redis, Docker, credentials, browsers, or network access are unavailable, record the limitation without claiming success.

Do not create a fake database, fake Twitch authentication, fake StreamElements success, or a replacement verification path merely to make the checklist green.

## Completion Criteria

`P2-T00` is complete only when:

- Phase 1 completion is verified.
- The latest repository state has been reconstructed.
- The complete content domain and static import inventory exists.
- Current persistence, seed, durable activity, realtime, and deployment behavior are mapped.
- Migration risks and deployed-data assumptions are explicit.
- A staged migration and rollback plan exists.
- The test matrix covers every Phase 2 exit criterion.
- The first implementation task is narrow and explicit.
- Baseline validation results are recorded honestly.
- Project status and latest handoff are updated.
- `docs/CURRENT_TASK.md` is replaced with the first implementation task.
- The New-Chat Check is performed.

## Expected Stopping Point

Stop after the verified baseline and migration map are committed.

Do not begin schema extraction, database migration, resolver implementation, API cutover, worker cutover, or activation in the same chat.

## Ready-to-Paste P2-T00 Prompt

> Pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Follow `START_HERE.md` completely. Verify that Phase 1 is formally complete before activating Phase 2. Read `docs/phases/PHASE_02.md`, `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`, `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`, `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`, and `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`. Replace `docs/CURRENT_TASK.md` with only `P2-T00`, reconstruct the actual runtime-content architecture from source and recent commits, produce the baseline and migration map, run the available baseline checks, update the control files, and stop before implementation.