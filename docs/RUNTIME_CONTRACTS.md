# Runtime contracts

Network-facing payloads are validated by `@neon-wreckers/contracts` before application code consumes them.

## Package structure

- `packages/contracts/src/index.ts`: Zod schemas, inferred types, and parsing helpers.
- `packages/browser-client`: validates API envelopes and optionally validates endpoint data with a supplied schema.
- `apps/api/src/lib/realtime.ts`: validates public realtime events before broadcasting them.
- Player, admin, and overlay clients validate public realtime messages before updating UI state.

## Adopted schemas

The package currently owns success and error envelopes, station alerts, history records, station snapshots, current wrecks, authenticated-user summaries, inventory stacks, ships, crew members, expeditions, and all public realtime event variants.

Realtime events are a discriminated union on `type`. Unknown event types and malformed known events are rejected. Contract failures are logged with validation issues and never applied to live UI state.

## Versioning and compatibility

1. Additive optional fields are backward compatible and do not require a major contract version.
2. New realtime event variants are additive, but consumers must be deployed before producers begin emitting them.
3. Renaming or removing fields, tightening an accepted value, or changing field meaning is a breaking change.
4. Breaking changes require a new endpoint or event version and a compatibility window. Existing `/api/v1` payloads remain supported until all first-party clients migrate.
5. Public schemas use explicit DTO shapes with `.passthrough()` where additive server fields are expected. They do not export Prisma model types.
6. Dates are serialized as ISO-8601 strings at network boundaries. Schemas accept `Date` objects only for server-side validation before serialization.

## Migration status

Core station, current-wreck, history, presence, authenticated-user, inventory, ship, crew, and expedition payloads are covered. The browser client validates every response envelope, while endpoint-specific data validation is being adopted on core game-data and overlay calls first.

Lower-risk catalog, marketplace, crafting, auction, quarters, cooldown, notification, integration-admin, and action-result payloads still use envelope validation with existing local domain types. They remain listed here intentionally rather than being represented as fake public copies of database models.
