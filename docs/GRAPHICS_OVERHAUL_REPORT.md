# Neon Wreckers Synchronized Graphics Overhaul

## Status

This branch implements a graphics-only overhaul across the player application, administrator console, and OBS overlay while preserving the layouts and behavior established by the preceding UI reconstruction.

The visual target is the approved Neon Wreckers concept direction:

- blackened metal and charcoal surfaces
- neon green and electric purple brand accents
- angular tactile frames and controls
- illustrated game glyphs
- rarity and hazard hardware
- compact telemetry
- broadcast lower thirds, alerts, and viewer event frames

Production remains live React, CSS, SVG, and optimized WebP artwork. The concept boards are not embedded as interface screenshots.

## Locked systems

No changes were made to:

- API routes or DTO shapes
- authentication or authorization
- database schema or migrations
- gameplay rules, balance, rewards, cooldowns, or random outcomes
- Twitch or StreamElements integrations
- server authority
- polling or WebSocket message contracts
- OBS transparency, pointer-event, reconnect, or placement behavior
- public routes

## Architecture

### Shared graphics system

`packages/ui` remains the canonical design system. The overhaul adds layered visual modules rather than creating competing per-application component libraries:

- `graphics.css`: metal framing, bevels, telemetry, controls, warning chrome, and shared broadcast treatment
- `illustration.css`: icon plates, rarity hardware, item slots, tactile navigation, and illustrated brand motifs
- `brand-art.css`: corrected Neon Wreckers skull emblem rendered as inline SVG art
- `accessibility-polish.css`: keyboard-only skip-link presentation
- `showcase-graphics.css`: UI Library graphic-language demonstrations
- `viewer-event.css`: real viewer-event broadcast popup treatment

Both direct package imports and `@neon-wreckers/ui/styles.css` export the same layers.

### Native game glyph registry

The shared icon registry now contains custom lightweight SVG glyphs for the core game vocabulary:

- Wrecker skull
- station
- wreck
- salvage cutter
- cargo crate
- crew helmet
- market exchange
- construction tools
- broadcast tower
- hazard skull

These replace generic dashboard icons wherever the semantic names are already used. Labels remain live HTML and status meaning is never communicated by color alone.

### Player graphics

The existing responsive information architecture remains intact. The player gains:

- synchronized brand skull and mobile navigation graphics
- richer buttons, tabs, action tiles, rarity cards, inventory slots, and resource strips
- stronger existing station, wreck, ship, and module artwork framing
- cargo-lattice artwork for the hold
- fabrication-circuit artwork for crafting
- fleet silhouette treatment for ships
- crew helmet treatment for personnel
- radar treatment for expeditions
- exchange treatment for the market
- matching low-effects and forced-colors fallbacks

No fake item illustrations or crew portraits were added. The repository contains real station, module, wreck, and ship artwork, but not a complete production-quality loot or crew illustration set. Unsupported artwork was intentionally omitted rather than fabricated.

### Administrator graphics

The admin application keeps its dense operational layout while adopting the same product identity:

- synchronized command header and brand emblem
- operational grid background
- illuminated command rail
- tactical section frames
- telemetry status tiles
- cyan data-grid and form treatment
- player record hardware
- configuration and JSON console styling
- phone and tablet fallbacks

The UI Library now includes a dedicated **Graphic Language** tab with:

- custom glyph matrix
- rarity frame ladder
- hazard and dispatch treatments
- broadcast examples
- low-effects and accessibility demonstrations

### OBS overlay graphics

The overlay remains transparent, pointer-events free, reconnect-safe, and lightweight. It now includes:

- synchronized station and wreck telemetry frames
- illuminated segment meters
- tactical wreck schematic
- broadcast dispatch rail
- breaking alert treatment
- live-feed indicator
- real viewer-event popup

The viewer popup is rendered only when the current real history or WebSocket event classifies as a viewer event. Supported signals include Twitch, raid, follow, subscriber, cheer, joined, and presence events. It does not fabricate viewer activity.

## Visual asset audit

The existing responsive artwork system remains in use:

- 30 source WebP illustrations
- 30 mobile variants at 360 px
- 30 tablet variants at 600 px
- responsive `srcset`
- intrinsic dimensions
- lazy loading and async decoding

Existing artwork covers:

- station
- station modules
- wrecks
- ship classes
- ship skins

Simple framing and semantic graphics use CSS and SVG. No large raster frames or embedded UI text were introduced.

## Visual proof

The proof workflows build the production React applications and capture them in Chromium.

### Player

- every existing destination at 390 x 844
- every existing destination at 1920 x 1080
- five primary destinations at 1024 x 768
- full-page mobile overflow audits for Home, Salvage, and Market

### Administrator

- every operations destination at 1920 x 1080
- Operations, Players, Config, and Graphic Language at 1024 x 768
- Operations and Players at 390 x 844

### Overlay

- 1280 x 720
- 1920 x 1080
- 2560 x 1440
- 3840 x 2160
- viewer-event popup at 1920 x 1080

Admin and overlay proof data is intercepted at the browser network layer only inside CI. Production builds continue using the real API and WebSocket clients.

## Validation

The final verified branch passes:

- frozen dependency installation
- graphics contract tests
- existing UI and architecture contracts
- repository guardrails
- shared UI build
- player build
- admin build
- overlay build
- complete test suite
- `pnpm verify`
- player visual proof
- admin and overlay visual proof

## Production output measurements

Raw output before HTTP compression:

| Surface | Previous JS | Final JS | Change | Previous CSS | Final CSS | Change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Player | 313,571 B | 330,587 B | +17,016 B (+5.4%) | 84,519 B | 192,608 B | +108,089 B (+127.9%) |
| Admin | 278,126 B | 279,009 B | +883 B (+0.3%) | 65,899 B | 108,655 B | +42,756 B (+64.9%) |
| Overlay | 240,043 B | 238,915 B | -1,128 B (-0.5%) | 73,387 B | 113,747 B | +40,360 B (+55.0%) |

Complete raw output:

- player: 4.6 MiB including the full responsive artwork library
- admin: 396 KiB
- overlay: 364 KiB
- shared UI compiled output: 216 KiB

JavaScript remained nearly flat because the overhaul is mostly CSS and inline SVG. Raw CSS increased substantially. HTTP-compressed transfer was not measured by this workflow and must not be inferred from raw file size.

## Remaining risks

1. **CSS growth**
   - The illustrated system adds significant raw CSS.
   - A future optimization pass should measure Brotli/Gzip transfer, identify dead selectors after deployment, and consider safe layer consolidation.
   - Optimization must not collapse the graphics back into generic dashboard styling.

2. **Real-device rendering**
   - Automated Chromium coverage is green.
   - Final human inspection is still recommended on iPhone Safari, Android Chrome, and the production OBS machine.

3. **Artwork coverage**
   - Existing station, wreck, ship, and module illustrations are used consistently.
   - A complete illustrated loot and crew asset library does not yet exist and was not faked.

4. **Stream-safe tuning**
   - Overlay safe zones are verified at four standard resolutions.
   - The streamer may still choose to tune placement and scale through the existing overlay configuration for their specific game capture.

## Files changed

### Workflows and proof

- `.github/workflows/ui-visual-proof.yml`
- `.github/workflows/ui-admin-overlay-proof.yml`
- `tools/visual-proof/capture-admin-overlay.mjs`
- `tools/test/ui-graphics.test.mjs`

### Shared UI

- `packages/ui/src/index.ts`
- `packages/ui/src/bundle.css`
- `packages/ui/src/icons.tsx`
- `packages/ui/src/showcase.tsx`
- `packages/ui/src/graphics.css`
- `packages/ui/src/illustration.css`
- `packages/ui/src/brand-art.css`
- `packages/ui/src/accessibility-polish.css`
- `packages/ui/src/showcase-graphics.css`
- `packages/ui/src/viewer-event.css`

### Player

- `apps/web/src/main.tsx`
- `apps/web/src/player-graphics.css`

### Administrator

- `apps/admin/src/admin.css`
- `apps/admin/src/admin-graphics.css`

### Overlay

- `apps/overlay/src/main.tsx`
- `apps/overlay/src/overlay.css`
- `apps/overlay/src/overlay-graphics.css`

### Documentation

- `docs/GRAPHICS_COMPONENT_MATRIX.md`
- `docs/GRAPHICS_OVERHAUL_REPORT.md`
