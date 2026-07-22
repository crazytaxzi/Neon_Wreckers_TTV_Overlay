# Database and domain model guide

The authoritative Prisma schema is `infrastructure/database/prisma/schema.prisma`. The executable production baseline is `infrastructure/database/prisma/migrations/20260712000000_initial_schema/migration.sql`. Repository tests keep their models, enums, and indexes aligned.

## Identity and player ownership

- `User` maps an immutable Twitch user ID to display information and roles.
- `Session` stores only a hash of the opaque session token, expiration, and revocation state.
- `Player` owns progression, career, reputation, title, credits, inventory capacity, and player-scoped relationships.

A Twitch sign-in creates or updates the user and serializes starter player, ship, and crew creation inside a transaction. Viewer tokens remain transient. The streamer authorization required for EventSub is stored separately in `TwitchCredential` using authenticated AES-256-GCM encryption so it can be renewed and revoked without exposing plaintext provider credentials.

## Shared station world

- `Station` owns shared state such as level, population, power, morale, integrity, storage, and threat.
- `StationResource` stores uniquely named station resources.
- `StationModule` stores module level, lifecycle state, construction progress, integrity, visual key, and effect data.
- `Plaque` records module-linked recognition.
- `StationAlert` stores time-bounded operational notices.
- `Wreck` stores the current salvage opportunity, remaining integrity, depletion state, visual key, and loot budget.
- `HistoryEntry` records station and optional player events for the web app and overlay.

Wreck creation and salvage use a shared PostgreSQL advisory transaction lock so multiple API processes cannot create or mutate the active wreck concurrently.

## Player-owned game state

- `InventoryStack` is unique by player and item slug.
- `Ship` stores owned hull state, fuel, cargo capacity, upgrades, and visual key.
- `CrewMember` stores role, level, morale, injuries, and traits.
- `Expedition` stores definition, risk, launch and resolution times, status, rewards, and incident log.
- `Notification` stores player-facing messages and optional deep links.
- `ActionCooldown` stores restart-safe action windows; `ActionReceipt` stores generic idempotent outcomes.
- `QuartersLayout`, `MuseumExhibit`, and `MarketTransaction` persist habitat, donation, and station-trade activity.
- Expeditions persist their selected ship and crew IDs so active assets cannot be assigned twice.

`ActionCooldown` is unique on `(playerId, actionKey)` and indexed by `expiresAt`. Correctness-sensitive actions acquire a transaction-scoped PostgreSQL advisory lock derived from the same pair, read the row, reject an unexpired action, and upsert the next expiry inside the transaction that performs the protected mutation. The row survives API restarts, while the advisory lock prevents concurrent replicas from both passing the read-before-write boundary. Expired rows are reused rather than accumulated per attempt.

Construction uses conditional inventory updates to prevent double-spending. Expedition resolution and claiming use conditional status transitions so rewards cannot be granted twice.

## Operations and audit

- `LoyaltyTransaction` is the durable point-action ledger. Its unique idempotency key is authoritative across restarts and multiple API processes. Statuses are `pending`, `committed`, `refunded`, `ambiguous`, and `failed`.
- `ContentVersion` stores immutable versioned configuration records with lifecycle and scheduling metadata.
- `AuditLog` records privileged actions with actor, request ID, target, and before/after data.
- `ExternalEvent` deduplicates Twitch callbacks, while `RuntimeEvent` records active and completed content-defined events.

The runtime game baseline is loaded from source-controlled content at process startup. `ContentVersion` is an operations record and audit trail; it does not silently replace source-controlled balance data.

## Migration and seed commands

```bash
pnpm run db:migrate
pnpm run db:seed
```

Production Compose runs migration and the compiled idempotent seed through the one-shot `setup` service before the API or worker starts.

## Change rules

Every schema change requires a committed SQL migration, empty-database verification, upgrade verification, schema/migration parity checks, and a rollback or restore plan. Production deployment never uses `prisma db push`. New durable cooldown keys must be stable domain identifiers and must be enforced inside the transaction that grants the protected outcome.
