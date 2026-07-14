# Admin guide

The Streamer Control Center is served at `https://PUBLIC_HOST/admin/`. Access requires a signed-in user whose roles include `streamer` or `admin`. The account matching `STREAMER_TWITCH_ID` receives those roles during Twitch sign-in.

## Interface

The control center uses `@neon-wreckers/ui`, the same component and theme package as the player application. Its command navigation contains:

- **Operations** for station telemetry, StreamElements health, and supported live actions.
- **Config** for reviewed `ContentVersion` records.
- **UI Library** for the live component catalog used when extending future screens.

The catalog demonstrates reusable controls and interaction states. It is a development reference, not a gameplay simulator, and its example actions do not mutate station state.

## Current operations

Spawn wreck calls the current authoritative admin endpoint, which uses the same salvage service as player scanning. Locking, cooldown, persistence, and content rules are not duplicated in the browser.

Configuration saves create immutable `ContentVersion` rows and matching `AuditLog` entries with actor and request ID. Lifecycle values are `draft`, `scheduled`, `active`, `retired`, and `archived`. Version allocation remains transactional.

`ContentVersion` is an operations record and audit trail. Live rules still load from source-controlled files under `content/` at process startup. Saving a version does not silently change live balance.

## StreamElements operations

Set `STREAMELEMENTS_PROVIDER=streamelements`, `STREAMELEMENTS_CHANNEL_ID`, and `STREAMELEMENTS_JWT` only on the server. Check integration health from an authorized session before enabling `FEATURE_POINTS_ACTIONS`.

Point-funded requests require an `Idempotency-Key`. The database unique constraint is authoritative across restarts and API replicas. Transaction states are `pending`, `committed`, `refunded`, `ambiguous`, or `failed`. A provider debit failure is recorded as failed and is never refunded. Compensation runs only after a confirmed debit followed by a game-state failure.

## Audit and incident review

Use request IDs from the UI or API response to correlate gateway, API, and worker logs. For state incidents, inspect `HistoryEntry`, `LoyaltyTransaction`, `AuditLog`, inventory, the current wreck, expedition status, and worker logs. Never repair authoritative state through browser storage.

## Safe administration

Do not place Twitch or StreamElements secrets in content JSON, UI theme files, overlay configuration, screenshots, or support bundles. Take a backup before migrations or direct database repair. Prefer supported services and transactional operations over manual SQL, and record unavoidable repairs in the audit trail.
