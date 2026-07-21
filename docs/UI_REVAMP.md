# Neon Wreckers UI Revamp

## Purpose

This document records the concept-driven visual and structural revamp shared by the player application, streamer administration console, and OBS overlay.

The supplied concept images are design references. They define the visual language: blackened metal, electric neon green, neon purple, angular frames, segmented controls, compact telemetry, tactical headers, resource strips, tactile inventory slots, five-item mobile navigation, and broadcast-safe event frames.

The concept images are not shipped as flattened interface backgrounds. Existing project artwork remains live content and all interface text remains HTML.

## Implementation plan

### Shared work

- Establish one canonical stream theme through the existing `ThemeDefinition` and `createTheme` architecture.
- Preserve the default and high-contrast themes while strengthening the Neon Wreckers identity.
- Add tactile shared primitives instead of recreating patterns in each application.
- Add a five-destination mobile navigation contract and grouped desktop command rail.
- Add safe-area, reduced-motion, low-effects, reduced-data, large-text, and forced-colors behavior.
- Expand the admin UI Library into the live implementation contract.

### Player-specific work

- Present five primary mobile destinations: Home, Salvage, Station, Market, and Profile.
- Keep all existing secondary pages available through Station and Profile sheets or grouped desktop navigation.
- Preserve current real station, wreck, module, ship, quarters, inventory, and salvage artwork.
- Preserve the current API, WebSocket, authentication, polling, cooldown, reward, and action behavior.

### Admin-specific work

- Retain the current operation, server, timer, player, transaction, configuration, and interface-library destinations.
- Apply the same metal, telemetry, warning, status, and control language without reducing table density.
- Convert shared data grids to labelled record cards on narrow screens.
- Keep destructive actions inside the existing accessible confirmation window.

### Overlay-specific work

- Keep the current transparent, pointer-events-free OBS surface.
- Reuse the shared theme, panel, icon, meter, severity, and event-frame language.
- Preserve current reconnect, polling recovery, malformed-message handling, placement configuration, visibility timers, and source-controlled configuration.
- Avoid importing the full player shell or requiring large raster frames.

## Files implemented

### Shared design system

- `packages/ui/src/theme.ts`
  - Adds the canonical `streamTheme`.
  - Keeps `defaultTheme` as a compatibility export.
  - Strengthens green, purple, metal surfaces, local font stacks, glow, depth, and high-contrast behavior.
- `packages/ui/src/components.tsx`
  - Adds adaptive player navigation, grouped desktop navigation, mobile secondary sheets, resource strips, action tiles, entity cards, inventory slots and grids, event banners, empty/loading states, compact overlay telemetry, and overlay event popups.
  - Adds a skip link and preserves modal focus containment and Escape behavior.
- `packages/ui/src/revamp.css`
  - Adds the concept-driven tactile visual layer and responsive/effects contracts.
- `packages/ui/src/index.ts`
  - Loads the canonical base stylesheet followed by the revamp layer.
- `packages/ui/src/showcase.tsx`
  - Demonstrates new primitives and their important player, admin, accessibility, and overlay states.

### Verification

- `tools/test/ui-revamp.test.mjs`
  - Verifies the canonical theme and stylesheet are loaded.
  - Verifies exactly five primary player mobile destinations.
  - Verifies safe-area and effects-tier contracts.
  - Verifies the shared component families exist.
  - Verifies overlay transparency, reconnect, polling recovery, and malformed-message safety remain represented in source.

## Information architecture

### Player mobile navigation

The bottom bar shows only:

1. Home
2. Salvage
3. Station
4. Market
5. Profile

Home maps to the existing Station command center. Salvage and Market map directly to their existing real pages. Station opens a sheet containing the existing hold, crafting, construction, crew, ships, expeditions, and museum systems. Profile opens a sheet containing profile, quarters, notifications, history, guide, and settings.

No current page is deleted and no public route is changed.

### Player desktop navigation

The desktop command rail groups existing destinations into:

- Command
- Logistics
- Station Systems
- Personal

The application still renders the current page components and uses the existing authoritative API actions.

### Admin navigation

The administration console retains its operational destinations and receives the shared command-rail, panel, control, responsive-table, warning, and telemetry treatment. The admin UI Library remains the canonical showcase for future implementation work.

## Existing mechanics preserved

No gameplay, API, authentication, persistence, integration, or deployment behavior is changed by this branch.

Preserved systems include:

- Twitch authentication and sign out
- StreamElements health and transaction operations
- Station telemetry and construction
- Real wreck scanning and salvage actions
- Existing cooldowns and server-authoritative outcomes
- Inventory, crafting, marketplace, auctions, ships, crew, expeditions, museum, quarters, history, notifications, profile, and settings
- Administrative event and wreck controls
- Twitch EventSub setup
- WebSocket station, wreck, history, and player updates
- Player polling fallback and overlapping-refresh prevention
- Overlay WebSocket reconnect and polling recovery
- Overlay source configuration, transparency, and OBS behavior

## Unsupported concept mechanics intentionally omitted

The reference images contain illustrative ideas that are not treated as proof of backend support. This branch does not invent:

- Cargo jettisoning
- Extraction windows
- Daily reward claims
- New crew training systems
- Shield or heat simulation
- Subsystem damage
- Staged cut-and-extract mechanics
- New currencies
- Imaginary station statistics
- Live bidding behavior beyond the existing real auction API

Where a concept panel suggested unsupported data, the implementation uses an existing real system or omits the element.

## Asset policy

Existing project artwork remains the source of game imagery. The revamp frames and presents those assets rather than replacing them with screenshots.

Rules:

- Reuse current WebP game artwork through existing visual keys and paths.
- Keep UI copy as live HTML.
- Use CSS and SVG/icon framing for panels and controls.
- Do not require large raster frames.
- Do not introduce decorative alternative text.
- Do not generate artwork for unsupported mechanics.
- Lazy loading remains appropriate for secondary entity art.

## Performance strategy

The visual layer avoids canvas, WebGL, full-screen backdrop filters, continuous JavaScript layout animation, and mandatory large raster frames.

Effects tiers use the existing preference data attributes and media preferences:

- Full: complete restrained glow, grid, scan, and blur treatment.
- Standard: reduced mobile blur and decorative density.
- Low: no effective backdrop blur, no scanline layer, reduced grid, reduced glow, and near-instant motion.

Manual controls remain authoritative because automatic device capability detection is not perfect.

## Migration risks

- The player entry source remains large and should still be split by page and feature in a follow-up structural milestone. This branch avoids changing API behavior while the shared visual/navigation foundation is verified.
- The shared revamp stylesheet intentionally overrides the established base stylesheet. New base selectors must be checked against the override layer to prevent specificity drift.
- `clip-path`, `color-mix`, and backdrop blur are progressive enhancements. Core borders, backgrounds, labels, and controls remain visible without them.
- Browser-source rendering must be visually checked in OBS in addition to normal Chromium testing.

## Validation

Required command validation:

```text
pnpm --filter @neon-wreckers/ui run build
pnpm --filter @neon-wreckers/web run build
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
pnpm test
pnpm verify
```

The GitHub branch contains source-level contract tests. Production build and visual viewport results must be recorded in the companion responsive and performance documents after CI or a checked-out repository runs the commands above.
