# Phase 2: Runtime Content Foundation

**Phase ID:** `P2`  
**Status:** Prepared, not active  
**Prepared against:** `main` commit `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`  
**Parent authority:** `docs/PRIME_DIRECTIVE.md`  
**Startup authority:** `START_HERE.md`  
**Entry task:** `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`  
**Technical blueprint:** `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`  
**First sprint:** `docs/sprints/P2_S01_CONTENT_FOUNDATION.md`  
**Binding architecture decision:** `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`

## Phase State

Phase 2 is deliberately prepared before Phase 1 closes, but it is not authorized to begin.

Phase 1 remains the active phase. No Phase 2 implementation, migration, package creation, route change, seed change, runtime cutover, or content activation work may begin until every Phase 1 exit criterion is satisfied and recorded in the project-control files.

Preparing Phase 2 documentation does not satisfy the Phase 1 exit gate and does not replace the requirement for a fresh Phase 2 baseline from the actual repository state at that time.

## Phase Objective

Replace restart-bound, process-imported game content with one validated runtime content system shared by the API and worker.

The completed system must support immutable content revisions, atomic activation, safe rollback, audit history, cross-reference validation, cache invalidation, and stable content binding for durable activities without weakening server authority or allowing uploaded executable code.

## Verified Current Baseline

The preparation plan is based on the following verified repository behavior:

- `packages/content/src/index.mjs` currently defines schemas, synchronously reads JSON from `content/base`, validates it, deep-freezes it, and exports process-lifetime objects.
- The API, worker, seed, game services, and tests import those static exports directly.
- The worker imports crafting, events, expeditions, items, modules, seasons, ships, and wreck definitions at process startup.
- The worker can activate scheduled `ContentVersion` rows, but most runtime systems continue using the statically imported objects after activation.
- `ContentVersion` currently stores per-slug JSON with lifecycle, scheduling, expiry, validation, publisher, and version information. It does not provide one atomic active revision for the complete compatible content set.
- Authored expeditions are the current partial exception: active expedition `ContentVersion` rows are merged with source-controlled definitions, and expedition records can retain a definition snapshot.
- The shared realtime contract currently contains station, wreck, history, presence, player, inventory, fleet, expedition, and notification events, but no content revision change event.
- Database seed behavior currently updates station-module names, visual keys, and effects from source content on every seed run.
- The source-controlled content contract already forbids arbitrary JavaScript and requires validated declarative data.

These findings must be reverified during `P2-T00`; this document is not permission to trust stale assumptions.

## Success Definition

Phase 2 succeeds when:

- The API and worker resolve the same active immutable content revision.
- Ordinary supported content changes become active without restarting the API or worker.
- Publication and activation are separate operations.
- Invalid or internally inconsistent content cannot be published or activated.
- Activation changes one atomic active-content pointer rather than independently switching loosely related records.
- Rollback activates a previously published compatible revision without editing historical data.
- Every activation and rollback is attributable and auditable.
- Running expeditions, crafting jobs, runtime events, and other durable activities continue using the content with which they began.
- Seed and deployment operations cannot silently overwrite live-authored content.
- Source-controlled base content remains a deterministic bootstrap and disaster-recovery input.
- Existing gameplay, rewards, permissions, accessibility, player data, and deployment behavior remain preserved unless a later explicitly authorized task changes them.

## Target Ownership Boundaries

Phase 2 should establish these responsibilities. Exact package names must be confirmed during `P2-T00` before implementation.

### Content schemas

A pure schema layer owns:

- Domain schemas
- Cross-domain validation contracts
- Content-envelope schema
- Schema versioning
- Type exports
- No file-system access
- No database access
- No application-singleton state

### Content runtime

A runtime layer owns:

- Loading the active revision
- Loading a specific revision by identifier
- Compiling source-controlled base content into the same runtime shape
- Validation and cross-reference checks
- Immutable in-memory snapshots
- Cache lifetime and invalidation
- Revision digest verification
- API and worker resolver interfaces

### Persistence and activation

The database owns:

- Immutable published revisions
- Draft and validation state where required
- One atomic active-content pointer
- Actor and timestamp attribution
- Activation and rollback audit records
- Durable activity revision references or snapshots

### Applications

- The API authorizes and performs publication, activation, rollback, and content reads.
- The worker consumes the same runtime resolver and never maintains a separate content interpretation.
- Browser clients may receive public content manifests and revision-change notifications, but they never activate content or receive server secrets.
- The future Studio remains outside this phase.

## Ordered Work Units and Chat Boundaries

Every work unit is one objective. Stop, validate, commit, update control files, and run the New-Chat Check before beginning the next objective.

### `P2-T00`: Runtime Content Baseline and Migration Map

Reconstruct the actual post-Phase-1 content architecture, import graph, persistence model, seed behavior, durable-activity requirements, realtime path, and test position.

Deliver a verified migration map. Do not change application behavior.

Stop after the baseline is committed.

### `P2-T01`: Separate Pure Content Schemas

Move schema ownership and inferred types out of the file-loading module without changing content values, exported runtime behavior, or consumers.

The existing source-content loader may temporarily use the new schemas. Do not introduce database runtime loading in this task.

Stop after schema parity and content validation pass.

### `P2-T02`: Define the Canonical Revision Envelope

Add the canonical whole-revision content envelope, schema version, revision metadata rules, deterministic serialization, and content digest behavior.

Compile current `content/base` into that envelope in tests or build tooling while preserving current runtime consumers.

Stop before database cutover.

### `P2-T03`: Add Immutable Revision Persistence

Create the reviewed database migration for immutable whole-content revisions and the atomic active-content pointer.

Preserve or migrate existing `ContentVersion` data according to the verified migration plan. Do not delete the old path before compatibility evidence exists.

Stop after migration, rollback or recovery instructions, and persistence tests pass.

### `P2-T04`: Build the Shared Runtime Resolver

Create one resolver contract used by API and worker. It must load a specific revision, load the active revision, verify schema and digest, produce immutable runtime indexes, and expose explicit cache invalidation.

Keep the source-controlled base revision available for bootstrap and controlled fallback. Do not silently fall back from a corrupt active pointer during normal operation.

Stop after resolver tests pass without application cutover.

### `P2-T05`: Cut the API Over Incrementally

Move one low-risk content domain or service path at a time from direct static imports to the runtime resolver.

Each cutover must preserve behavior, contracts, permissions, determinism, and tests. Do not migrate every domain in one flag-day change.

Stop after each narrow domain cutover.

### `P2-T06`: Cut the Worker Over Incrementally

Make the worker use the same resolver and revision interpretation as the API.

Delayed jobs must load their bound revision or snapshot rather than whatever happens to be active when they resolve.

Stop after each job family or domain cutover.

### `P2-T07`: Publication, Activation, and Rollback

Add authorized API operations for draft validation, immutable publication, activation, rollback, revision inspection, and audit history.

Activation must update one pointer atomically. Rollback must select a prior published compatible revision rather than editing or cloning it in place.

Stop after concurrency, authorization, audit, invalid-content, and rollback tests pass.

### `P2-T08`: Cross-Process Invalidation and Realtime Notification

Add a shared `content.revision.changed` contract and cross-process invalidation strategy.

The API, worker, browser game, admin surface, and overlay must handle a revision change according to their needs. A missed transient invalidation message must not leave a process permanently stale.

Stop after lost-message recovery and stale-cache tests pass.

### `P2-T09`: Durable Activity Binding

Audit and bind every durable activity to a revision or complete snapshot.

At minimum inspect:

- Expeditions
- Crafting jobs
- Scheduled runtime events
- Queued worker jobs
- Auctions or marketplace operations whose terms outlive a request
- Seasonal transitions

Stop after deterministic old-revision resolution is proven.

### `P2-T10`: Seed Safety and Legacy Retirement

Separate bootstrap seeding from live authored content. Prevent normal deployment or seed execution from overwriting active runtime content.

Retire obsolete per-slug runtime reads and compatibility paths only after all consumers use the new resolver and migration evidence is complete.

Stop after seed idempotency, deployment, rollback, and legacy-removal checks pass.

### `P2-T11`: Phase Validation and Closeout

Run the complete phase gate, reconcile documentation, verify migrations and rollback, record external limitations honestly, and prepare the Phase 3 handoff without beginning Phase 3.

Phase completion always creates a new-chat boundary.

## Explicitly Excluded

The following are outside Phase 2:

- Desktop Neon Wreckers Studio implementation
- Asset upload processing or a unified binary asset registry
- Shared visual card designer implementation
- New card layouts or visual redesign
- Content pack precedence and holiday layering beyond data-model compatibility preparation
- Arbitrary JavaScript, plugins, native binaries, shell commands, or unvalidated HTML in content
- New gameplay mechanics
- New rewards, ships, crew, items, events, expeditions, or balance changes
- Removal of the browser admin console
- Native player applications
- Unrelated deployment replacement
- A microservice split

Useful discoveries in those areas must be recorded as deferred work.

## Content Safety Rules

- Content contains declarative data only.
- New action or condition behavior requires reviewed application code and deployment.
- Every slug referenced by another domain must resolve before publication.
- Retired identifiers needed by existing player data must remain resolvable or have an explicit migration.
- Published revisions are immutable.
- A revision is activated only after complete validation succeeds.
- Revision metadata and digest must not depend on non-deterministic object ordering or local machine paths.
- Secrets, credentials, environment values, and infrastructure instructions are not content.

## Activation Rules

Activation must:

1. Authorize the actor.
2. Lock the active pointer or otherwise guarantee serial activation.
3. Verify the target revision exists, is published, is compatible, and has passed validation.
4. Record the previous active revision.
5. Update the active pointer in one database transaction.
6. Write an audit record in the same transaction where practical.
7. Commit before broadcasting invalidation.
8. Broadcast cross-process invalidation and the public revision-change event.
9. Allow every consumer to confirm the active pointer rather than trusting only the message.

A failed broadcast after a committed activation must be recoverable through pointer revalidation. A failed transaction must not emit a false activation event.

## Rollback Rules

Rollback is another activation operation targeting a previously published compatible revision.

Rollback must not:

- Mutate the historical revision
- Reconstruct content from memory
- Delete the failed revision as part of the rollback transaction
- Rebind already running durable activities to the rollback target
- Bypass validation or authorization

## Required Validation

Per-task validation must include the smallest focused checks plus all affected integration boundaries.

Typical commands include:

```bash
pnpm install --frozen-lockfile
pnpm test:content
pnpm test:contracts
pnpm test:api
pnpm test:engine
pnpm test:repository
pnpm test:dependencies
pnpm build
```

Use `pnpm verify` for every cutover, migration, activation, rollback, seed, or phase-close task when the environment supports it.

Database tasks must additionally prove:

- Migration applies to a clean database
- Migration applies to a representative existing database
- Existing content rows are preserved or migrated as documented
- Active pointer uniqueness is enforced
- Concurrent activation cannot create two active pointers
- Recovery or rollback procedure is documented and tested where practical

Worker tasks must additionally prove:

- Queued jobs resolve with their bound content
- Restarting the worker does not change a durable activity's definition
- Cache invalidation cannot permanently strand the worker on an old revision

## Phase Exit Gate

Phase 2 may be marked complete only when:

- Phase 1 is already complete.
- Pure shared content schemas exist and are used by the source compiler and runtime resolver.
- A canonical immutable whole-revision format exists.
- Published revisions are persisted immutably.
- Exactly one active-content pointer is authoritative.
- API and worker resolve the same active revision.
- Supported content activation requires no application restart.
- Invalid content cannot publish or activate.
- Activation and rollback are atomic, authorized, and audited.
- Cross-process invalidation and lost-message recovery are proven.
- Durable activities retain revision identity or sufficient immutable snapshots.
- Seed and deployment operations do not overwrite live-authored content.
- Legacy content reads are removed or explicitly documented with a dated removal blocker.
- Complete verification passes according to recorded evidence.
- Documentation matches the implemented system.
- `docs/PROJECT_STATUS.md` marks Phase 2 complete.
- `docs/CURRENT_TASK.md` points to Phase 3 preparation.
- `docs/handoffs/LATEST.md` contains the Phase 2 closeout.

## Phase 2 Start Prompt

Use only after Phase 1 is formally complete:

> Pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Read `START_HERE.md` and every file it requires. Verify from repository evidence that Phase 1 passed its exit gate. Then read `docs/phases/PHASE_02.md`, `docs/phases/PHASE_02_TECHNICAL_BLUEPRINT.md`, `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`, and `docs/phases/P2_T00_RUNTIME_CONTENT_BASELINE.md`. Replace `docs/CURRENT_TASK.md` with only `P2-T00`, complete the runtime-content baseline and migration map, and stop before implementation.