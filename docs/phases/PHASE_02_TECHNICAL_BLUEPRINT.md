# Phase 2 Technical Blueprint

**Status:** Prepared design, implementation blocked until Phase 2 activation  
**Prepared against:** `main` commit `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`  
**Phase authority:** `docs/phases/PHASE_02.md`  
**Decision authority:** `docs/decisions/ADR-001_RUNTIME_CONTENT_AUTHORITY.md`

## Purpose

This document converts the Phase 2 objective into a technical target that can be verified, refined during `P2-T00`, and then implemented through narrow tasks.

It is intentionally more specific than the Prime Directive but less authoritative than actual validated source and approved migrations. Exact Prisma names, endpoint paths, package names, and transition details may change during `P2-T00` when repository evidence requires it.

## Current Problem in One Sentence

Neon Wreckers has validated data files and a partial database version system, but most gameplay content is frozen into each API or worker process when the module is imported, so activating a database content row usually does not change the runtime behavior using that content.

## Current System Shape

### Static source layer

`packages/content/src/index.mjs` currently combines four responsibilities:

1. Domain schema definitions
2. File-system reads from `content/base`
3. Cross-reference construction and validation
4. Process-lifetime frozen runtime exports

This makes source content reliable at startup, but it prevents normal active-content changes from flowing through already running processes.

### Partial database layer

The existing `ContentVersion` model supports:

- Per-slug version numbers
- Lifecycle state
- JSON content
- Validation metadata
- Publication time
- Scheduling
- Expiry
- Author attribution

The worker can promote scheduled rows, but most services do not resolve these rows when they need content.

The per-slug model also lacks one atomic compatibility boundary for a full set of interdependent content. Activating an item, loot table, expedition, module, and balance value independently can produce a temporarily incompatible world unless the system activates one validated set.

### Expedition exception

Authored expeditions already prove two useful patterns:

- Active database-authored definitions can override source-controlled definitions.
- Expedition records can retain a definition snapshot.

Phase 2 should preserve those strengths while replacing expedition-only special handling with one general runtime content architecture.

### Worker risk

The worker imports content at startup and later resolves expeditions, crafting jobs, events, seasons, and reconciliation loops. A job created under one definition can currently resolve after a deployment or activation using different supporting values unless a snapshot already covers every required input.

### Seed risk

The seed updates station-module names, visual keys, and effects from source content. That is acceptable while source files are authoritative, but it becomes dangerous after operators can publish live revisions.

## Target Content Envelope

The runtime should consume one canonical whole-content envelope.

Conceptual shape:

```ts
type ContentEnvelope = {
  schemaVersion: number;
  revisionId: string;
  revisionNumber: number;
  digest: string;
  createdAt: string;
  domains: {
    items: ItemDefinition[];
    wrecks: WreckDefinition[];
    modules: ModuleDefinition[];
    initialStation: InitialStationDefinition;
    balance: BalanceDefinition;
    events: EventDefinition[];
    seasons: SeasonDefinition[];
    themes: ThemeDefinitions;
  };
};
```

The exact field split may change, but these rules do not:

- The envelope represents one compatible set.
- The digest is derived from deterministic canonical serialization.
- Published envelopes are immutable.
- Runtime indexes are derived from the envelope rather than stored as separately editable truth.
- Source-controlled `content/base` compiles into the same envelope shape as database-authored content.
- Schema version and content revision are distinct concepts.

## Target Package Boundaries

Names are provisional until `P2-T00` confirms workspace ownership.

### `packages/content-schemas`

Owns:

- Zod schemas
- Inferred content types
- Content envelope schema
- Schema-version compatibility
- Cross-reference validator interfaces
- Canonical serialization rules or shared primitives

Must not own:

- File-system reads
- Prisma
- Redis
- API authorization
- Mutable caches
- Application-specific singletons

### `packages/content-runtime`

Owns:

- Source-content compilation
- Revision parsing and verification
- Runtime index construction
- Immutable runtime snapshot creation
- Active and specific revision resolution
- Cache interface
- Invalidation hooks
- Digest verification

Must not own:

- HTTP routes
- User permission policy
- Direct browser behavior
- Studio UI
- Secret storage

### Existing `packages/content`

Preferred transition:

1. Keep its public exports stable while schemas move to the pure package.
2. Make it a source-content compiler or compatibility entry point temporarily.
3. Migrate consumers to the runtime resolver incrementally.
4. Remove the compatibility surface only after repository-wide import evidence and validation show it is unused.

A permanent duplicate static and runtime content system is not allowed.

## Target Persistence Model

Exact Prisma names are provisional. The required concepts are binding.

### Whole Content Revision

Required properties:

- Stable unique identifier
- Monotonic or otherwise human-readable revision number
- Schema version
- Immutable content JSON
- Deterministic digest
- Lifecycle or publication state
- Validation result and validator version
- Creator identity
- Creation time
- Publication identity and time
- Optional notes or change summary

Rules:

- Draft content may change until publication if drafts are supported.
- Published content never changes.
- Corrections create a new revision.
- The digest is unique or collision-protected according to the selected algorithm.
- Publication requires successful complete validation.

### Active Content Pointer

Required properties:

- Singleton or otherwise uniquely scoped active pointer
- Target revision identifier
- Previous revision identifier where useful for audit and recovery
- Activating actor
- Activation time
- Monotonic generation or version value for cache comparison

Rules:

- The database enforces one active pointer for the game scope.
- Activation changes the pointer in one transaction.
- Consumers read the pointer rather than scanning for many independently active rows.
- The pointer references only a published compatible revision.

### Audit

The existing `AuditLog` may remain the authoritative audit store when it can capture:

- Publication
- Validation rejection
- Activation
- Rollback
- Scheduling when later supported
- Previous and new revision identifiers
- Actor
- Request identifier
- Timestamp

Do not add a second audit system without a demonstrated gap.

### Existing `ContentVersion`

`P2-T00` must determine the safest path from existing rows.

Preferred migration strategy:

1. Inventory production semantics and active authored expeditions.
2. Freeze new feature expansion on the per-slug path.
3. Compile source content plus accepted active authored overrides into one initial whole revision.
4. Preserve existing rows during the transition.
5. Switch expedition reads to the shared runtime resolver.
6. Mark the old table or path read-only after cutover.
7. Remove it only after migration evidence, rollback confidence, and repository-wide consumer checks are complete.

Do not delete existing content rows merely because the new model is cleaner.

## Runtime Resolver Contract

Conceptual interface:

```ts
interface RuntimeContentResolver {
  getActive(): Promise<RuntimeContentSnapshot>;
  getRevision(revisionId: string): Promise<RuntimeContentSnapshot>;
  getActiveIdentity(): Promise<{ revisionId: string; generation: number; digest: string }>;
  invalidate(revisionId?: string): void;
}
```

A runtime snapshot should contain:

- Original immutable envelope
- Verified revision identity
- Read-only indexes such as `itemsBySlug`
- Derived values used by gameplay
- No mutable application state

Rules:

- API and worker import the same resolver implementation or package contract.
- A resolver never silently edits invalid data into validity.
- Missing or corrupt active content is a readiness failure, not an excuse to invent values.
- Controlled bootstrap fallback is allowed only under documented startup conditions.
- Specific-revision resolution must work after that revision is no longer active.

## Source-Controlled Base Revision

`content/base` remains valuable for:

- Fresh installation
- Deterministic tests
- Disaster recovery
- Developer review
- Bootstrapping the first published revision

Phase 2 should add a deterministic compiler that:

1. Reads the source files.
2. Parses them through pure schemas.
3. Validates all cross-references.
4. Produces the canonical envelope.
5. Canonically serializes it.
6. Computes its digest.
7. Can compare the compiled result to a stored revision.

The source tree is not automatically the live runtime authority after database cutover.

## Validation Pipeline

Validation must have distinct layers.

### Structural validation

- Required fields
- Types
- Numeric ranges
- Enumerations
- Slug format
- Array sizes
- Lifecycle rules

### Cross-reference validation

Examples:

- Loot pools reference existing items.
- Initial station modules reference existing module definitions.
- Module prerequisites resolve.
- Seasons reference themes.
- Visual keys exist according to the current asset contract.
- Marketplace and crafting item slugs resolve.
- Ship skins, upgrades, and purchases reference valid classes or declared identities.
- Existing persisted player identifiers remain supported or have a migration.

### Semantic validation

Examples:

- Minimum values do not exceed maximum values.
- Start dates precede end dates.
- Upgrade rules do not create impossible or negative states.
- Event conditions and actions use only registered server-supported types.
- Revision schema version is supported by the running application.

### Compatibility validation

Before activation, validate the target revision against runtime and persisted-data requirements.

Examples:

- Slugs referenced by active player inventory remain resolvable.
- Ship classes owned by players remain resolvable.
- Running durable activities can resolve their bound revision.
- Removed definitions have a retirement plan.

## Canonical Serialization and Digest

The digest must be stable across machines and process runs.

Requirements:

- UTF-8
- Stable object-key ordering
- Defined array ordering where order is not semantically meaningful
- No local paths
- No timestamps generated during digesting
- No JavaScript object identity dependence
- No inclusion of mutable validation logs unless explicitly part of the canonical content

Preferred digest: SHA-256 over canonical JSON bytes.

The digest verifies identity and accidental corruption. It does not replace authorization or database integrity.

## Cache and Cross-Process Invalidation

The API and worker are separate processes. WebSocket broadcast alone cannot invalidate the worker.

Preferred design:

1. The database active pointer is the durable truth.
2. Activation commits the pointer and generation.
3. After commit, the API publishes an invalidation message through existing Redis infrastructure.
4. API and worker subscribers invalidate their cached active snapshot.
5. The API emits `content.revision.changed` through the public realtime contract.
6. Every process also rechecks the durable pointer at a bounded interval or safe operation boundary.

This dual mechanism prevents a lost transient Redis message from leaving a process stale forever.

The exact Redis channel and revalidation interval must be chosen during implementation and tested. Do not poll on every field lookup or trust only pub/sub.

## Realtime Contract

Proposed public event:

```ts
{
  type: 'content.revision.changed',
  revisionId: string,
  generation: number,
  activatedAt: string
}
```

Do not include:

- Draft content
- Secrets
- Actor private information
- Full server-only balance or anti-cheat material unless already intentionally public

Client behavior should be narrow:

- Invalidate public content manifests or affected data.
- Re-fetch through normal authorized/public endpoints.
- Preserve user state.
- Recover through reconnect and normal polling if the event is missed.

## Activation Transaction

Required transaction behavior:

1. Authorize the caller before the transaction.
2. Start a transaction.
3. Acquire a database lock appropriate to the single game content scope.
4. Load the target revision.
5. Verify published state, schema compatibility, digest, and validation status.
6. Read the current pointer.
7. Update the pointer and increment generation.
8. Write the activation or rollback audit record.
9. Commit.
10. Publish cross-process invalidation.
11. Emit the public revision-change event.

Failure rules:

- Transaction failure emits no success response and no activation event.
- Post-commit broadcast failure does not roll back the committed pointer.
- Consumers recover by rechecking the pointer.
- Retrying the same activation should be idempotent or explicitly return that it is already active.

## Rollback

Rollback uses the same activation transaction targeting a previous published revision.

The system should retain enough revision history to:

- Identify the prior active revision
- Inspect its validation and compatibility state
- Reactivate it quickly
- Preserve the failed revision for diagnosis
- Audit the rollback actor and reason

Rollback does not alter durable jobs already bound to another revision.

## Durable Activity Binding

General rule:

> A durable activity must never resolve using an unrelated mutable active definition merely because time passed.

Preferred binding choices:

### Expeditions

Current definition snapshots are useful. Phase 2 should add the revision identity and confirm whether the existing snapshot includes every value required at resolution.

### Crafting jobs

Store the revision identifier and enough immutable recipe terms to resolve safely if the revision later becomes unreadable only under disaster recovery. At minimum, normal resolution must load the bound revision rather than the active revision.

### Runtime events

Store revision identity and either the validated action/condition snapshot or a stable reference to the bound revision.

### Queued worker jobs

Queue payloads may carry the durable record identifier rather than duplicate all content, provided the durable record stores the revision binding.

### Instant request transactions

A request may resolve against the active snapshot captured at the start of the transaction. It should not mix two revisions within one operation.

### Existing records without bindings

Migration behavior must be explicit. Options include:

- Bind to the initial imported revision during migration.
- Use an existing stored definition snapshot.
- Reject unsafe resolution for malformed legacy records and surface an operational repair path.

Silent guessing is not acceptable.

## Seed Safety

After runtime cutover, seed responsibilities must be divided.

### Bootstrap seed may

- Create the station when absent.
- Create required persistence scaffolding.
- Publish or install the initial source-controlled revision when no revision exists.
- Create the active pointer when absent.
- Create missing system records with safe defaults.

### Normal update seed must not

- Rewrite live-authored module names, visual keys, effects, balance, or content fields from source files.
- Replace the active pointer.
- Republish identical content as a new revision without an explicit release operation.
- mutate historical published revisions.

A separate explicit import or publish command is preferable to making deployment seed silently change live content.

## API Surface Draft

Exact paths must follow the established admin route structure after Phase 1 decomposition.

Candidate operations:

- List revisions
- Read one revision and validation summary
- Create or update a draft
- Validate a draft
- Publish an immutable revision
- Activate a published revision
- Roll back to a selected published revision
- Read active revision identity
- Read audit history
- Export a revision

Security rules:

- Streamer or admin role alone may not be sufficient for every operation; confirm existing role policy.
- Mutation routes require server-side schema validation.
- Publication and activation should accept idempotency or conflict protection where practical.
- Audit records must include request identifiers.
- Full sensitive content should not be exposed through public routes.

## Incremental Cutover Strategy

Avoid switching every consumer at once.

Preferred order:

1. Extract pure schemas with no runtime behavior change.
2. Compile source content into the canonical envelope and prove parity.
3. Add persistence and active pointer without changing consumers.
4. Build and test the resolver.
5. Import source content as the initial revision.
6. Migrate one low-risk API read path.
7. Migrate expedition definitions while preserving snapshots.
8. Migrate additional API domains one by one.
9. Add durable bindings before worker cutover for each job type.
10. Migrate worker domains and jobs one by one.
11. Add authorized publication, activation, rollback, and invalidation.
12. Protect seed and deployment.
13. Remove obsolete reads only after repository-wide proof.

The exact first domain must be selected during `P2-T00` using dependency and risk evidence.

## Failure and Readiness Behavior

The system must distinguish:

- No database revision exists during first bootstrap
- Active pointer is missing unexpectedly
- Active revision is missing
- Digest verification fails
- Schema version is unsupported
- Content validation fails
- Redis invalidation is unavailable
- Browser realtime delivery is unavailable

Recommended behavior:

- Bootstrap state may compile and install source content through an explicit controlled path.
- Corrupt or missing active runtime content should fail readiness and block unsafe operations.
- Redis outage should not corrupt the active pointer; processes must recover through database revalidation.
- WebSocket outage should not prevent activation, but clients must recover through normal fetch behavior.

## Observability

Add metrics and structured logs for:

- Active revision identity
- Resolver cache hits and misses
- Revision load failures
- Digest failures
- Validation failures by category
- Activation attempts and outcomes
- Rollback attempts and outcomes
- Invalidation publish and receive events
- Pointer-generation mismatch recovery
- Durable job revision-load failures

Do not log full secret-bearing payloads or unnecessarily dump complete content revisions.

## Test Architecture

### Unit tests

- Every domain schema
- Envelope schema
- Cross-reference validator
- Canonical serialization
- Digest stability
- Runtime index construction
- Resolver cache behavior

### Persistence tests

- Draft mutation versus published immutability
- Unique active pointer
- Concurrent activation
- Audit transaction
- Existing `ContentVersion` migration
- Rollback target validation

### API tests

- Authorization
- Validation errors
- Publication
- Activation
- Idempotent or conflict behavior
- Rollback
- Active identity reads
- Audit records

### Worker tests

- Same revision as API
- Bound expedition resolution
- Bound crafting resolution
- Old revision after new activation
- Cache invalidation
- Missed-message recovery

### Repository and deployment tests

- Seed does not overwrite live content
- Clean install produces an initial revision
- Update preserves active revision
- Backup includes revision data and pointer
- Restore preserves history and active identity
- All workspaces build

## Phase 2 Preparation Limits

While Phase 1 remains active, this blueprint may be refined as documentation only.

Do not use it to justify:

- Creating packages
- Adding Prisma models
- Editing seed
- Changing content imports
- Adding endpoints
- Adding realtime events
- Migrating data
- Starting Studio or mod-pack work

The first authorized action after Phase 1 closes is `P2-T00`, not implementation.