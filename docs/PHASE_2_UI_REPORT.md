# Phase 2: UI foundation and design system

## Canonical baseline

This Phase 2 implementation was rebuilt from the supplied working Version 2.0 source. It does not use the earlier Phase 2 archive as a repository base. The stabilized backend, database schema and migration, API routes, browser client, Vite proxies, content package, game engine, worker, deployment files, scripts, and existing tests remain the canonical implementation.

## Delivered

- reusable React component library in `packages/ui`
- centralized typed theme definitions and generated CSS tokens
- runtime theme application with partial seasonal-theme creation
- semantic Lucide icon registry
- responsive application shell, command navigation, grids, and split layouts
- typography, status, telemetry, controls, data grids, modal, toast, loading, and skeleton systems
- keyboard, focus, contrast, scalable text, and reduced-motion behavior
- complete player-client composition using current API DTOs and routes, including notifications, marketplace state, quarters layout, and expeditions
- Streamer Control Center composition with current role and endpoint behavior
- live UI Library demonstrating every component family
- OBS overlay defaults connected to the same central theme while preserving its current feed, WebSocket, timing, placement, and override behavior
- compatibility forwarding for older `@neon-wreckers/client-theme/styles.css` imports
- design-system, token, visual, dependency, and extension documentation

## Protected source areas

Phase 2 does not change game mechanics, balance, persistence models, production routes, backend services, queue behavior, provider integrations, or deployment topology. Browser actions continue to call the current same-origin API through `@neon-wreckers/browser-client`; no client-side reward, cost, cooldown, or outcome logic was added.

## Component coverage

Buttons, icon buttons, cards, panels, status displays, headers, section titles, modals, dialogs, confirm windows, notifications, tooltips, progress bars, meters, health bars, power bars, population displays, module cards, inventory cards, scrollable lists, tables, data grids, badges, pills, tabs, inputs, textareas, selects, toggle switches, sliders, context menus, toast notifications, loading screens, and skeleton loaders are supplied by the shared package.

## Theme boundary

`packages/ui/src/theme.ts` owns palette, fonts, typography scales, spacing, glow, animation, geometry, borders, transparency, blur, and depth. App-local CSS contains composition and diagrams only and consumes `--nw-*` variables. The overlay's default palette is derived from the same theme; its public config remains responsible for broadcaster placement and timing.

## Verification

See `TEST_REPORT.md` for the release verification record. The final archive excludes dependency folders, generated output, live environment files, recovery copies, and stale release checksums.
