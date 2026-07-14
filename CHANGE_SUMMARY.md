# Version 2.0 change summary

## Phase 2: UI foundation rebuilt on the working source

Phase 2 was redone directly on the stabilized Sprint 1 repository. The older Phase 2 archive was used only as a visual donor and was not used as the repository base. Current backend services, API contracts, database models and migrations, canonical content, game rules, worker behavior, browser request handling, Vite proxies, deployment files, and operational scripts remain authoritative.

The release adds `@neon-wreckers/ui` as the single visual-system owner. It provides typed themes and design tokens, a semantic icon registry, responsive shells and grids, command navigation, typography, animation, accessibility behavior, reusable cards and panels, telemetry displays, controls, data grids, dialogs, notifications, loading states, and a live component catalog.

The player application and Streamer Control Center now compose their interfaces from that package while continuing to call the current same-origin API through `@neon-wreckers/browser-client`. The OBS overlay keeps its existing feed, WebSocket, timing, placement, and visibility logic, but its default palette now comes from the central theme. `@neon-wreckers/client-theme` remains as a forwarding compatibility entry rather than a second styling system.

No gameplay, balance, rewards, costs, cooldowns, routing, persistence, provider integrations, or deployment topology were changed. No placeholder artwork or generated temporary imagery was added.

## Sprint 1: stabilization retained

Sprint 1 removed backup trees, recovery installers, duplicate deployment variants, committed secrets, generated build artifacts, abandoned packages, synthetic authentication, process-local loyalty state, dead token storage, unused database models, and obsolete worker behavior. It standardized the repository on pnpm workspaces, one Dockerfile, one Compose file, one Nginx template, one migration path, canonical content and assets, and one supported install/update/backup/restore/verify sequence.

Its concurrency, security, migration, content-validation, loyalty-idempotency, and deployment safeguards remain unchanged in this Phase 2 release.

## Repository ownership after Phase 2

- `apps/web`: player command interface
- `apps/admin`: Streamer Control Center and UI catalog
- `apps/overlay`: transparent OBS surface
- `packages/ui`: components, tokens, themes, icons, motion, and responsive behavior
- `packages/client-theme`: compatibility stylesheet forwarding to UI
- `packages/browser-client`: same-origin API request handling
- `packages/game-engine`, `packages/content`, `apps/api`, `apps/worker`, and `infrastructure`: protected current-source behavior

Detailed implementation and verification records are in `docs/PHASE_2_UI_REPORT.md` and `docs/TEST_REPORT.md`.
