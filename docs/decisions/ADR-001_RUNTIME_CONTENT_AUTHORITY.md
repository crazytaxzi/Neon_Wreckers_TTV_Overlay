# ADR-001: Runtime Content Authority

**Status:** Accepted for Phase 2 design; implementation blocked until Phase 2 is active  
**Decision date:** 2026-07-28  
**Prepared against:** `main` commit `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`  
**Parent authority:** `docs/PRIME_DIRECTIVE.md`  
**Phase authority:** `docs/phases/PHASE_02.md`

## Context

Neon Wreckers currently has a reliable source-controlled content system, but the schema definitions, file reads, cross-reference construction, and frozen runtime objects are combined in one module. The API, worker, seed, and services import those objects directly, so content is normally fixed for the life of each process.

The database also contains `ContentVersion` rows with lifecycle, scheduling, validation, expiry, and author information. The worker can activate scheduled rows, and authored expeditions can read active rows, but the broader runtime continues using process-imported source content.

This creates several problems:

- Database activation is not the runtime authority for most content.
- API and worker can interpret content through different paths.
- Per-slug activation cannot guarantee one compatible whole-game set.
- A running durable job can resolve after content changes without a complete stable binding.
- Seed behavior can later overwrite fields that operators expect to control live.
- The future desktop Studio would have no safe universal publication target.

## Decision

Phase 2 will establish one authoritative immutable whole-content revision system.

The following decisions are binding unless replaced by a newer ADR:

1. The active database content pointer becomes the runtime authority after controlled cutover.
2. Source-controlled `content/base` remains the deterministic bootstrap, development, test, and disaster-recovery source.
3. Source content and database-authored content compile into the same canonical content-envelope shape.
4. Published content revisions are immutable.
5. A correction creates a new revision.
6. One atomic pointer selects the active compatible content set.
7. API and worker use the same runtime resolver and schema interpretation.
8. Activation changes the pointer in a database transaction and records an audit entry.
9. Rollback is an activation targeting a prior published compatible revision.
10. Cross-process invalidation is advisory; the durable database pointer remains the truth.
11. Every process must eventually detect a pointer change even when it misses a transient invalidation message.
12. Durable activities retain a revision identifier, an immutable snapshot, or both, sufficient to preserve deterministic resolution.
13. Content remains declarative and cannot contain arbitrary executable code.
14. The Studio, when built later, communicates only through authenticated API operations.
15. Existing `ContentVersion` data is migrated or retained safely before its runtime path is retired.
16. Seed and deployment operations must not silently replace live-authored active content after cutover.

## Canonical Authority Order

After Phase 2 cutover, runtime content authority is:

1. A durable activity's bound immutable snapshot where that snapshot is the defined resolution authority
2. The durable activity's bound published revision
3. The active database content pointer for a new operation
4. Source-controlled base content only during explicit bootstrap, controlled import, tests, development compilation, or documented disaster recovery

A process-local cache is never authoritative. It is an optimization of one of the sources above.

## Publication Versus Activation

Publication and activation are separate actions.

### Publication

Publication:

- Requires complete schema, semantic, cross-reference, and compatibility validation
- Produces an immutable revision
- Computes and stores a deterministic digest
- Records the publishing actor and time
- Does not automatically change live gameplay unless an explicitly authorized workflow combines the actions transactionally after all checks

### Activation

Activation:

- Requires a published compatible revision
- Updates one active pointer atomically
- Records previous and new revision identity
- Records the actor and request context
- Commits before invalidation is broadcast
- Does not mutate the revision

This separation allows review, preview, scheduling in later phases, safe rollback, and controlled release operations.

## Runtime Resolver

The shared runtime resolver must:

- Load the active revision identity
- Load a specific revision by identifier
- Verify schema version and digest
- Parse the canonical content envelope
- Build immutable runtime indexes
- Cache safely
- Invalidate explicitly
- Recover from missed invalidation by rechecking the durable pointer

The API and worker may each have process-local caches, but they must consume the same resolver package or contract and produce the same revision identity and runtime interpretation.

## Cross-Process Invalidation

The preferred pattern is:

1. Commit the active pointer and audit record.
2. Publish a Redis invalidation message through existing infrastructure.
3. Invalidate API and worker caches.
4. Emit a public `content.revision.changed` realtime event from the API.
5. Recheck the database pointer at a bounded interval or safe operation boundary.

Redis and WebSocket messages improve responsiveness. They do not replace the database pointer.

A missed message may cause temporary staleness within the documented bound, but it must not leave a process permanently stale.

## Durable Activities

A durable activity is any operation created now and resolved later, or any record whose rules must remain stable over time.

Examples include:

- Expeditions
- Crafting jobs
- Scheduled events
- Queued worker jobs
- Seasonal transitions
- Marketplace or auction terms that outlive the request that created them

Each durable activity must explicitly define whether its authority is:

- A complete immutable snapshot
- A revision identifier
- A revision identifier plus a partial snapshot

Resolving with the currently active revision without an explicit compatibility guarantee is not acceptable.

## Existing ContentVersion Transition

The existing per-slug `ContentVersion` path will not be deleted first.

The migration must:

- Inventory existing rows and deployed semantics
- Preserve authored expeditions
- Compile a compatible initial whole revision
- Transition readers incrementally
- Provide recovery instructions
- Prove no runtime consumer remains before retirement

A temporary compatibility adapter is allowed only when:

- Its exact purpose is documented
- It has tests
- It has a removal task and stopping condition
- It does not create two permanent authorities

## Consequences

### Positive

- API and worker share one content truth.
- Content can activate without process restarts.
- Rollback becomes a pointer operation.
- Cross-domain compatibility can be validated as one set.
- The future Studio has a safe publication target.
- Historical revisions remain inspectable.
- Durable jobs can remain deterministic.
- Source control remains useful for bootstrap and recovery.

### Costs

- Database migration and deployed-data handling become more complex.
- Runtime services need async content resolution or a managed snapshot lifecycle.
- More tests are required around caching, concurrency, migration, and rollback.
- Existing direct imports must be migrated gradually.
- Seed and deployment assumptions must change.
- Revision retention consumes storage.

### Risks

- A careless flag-day cutover could break most gameplay paths.
- Two active authorities could emerge during transition.
- A lost invalidation message could leave a process stale without pointer revalidation.
- Removing old definitions could break persisted player records.
- Binding only a top-level expedition definition may still miss ship, item, module, or balance dependencies used later.

These risks are why Phase 2 begins with `P2-T00` and proceeds through narrow work units.

## Rejected Alternatives

### Keep source files as the only runtime authority

Rejected because it requires deployment or restart for ordinary content changes and cannot support the planned Studio workflow.

### Use per-slug active ContentVersion rows as the final system

Rejected because independent activation does not provide one atomic compatible set and complicates rollback across interdependent domains.

### Let API and worker maintain separate loaders

Rejected because it permits interpretation drift and duplicated logic.

### Store only mutable current content

Rejected because it destroys rollback, auditability, deterministic durable-job resolution, and historical inspection.

### Trust Redis or WebSocket as the authority

Rejected because messages can be missed and those systems are not the durable source of truth.

### Permit executable mod code

Rejected because it would bypass the controlled server behavior boundary and create unacceptable security and deployment risk.

## Implementation Constraints

- Phase 1 must close first.
- `P2-T00` must reverify this decision against actual source and deployed-data assumptions.
- Material changes require a superseding ADR.
- Exact model and package names may be refined without replacing this ADR when the core authority model remains unchanged.
- No Phase 2 code may be introduced during current Phase 1 cleanup tasks.

## Verification Required Before This ADR Is Fully Realized

The implementation is complete only when tests prove:

- One active pointer is enforced.
- Published revisions cannot be mutated.
- Invalid content cannot publish or activate.
- Concurrent activation produces one valid winner and consistent audit state.
- API and worker report the same active revision.
- A missed invalidation is recovered.
- Rollback restores a previous revision without rewriting history.
- Old durable activities resolve with their bound content after newer activation.
- Seed and deployment do not overwrite active live content.
- Source-controlled base compilation is deterministic.