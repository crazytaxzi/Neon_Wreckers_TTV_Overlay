# Neon Wreckers Prime Directive

**Status:** Authoritative project control document  
**Applies to:** All development, refactoring, deployment, administration, content tooling, and AI-assisted work in this repository  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`

## 1. Primary Objective

Convert Neon Wreckers into a modular, data-driven, production-ready stream game with a separate desktop management application, while preserving the existing game, accessibility options, visual identity, player data, security boundaries, and deployment stability.

The final system must allow authorized operators to create, edit, preview, schedule, activate, deactivate, and roll back game content without rebuilding or restarting the server for ordinary content changes.

This includes, but is not limited to:

- Ships
- Crew
- Items
- Modules
- Upgrades
- Upgrade limits
- Ship skins and unlimited optional variants
- Card layouts and presentation settings
- Artwork and portraits
- Expeditions
- Runtime events
- Loot tables
- Marketplace content
- Crafting recipes
- Balance values
- Themes
- Seasonal packs
- Holiday packs
- Subscriber content
- One-time stream events
- Overlay presentation content

New executable mechanics still require normal development, review, testing, and deployment. Uploaded content or mod packs must never contain arbitrary executable code.

## 2. Non-Negotiable Rules

Every change must preserve these rules unless this document is intentionally amended in a dedicated, reviewed commit.

1. Preserve existing gameplay unless the active task explicitly authorizes a mechanic change.
2. Preserve accessibility features and keyboard, mouse, touch, and responsive behavior.
3. Preserve existing player data and provide a migration and rollback path for schema changes.
4. Keep the API authoritative for rewards, inventories, cooldowns, authentication, saves, permissions, and anti-cheat rules.
5. The desktop management application must communicate through authenticated API endpoints. It must not connect directly to the production database.
6. Twitch, StreamElements, database, and infrastructure secrets must remain server-side.
7. Content changes must be schema-validated and cross-reference-validated before activation.
8. Published content revisions must be immutable. Corrections create a new revision.
9. Activation and rollback must be atomic and auditable.
10. Running expeditions, events, crafting jobs, and other durable activities must retain the content revision or snapshot with which they began.
11. The game client, overlay, preview tools, API, and worker must use the same shared contracts, asset registry, and presentation definitions where applicable.
12. Do not maintain two active systems that solve the same problem. Complete migrations and remove the obsolete path.
13. Do not introduce microservices without a specific, measured operational need.
14. Do not redesign unrelated UI, rebalance unrelated content, or add unrequested features during cleanup or infrastructure work.
15. Do not leave temporary patches, commented-out legacy implementations, fake backends, placeholders, or silent compatibility layers without an explicit removal plan.

## 3. Definition of Drift

Drift occurs when work expands beyond the active task without an explicit scope change.

Examples include:

- Redesigning a screen while extracting its components
- Changing balance values while moving content into schemas
- Adding a new event while repairing the event runtime
- Replacing deployment infrastructure during an unrelated UI task
- Editing files outside the declared task scope because they appear nearby
- Starting the desktop Studio before the content runtime and activation system are stable
- Keeping a newly discovered improvement inside the current change instead of placing it in the backlog

Discovered ideas must be recorded for later. Discovery does not grant permission to implement them.

## 4. Required Work Order

The project must proceed through controlled phases. A later phase may not begin until the previous phase passes its exit gate.

### Phase 1: Structural Stabilization

Goals:

- Split oversized admin frontend modules into focused features
- Split oversized admin API routes by responsibility
- Consolidate duplicated contracts and types
- Remove confirmed dead packages, compatibility shims, obsolete scripts, and duplicate documentation
- Centralize duplicated event execution logic
- Preserve all current gameplay and presentation behavior
- Establish reliable tests and build checks around changed areas

Forbidden during this phase:

- New gameplay mechanics
- Balance changes
- Large visual redesigns
- Desktop Studio implementation
- Holiday or event content creation
- Unrelated deployment changes

Exit gate:

- Type checking passes
- Tests pass
- Production builds pass
- Existing admin functions remain available
- Existing permissions remain enforced
- No unrelated behavior changed
- Documentation matches the actual workspace and deployment structure

### Phase 2: Runtime Content Foundation

Goals:

- Create shared editable content schemas
- Create a runtime content loader used by both API and worker
- Store immutable content revisions
- Create an atomic active-content pointer
- Validate schemas and cross-references before publishing
- Broadcast content revision changes
- Support safe rollback
- Preserve snapshots or revision references for running activities
- Prevent startup seed operations from overwriting live-authored content

Exit gate:

- API and worker resolve the same active revision
- Normal content changes require no server restart
- Activation is atomic
- Rollback is proven
- Invalid content cannot activate
- Running activities remain deterministic after later content changes
- Audit records identify who changed what and when

### Phase 3: Shared Assets and Presentation

Goals:

- Create one asset registry for game, overlay, API, worker, preview tools, and Studio
- Support authenticated uploads
- Hash assets and store immutable variants
- Generate required responsive image sizes
- Replace hard-coded, app-local asset exceptions
- Create shared card templates and renderers for crew, ships, items, expeditions, and related content
- Ensure the Studio preview uses the same renderer as the player-facing surfaces

Exit gate:

- Uploaded assets resolve through logical asset keys
- Game, overlay, and preview render the same selected assets
- Card previews match the live card implementation
- Broken or missing assets fail gracefully
- Asset replacement does not silently mutate old revisions

### Phase 4: Neon Wreckers Studio

Goals:

- Build a separate desktop management application
- Authenticate through device pairing or scoped, revocable credentials
- Provide content editors, asset management, preview, scheduling, activation, rollback, and audit history
- Provide a card designer using controlled templates and settings
- Provide live operations controls without exposing infrastructure secrets

Required workspaces:

- Asset Studio
- Card Designer
- Content Workshop
- Event Composer
- Preview Stage
- Live Operations
- Audit and Recovery

Exit gate:

- Operators can safely edit and preview supported content
- Publishing requires validation
- Activation and rollback work from the Studio
- Permissions are enforced by the API
- Studio credentials can be revoked
- The Studio contains no production database credentials or integration secrets

### Phase 5: Packs, Seasons, and Event Modularity

Goals:

- Support declarative content packs with explicit priority
- Support scheduled seasonal and holiday packs
- Support temporary stream overrides
- Support clean activation, deactivation, expiry, and rollback
- Prevent arbitrary JavaScript or executable uploads

Default priority order:

1. Base Game: `0`
2. Mods: `100`
3. Season or Holiday: `200`
4. Live Stream Override: `300`

Exit gate:

- Pack precedence is deterministic
- Conflicts are reported before activation
- Expired packs deactivate safely
- Removing a pack restores the correct lower-priority content
- Active sessions remain bound to their starting revision or snapshot

## 5. Current Task Protocol

Only one implementation task may be active at a time.

Before changing code, create or update `docs/CURRENT_TASK.md` with:

```text
Task:
Reason:
Authorized files or directories:
Explicitly forbidden changes:
Expected behavior change:
Expected behavior that must remain unchanged:
Validation commands:
Rollback method:
Completion evidence:
```

Rules:

1. The task must be small enough to describe in one clear sentence.
2. Only authorized files may be changed unless a newly required dependency is documented before modification.
3. A task cannot silently expand.
4. A newly discovered problem must be recorded in the backlog unless it blocks completion.
5. Blocking scope changes must be documented in `docs/CURRENT_TASK.md` before continuing.
6. Complete, close, or deliberately abandon the current task before beginning another.

## 6. Sprint Protocol

Each sprint must have a file under `docs/sprints/` containing:

- Objective
- Included work
- Explicit exclusions
- Ordered task list
- Acceptance criteria
- Validation commands
- Known risks
- Rollback requirements
- Exit gate

A sprint is complete only when every acceptance item has evidence. Code appearing cleaner is not sufficient proof.

## 7. Change Decision Test

Before implementing any change, answer all of the following:

1. Does this directly support the active task?
2. Is it authorized by the current sprint?
3. Does it preserve the Prime Directive?
4. Can it be tested or otherwise verified?
5. Is there a safe rollback path?
6. Does it remove or replace old complexity rather than merely adding another layer?

If any answer is no, stop and move the idea to the backlog or amend the task explicitly.

## 8. Commit Discipline

Commits must be small, intentional, and single-purpose.

Good examples:

```text
refactor(admin): extract expedition editor
refactor(api): separate content administration routes
feat(content): add immutable revision resolver
test(content): verify atomic rollback
```

Bad examples:

```text
massive cleanup
updates
admin improvements and other fixes
```

Rules:

1. Stage only files belonging to the active task.
2. Do not hide unrelated changes inside a convenient commit.
3. A commit should be explainable in one sentence.
4. Refactors and behavior changes should be separated when practical.
5. Database migrations must include forward validation and rollback or recovery instructions.
6. Generated files must be reproducible and clearly identified.

## 9. Required Change Record

Every completed task must record:

```text
Task:
Reason:
Files changed:
Behavior changed:
Behavior preserved:
Tests and checks performed:
Results:
Known risks:
Rollback method:
Deferred discoveries:
```

This may live in the sprint file, pull request, or active change ledger, but it must exist before the task is considered complete.

## 10. Architecture Decision Records

Material architectural choices must be documented under `docs/decisions/` before or alongside implementation.

Initial binding decisions:

- Studio communicates through the authenticated API.
- Published content uses immutable revisions.
- Running activities retain revision references or snapshots.
- Uploaded packs cannot contain arbitrary executable code.
- The API remains authoritative for security-sensitive state.
- API and worker use the same runtime content resolver.
- Shared presentation components render the same content definitions across preview and live surfaces.

A decision may be replaced only by a newer decision record that explains the reason, migration, risks, and rollback strategy.

## 11. Automated Gates

Changes must be blocked when applicable checks fail.

Required checks include:

- Formatting
- Linting
- Type checking
- Unit tests
- Integration tests
- Production builds
- Workspace dependency audit
- Contract validation
- Content schema validation
- Cross-reference validation
- Migration consistency
- Permission and authentication checks
- Seed safety checks

Do not bypass failing checks merely to complete a sprint. Fix the issue or document a legitimate environment limitation with reproducible evidence.

## 12. Security Boundaries

The following remain server-controlled:

- Twitch authentication
- StreamElements integration
- Player identity
- Rewards and currency
- Inventory mutations
- Cooldowns
- Game saves
- Administrative permissions
- Audit records
- Database transactions
- Content activation
- Anti-cheat enforcement

The Studio may request authorized operations, but the server validates and performs them.

## 13. Content and Mod Safety

Content packs may contain approved declarative data and assets only.

Allowed examples:

- Data records
- Balance values
- Loot definitions
- Event schedules
- Existing action types
- Card templates and controlled style options
- Image, audio, and approved media assets
- Text and localization

Not allowed:

- Arbitrary JavaScript
- Native executables
- Shell commands
- Database scripts supplied as content
- Unvalidated HTML
- Secret values
- Direct database credentials
- Code that bypasses server permissions

A completely new mechanic requires a normal code change and deployment.

## 14. Definition of Done

A task is done only when:

- The requested behavior exists
- Required existing behavior is preserved
- Relevant tests pass
- Relevant builds pass
- Permissions remain correct
- Documentation is updated
- No temporary duplicate implementation remains
- Rollback is known
- Deferred discoveries are recorded
- The final diff contains no unrelated changes

## 15. Stop Conditions

Work must stop before publishing when:

- The active task is unclear
- The proposed change violates this directive
- Unrelated user changes are present and cannot be safely separated
- Tests reveal an unexplained regression
- A migration risks player data without a recovery path
- Authentication or permission boundaries would be weakened
- The implementation requires storing production secrets in a client application
- A content upload would execute arbitrary code
- The diff cannot be explained as part of the active task

## 16. Required Status Report

At any point during implementation, the person or agent performing the work must be able to state:

```text
What I am doing
Why I am doing it
Which files I am changing
What I am deliberately not changing
How I will prove it works
How it can be rolled back
What comes next
```

If these answers are not clear, the work has drifted and must be brought back under control before continuing.

## 17. Authority

This file is the controlling project directive.

When a prompt, task, idea, older document, generated plan, or incidental code comment conflicts with this file, this file wins unless the repository owner explicitly changes the directive.

The correct response to a tempting unrelated improvement is not to implement it. Record it, finish the active task, pass the gate, and return to it deliberately.