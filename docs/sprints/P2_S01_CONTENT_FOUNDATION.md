# Phase 2 Sprint 1: Content Foundation

**Sprint ID:** `P2-S01`  
**Status:** Prepared, not active  
**Phase:** Phase 2 - Runtime Content Foundation  
**Phase authority:** `docs/phases/PHASE_02.md`  
**Entry gate:** Completed and committed `P2-T00` baseline  
**Decision authority:** `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`

## Sprint Objective

Establish pure shared content schemas, a canonical whole-revision envelope, deterministic source compilation, and reviewed revision-persistence primitives without changing which content is live at runtime.

This sprint creates the floor. It does not turn on the elevator.

## Entry Conditions

Do not begin this sprint until:

- Phase 1 is complete.
- `P2-T00` is complete.
- The current source import graph and migration map are committed.
- Existing `ContentVersion` rows and authored expedition behavior are understood.
- A representative deployed-data migration assumption is documented.
- The first implementation task is recorded in `docs/CURRENT_TASK.md`.
- Baseline validation is recorded.

## Included Work

### Schema ownership

- Move content-domain schemas into a pure shared package or clearly separated pure module.
- Export inferred types from that schema owner.
- Preserve current schema behavior unless a defect is separately approved and tested.
- Preserve current source-content runtime values and public exports during the transition.

### Canonical content envelope

- Define one whole-content envelope.
- Define schema versioning.
- Define deterministic canonical serialization.
- Define SHA-256 content digest behavior.
- Compile current source content into the envelope.
- Prove parity between the envelope-derived runtime indexes and current exports.

### Persistence primitives

- Add reviewed immutable whole-revision persistence.
- Add the atomic active-content pointer structure.
- Add creator, publisher, validation, digest, and schema-version metadata required by Phase 2.
- Preserve existing `ContentVersion` data.
- Add migration and recovery instructions.

### Tests and operational proof

- Add focused schema-parity tests.
- Add deterministic digest tests.
- Add clean and representative-existing-database migration tests where supported.
- Add published immutability tests.
- Add active-pointer uniqueness tests.
- Keep complete repository verification green.

## Explicit Exclusions

This sprint must not:

- Change the active runtime content source
- Cut API services over to the new resolver
- Cut worker jobs over to the new resolver
- Add publication UI
- Add activation or rollback routes
- Add Redis invalidation
- Add a realtime content event
- Change seed behavior beyond migration scaffolding strictly required for the new tables
- Backfill durable activity revision bindings
- Remove `ContentVersion`
- Remove `packages/content`
- Change gameplay, balance, rewards, or content data
- Add new content domains
- Begin Studio, asset registry, cards, or content packs

## Ordered Task Plan

Each task should normally use its own chat and commit boundary.

### `P2-S01-T01`: Pure Schema Extraction

Objective:

> Move only content schemas and inferred types into the approved pure schema owner while preserving every current parsed value, validation rule, source path, and runtime export.

Required proof:

- Existing content files parse identically.
- Invalid fixture behavior remains protected.
- Cross-reference behavior remains protected.
- API, worker, seed, and tests still build against the existing runtime exports.

Stop before creating the revision envelope.

### `P2-S01-T02`: Canonical Revision Envelope

Objective:

> Define the whole-content envelope, schema version, canonical serialization, digest, and source compiler without changing runtime consumers.

Required proof:

- Repeated compilation produces byte-equivalent canonical output and the same digest.
- Object insertion order does not change the digest.
- Current source content compiles successfully.
- Envelope-derived indexes match existing runtime definitions.
- Unknown or incompatible schema versions fail clearly.

Stop before database migration.

### `P2-S01-T03`: Immutable Revision Persistence

Objective:

> Add immutable whole-content revision persistence and its metadata without changing the live runtime authority.

Required proof:

- Clean migration succeeds.
- Representative existing database migration succeeds.
- Published rows cannot be altered through supported application paths.
- Duplicate digest or revision-number behavior follows the approved model.
- Existing `ContentVersion` rows remain intact.
- Recovery instructions exist.

Stop before adding the active pointer when the migration is too large for one safe task. Split the task rather than forcing it.

### `P2-S01-T04`: Atomic Active Pointer Persistence

Objective:

> Add the single game-scope active-content pointer and generation metadata without switching API or worker consumers.

Required proof:

- The database prevents two active pointers for the same scope.
- The pointer references only a valid revision.
- Concurrent update tests produce one consistent active state.
- Existing runtime still uses the old path until an explicit later cutover.

Stop before resolver implementation.

### `P2-S01-T05`: Source Revision Bootstrap Command

Objective:

> Add an explicit, deterministic operation that compiles current source content and installs or publishes the initial whole revision without silently changing the active runtime during ordinary seed execution.

Required proof:

- First installation is idempotent.
- Re-running with identical content does not create uncontrolled duplicate revisions.
- Different content produces a different digest and explicit new revision behavior.
- No existing active pointer is silently replaced.
- Existing seed behavior is not broadly redesigned in this task.

Stop and close the sprint.

## Acceptance Criteria

Sprint 1 is complete only when:

- Pure schemas have no file-system, database, Redis, or application dependency.
- Current source content still validates.
- Current runtime behavior remains unchanged.
- A canonical whole-content envelope exists.
- Source content compiles deterministically.
- Digest stability is proven.
- Immutable revision persistence exists.
- The active pointer persistence structure exists.
- Existing `ContentVersion` data remains preserved.
- No API or worker consumer has silently switched authority.
- Migration and recovery procedures are documented.
- Project-control files and handoff are current.

## Validation Commands

Use focused checks during each task and complete verification before sprint close.

Expected checks include:

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

Database changes also require the repository's migration parity and clean-database checks plus a documented representative-existing-database test.

Do not claim Docker, PostgreSQL, Redis, browser, Twitch, StreamElements, or deployment validation that was not actually run.

## Known Risks

- Schema extraction can accidentally change defaults, passthrough behavior, error paths, or inferred types.
- Canonical serialization can become unstable if array-order semantics are not explicit.
- A new persistence model can accidentally imply runtime authority before consumers are ready.
- Existing authored expeditions can be orphaned if `ContentVersion` is ignored during migration.
- Migration tests can pass on empty databases while failing against real rows.
- A convenience bootstrap inside normal seed can recreate the overwrite problem Phase 2 is intended to solve.
- A compatibility adapter can become permanent unless its removal condition is documented.

## Rollback Requirements

Every task must document its own rollback.

Minimum sprint rollback position:

- Schema extraction can revert without changing stored data.
- Envelope and compiler can revert without changing stored data.
- Database migration has a recovery path that preserves existing rows.
- Adding the pointer structure does not switch runtime authority.
- Bootstrap revisions can remain inert when the pointer is not changed.

Do not drop new tables or columns in production merely to make a rollback look clean when preserving them is safer.

## Sprint Exit Gate

Before `P2-S01` closes:

- All acceptance criteria have evidence.
- Complete verification passes.
- Migration and recovery evidence is recorded.
- `docs/PROJECT_STATUS.md` records the sprint outcome.
- `docs/CURRENT_TASK.md` points to the first runtime-resolver task.
- `docs/handoffs/LATEST.md` contains the sprint handoff.
- The next sprint or task is defined but not started.
- The New-Chat Check is performed.

## Deferred Destination

The next sprint should build and test the shared runtime resolver, then begin narrow API and worker cutovers. Activation, rollback, invalidation, durable activity binding, and seed retirement remain later controlled work unless the verified baseline produces a safer revised order.