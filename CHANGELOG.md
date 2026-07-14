# Changelog

## 2.0.0 - Phase 2: UI foundation and design system

### Interface system

- Rebuilt Phase 2 directly on the stabilized working source rather than the older pre-cleanup tree.
- Added the consumed `@neon-wreckers/ui` workspace with reusable components, tokens, themes, icons, responsive layouts, motion, accessibility behavior, and a live catalog.
- Migrated the player and Streamer Control Center to the shared command-interface system while preserving current same-origin API requests and route behavior.
- Connected overlay defaults to the central theme without changing its current realtime feed, timing, placement, or broadcaster overrides.
- Retained `@neon-wreckers/client-theme` as a compatibility forwarding entry.

### Guardrails

- Preserved backend services, database models, migrations, game rules, balance, content, integrations, worker behavior, Vite proxies, and deployment topology.
- Updated repository and dependency checks for the active UI workspace and pnpm lockfile.
- Added current design-system, theme-token, extension, and visual documentation.

## 2.0.0 - Sprint 1: Codebase stabilization and cleanup

### Repository

- Adopted the uploaded source as the canonical baseline.
- Removed dated backup snapshots, recovery patches, public-IP installer variants, committed build metadata, abandoned packages, stale deployment artifacts, and secret-bearing environment files.
- Standardized the monorepo on pnpm workspaces with one lockfile and exact dependency versions.
- Moved the canonical asset manifest to `assets/manifest.json`.
- Added repository guardrails that reject duplicate deployment files, recovery debris, generated builds, undocumented environment variables, synthetic identities, and retired persistence models.

### Architecture

- Split the API into focused system, authentication, station, player, salvage, construction, points, expeditions, integrations, and administration modules.
- Removed internal HTTP calls between routes and the process-local loyalty ledger.
- Centralized Redis parsing, browser API envelopes, shared client styling, validated canonical content, and transaction advisory locking.
- Removed synthetic Twitch authentication, the in-memory loyalty provider, unused Twitch token retention, four unused database models, and stale point-action cooldown metadata.
- Moved item metadata, wreck ranges, initial station modules, expedition definitions, salvage cooldowns, and construction progress rules to canonical content without changing effective values.
- Fixed point-action compensation so a rejected debit cannot issue an unearned credit.
- Added atomic protection against duplicate expedition claims, concurrent wreck mutation, construction double-spend, duplicate onboarding records, and colliding content versions.
- Signed session and OAuth state cookies and bounded caller-supplied request IDs.
- Removed an unused worker job and made unknown jobs fail visibly.

### Deployment

- Replaced all Compose variants with `compose.yaml`.
- Replaced all image variants with one multi-stage `Dockerfile`.
- Replaced gateway variants with `infrastructure/gateway/nginx.conf.template`.
- Removed the unused MinIO service and obsolete object-storage variables.
- Added one install, update, backup, restore, and verification process.
- Replaced the non-executable migration comment with a transactional initial PostgreSQL migration and indexed active query paths.
- Pinned production base-image versions and removed runtime source mounts and dependency installation.
- Hardened certificate renewal, backup retention validation, host validation, and restore archive extraction.

### Quality and documentation

- Added deterministic game-engine coverage, API/service tests, canonical-content parity tests, database/migration checks, route inventory checks, dependency analysis, content and unused-asset validation, operational-script safeguards, and repository integrity tests.
- Rewrote the README, architecture, deployment, developer, admin, overlay, dependency, database, test, and change-summary documentation.
- Added folder-level documentation for every major repository area.

### Compatibility

- Preserved the player UI layout, admin layout, overlay appearance, artwork, route paths, game mechanics, effective costs, effective cooldowns, rewards, station values, and content behavior.
