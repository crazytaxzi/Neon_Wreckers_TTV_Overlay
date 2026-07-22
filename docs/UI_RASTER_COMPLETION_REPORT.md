# Neon Wreckers Shared Raster UI Completion Report

## Result

The player game, admin console, and transparent OBS overlay now consume one painted-raster skin owned by `packages/ui`.

The generated player, mobile, admin, and overlay images are composition targets rather than flattened page backgrounds. Reusable transparent WebP chrome was extracted from those images and the Command Core, Mobile UI, Salvage Bay, and Broadcast Overlay boards. Live HTML still owns every label, value, action, interaction state, API response, WebSocket update, and accessibility behavior.

Implementation commit: `4c0a265570b49961826ee146737db9daeb53d698`
Final proof commit: `e356d9936e875fe2c68a60ea76dc4c865a7466ed`

## Shared ownership

- `packages/ui/assets/raster/`: centralized transparent raster artwork
- `packages/ui/manifests/raster-assets.json`: source hashes, dimensions, consumers, transparency, scaling, and accessibility metadata
- `packages/ui/src/raster-system.css`: shared player, admin, and overlay implementation
- `packages/ui/src/index.ts`: imports the raster system after the established shared styles
- `tools/test/ui-raster-system.test.mjs`: shared-system and application-consumption contracts

No raster asset or component implementation is copied into an individual application.

## Extracted assets and consumers

| Asset | Source | Shared use | Applications |
| --- | --- | --- | --- |
| `panel-frame.webp` | Command Core / generated player | Primary painted panel frame | Player, Admin, Overlay |
| `panel-purple-gen.webp` | Generated player/admin targets | Purple emphasis panel | Player, Admin, Overlay |
| `panel-rail.webp` | Command Core | Section header and compact rail | Player, Admin, Overlay |
| `button-green.webp` | Command Core | Primary, confirm, deploy, active controls | Player, Admin, Overlay |
| `button-purple.webp` | Command Core | Secondary and selected controls | Player, Admin, Overlay |
| `button-neutral.webp` | Command Core | Disabled, ghost, and neutral controls | Player, Admin, Overlay |
| `slot-common.webp` | Command Core | Common rarity and empty inventory shell | Player, Admin, Overlay |
| `slot-green.webp` | Command Core | Uncommon rarity shell | Player, Admin, Overlay |
| `slot-purple.webp` | Command Core | Epic rarity shell | Player, Admin, Overlay |
| `slot-blue.webp` | Command Core | Rare rarity shell | Player, Admin, Overlay |
| `slot-gold.webp` | Command Core | Legendary rarity shell | Player, Admin, Overlay |
| `mobile-nav.webp` | Mobile UI / generated mobile | Five-destination mobile navigation frame | Player, Admin |
| `profile-header-gen.webp` | Generated mobile | Compact player/admin identity framing | Player, Admin |
| `nav-green-gen.webp` | Generated player/mobile | Active navigation treatment | Player, Admin |
| `nav-purple-gen.webp` | Generated player/mobile | Secondary navigation treatment | Player, Admin |
| `action-green-gen.webp` | Mobile UI / generated mobile | Touch action control | Player, Admin |
| `action-purple-gen.webp` | Mobile UI / generated mobile | Touch secondary action control | Player, Admin |
| `alert-red.webp` | Salvage Bay | Critical hazard and validation alert | Player, Admin, Overlay |
| `alert-red-large.webp` | Salvage Bay | Large danger and breaking state | Player, Admin, Overlay |
| `overlay-canvas-frame.webp` | Broadcast Overlay | OBS-safe outer canvas framing | Overlay |
| `overlay-ticker-purple.webp` | Broadcast Overlay | Ticker, dispatch, and live-feed rail | Overlay |
| `overlay-event-purple.webp` | Broadcast Overlay | Follower, donation, and event popup | Overlay |
| `overlay-breaking.webp` | Broadcast Overlay | Breaking alert presentation | Overlay |
| `generated-logo.webp` | Generated player/admin/overlay targets | Shared Neon Wreckers brand raster | Player, Admin, Overlay |
| `generated-raid.webp` | Generated overlay target | Raid and major-event presentation | Player, Admin, Overlay |

## Application integration

### Player game

The player application receives the generated brand raster, player identity header, command panels, section rails, desktop navigation, mobile bottom navigation, touch actions, buttons, inventory rarity shells, alerts, notifications, and responsive raster treatments from the shared package. Existing station, wreck, module, ship, inventory, resource, market, crew, and expedition data remains live.

### Admin console

The admin console receives the same painted panels, headers, tabs, buttons, status treatments, warning frames, data-container framing, navigation, and compact operational controls. It remains denser than the player interface while visibly belonging to the same product.

### Stream overlay

The overlay receives the shared product chrome plus the Broadcast Overlay canvas frame, ticker, event popup, breaking alert, and raid presentation. Its page background remains transparent, presentation remains noninteractive, and pointer events remain disabled for OBS use.

## Scaling and states

- Painted panel chrome uses raster framing with protected corners and stretchable centers.
- Compact controls use raster backgrounds with live labels layered above them.
- Rarity shells switch raster artwork by semantic rarity.
- Hover, active, selected, disabled, warning, critical, and focus-visible states remain live and accessible.
- Mobile rules select the Mobile UI treatments rather than shrinking desktop controls.
- Reduced-motion and forced-colors fallbacks remain available.
- Assets load through the shared stylesheet and application bundle, preventing late application-specific skin pop-in.

## Deliberately unused artwork

Large composed cards containing baked labels, numbers, example usernames, prices, or example telemetry were not placed behind live data. Doing so would duplicate text, show false values, damage localization and accessibility, and turn the interface into a brittle screenshot mask. Only reusable painted borders, shells, controls, alert frames, navigation, telemetry chrome, branding, and event treatments were extracted.

No supplied reusable painted control was replaced by a new SVG or generic CSS approximation in this implementation.

## Verification

The one-time installer validated the raster archive against SHA-256 `919406b1f06313f6091ad613dde944e6f9bbc1c8a2a4fd22c1177a144d6b0831`, rejected unsafe archive paths, installed the shared assets, and passed the raster contract tests and all four production builds before committing.

The repository's standard workflows then passed on the final proof commit:

- UI Revamp Verify run 188: successful
- UI Visual Proof run 80: successful, including every player destination on desktop and mobile plus tablet and full-page audits
- Admin and Overlay Visual Proof run 62: successful, including desktop, tablet, mobile, 720p, 1080p, 1440p, 4K, viewer-event, and transparent 1080p overlay proof

The transparent overlay proof uses `omitBackground` and a production-style configuration with `previewBackground` disabled. Its alpha channel contains true transparent pixels, proving that the center gameplay area remains clear for OBS.

## Functional preservation

No gameplay rules, balance, rewards, cooldowns, API routes, database schemas, authentication, Twitch integration, StreamElements integration, WebSocket contracts, polling behavior, telemetry contracts, overlay configuration, or server-authority behavior was changed.
