# Admin guide

The control center is served at `https://PUBLIC_HOST/admin/`. Access requires a signed-in user whose roles include `streamer` or `admin`. The account matching `STREAMER_TWITCH_ID` receives those roles during Twitch sign-in.

## Current controls

The control center displays station state, StreamElements health, content versions, and the live-operation actions already present in the project. Spawn wreck uses the same salvage scan service as the player route, so cooldown, locking, and persistence rules are not duplicated.

Configuration saves create immutable `ContentVersion` rows and matching `AuditLog` entries with actor and request ID. Lifecycle values are `draft`, `scheduled`, `active`, `retired`, and `archived`. Version numbers are allocated inside a transaction to prevent duplicates.

`ContentVersion` is a reviewed operations record and audit trail. Live game rules continue to load from source-controlled files under `content/` at process startup; saving a version does not silently replace those files or alter live balance.

## StreamElements operations

Set `STREAMELEMENTS_PROVIDER=streamelements`, `STREAMELEMENTS_CHANNEL_ID`, and `STREAMELEMENTS_JWT` only on the server. Use the integration health endpoint from an administrator session before enabling `FEATURE_POINTS_ACTIONS`.

Point-funded requests require an `Idempotency-Key`. The database unique constraint is authoritative across restarts and multiple API processes. Transaction states are pending, committed, refunded, ambiguous, or failed. A provider debit failure is recorded as failed and is never refunded. Compensation is attempted only after a confirmed debit followed by a game-state failure. Investigate ambiguous transactions before manually adjusting a viewer balance.

## Audit and incident review

Use request IDs from the UI or API response to correlate gateway, API, and worker logs. For state incidents, inspect `HistoryEntry`, `LoyaltyTransaction`, `AuditLog`, player inventory, the current wreck, expedition status, and worker logs. Never repair authoritative state through browser storage.

## Safe administration

Do not place Twitch or StreamElements secrets in content JSON, overlay configuration, browser code, screenshots, or support bundles. Take a backup before migrations or direct database repair. Prefer documented services and transactional operations over manual SQL; record any unavoidable repair in `AuditLog` and the incident record.
