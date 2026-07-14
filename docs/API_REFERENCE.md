# API reference

Most successful versioned endpoints return `{ "data": ..., "requestId": "..." }`. Errors return `{ "error": { "code": "...", "message": "..." }, "requestId": "..." }`.

## System

- `GET /health` reports API process health.
- `GET /ready` verifies database readiness.
- `GET /metrics` reports WebSocket connection count and loyalty provider mode. The production gateway does not expose this route.
- `GET /api/v1/ws` upgrades to the realtime WebSocket feed.

## Authentication

- `GET /api/v1/auth/twitch/start` begins Twitch OAuth and sets a signed, short-lived state cookie.
- `GET /api/v1/auth/twitch/callback` validates signed state, exchanges the code, creates or updates the Twitch user and starter records, and creates a signed session cookie. Provider access and refresh tokens are not retained.
- `POST /api/v1/auth/logout` revokes the current database session.
- `GET /api/v1/me` returns the signed-in user and player record.

## Station and player data

- `GET /api/v1/station`
- `GET /api/v1/wrecks/current`
- `GET /api/v1/inventory`
- `GET /api/v1/ships`
- `GET /api/v1/crew`
- `GET /api/v1/history`
- `GET /api/v1/notifications`
- `GET /api/v1/marketplace/listings`
- `GET /api/v1/quarters`

## Salvage and construction

- `POST /api/v1/salvage/scan`
- `POST /api/v1/salvage/deploy` with `{ "mode": "cutters" | "cargo" | "override" }`
- `POST /api/v1/construction/contribute` with a module slug and nonnegative scrap, electronics, and alloys.

Wreck-changing operations use one PostgreSQL transaction lock. Construction contributions serialize module progress and the contributing player's inventory deductions.

## Point-funded actions

- `POST /api/v1/points/actions/:actionSlug`

An `Idempotency-Key` header is required. Supported actions are `safety_override` and `rush_scan`; their costs are loaded from `content/base/balance.json`. Transaction states are `pending`, `committed`, `refunded`, `ambiguous`, and `failed`.

## Expeditions

- `GET /api/v1/expeditions`
- `POST /api/v1/expeditions/launch`
- `POST /api/v1/expeditions/:id/resolve-now` requires streamer/admin access.
- `POST /api/v1/expeditions/:id/claim`

Definitions are loaded from `content/base/balance.json`. Resolution jobs retry with exponential backoff, update only active expeditions, and claims atomically transition a resolved or failed expedition to `claimed` before rewards are granted.

## Integrations and administration

- `GET /api/v1/integrations/streamelements/health` requires streamer/admin access.
- `GET /api/v1/integrations/streamelements/balance`
- `GET /api/v1/admin/config` requires streamer/admin access.
- `POST /api/v1/admin/config` requires streamer/admin access.
- `POST /api/v1/admin/actions/spawn-wreck` requires streamer/admin access.
