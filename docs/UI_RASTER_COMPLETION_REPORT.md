# Neon Wreckers Shared Raster UI

The player game, admin console, and OBS overlay now consume one painted-raster skin from `packages/ui`.

The four generated final UI images are treated as composition targets, not flattened page backgrounds. Transparent WebP fragments were extracted from those images and the Command Core, Mobile UI, Salvage Bay, and Broadcast Overlay boards. Live HTML still owns every label, value, action, state, and accessibility behavior.

## Shared files

- `packages/ui/assets/raster/`: centralized raster artwork
- `packages/ui/manifests/raster-assets.json`: source hashes, dimensions, application consumers, and scaling rules
- `packages/ui/src/raster-system.css`: shared player/admin/overlay implementation

## Consumption

The player receives the generated logo, player header, command panels, navigation, action controls, rarity slots, notifications, and mobile bottom navigation. The admin receives the same panel, button, navigation, table, warning, and header system. The overlay receives the shared panel language plus its OBS canvas frame, ticker, event popup, raid presentation, breaking state, and transparent presentation rules.

No gameplay, API, authentication, Twitch, StreamElements, WebSocket, polling, telemetry, or server-authority behavior is changed.

## Deliberately unused artwork

Large composed cards with baked labels or illustrated values were not placed behind live data. Only reusable border and control fragments were extracted, preventing duplicated or false text.
