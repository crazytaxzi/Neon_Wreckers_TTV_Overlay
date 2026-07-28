# Neon Wreckers Current Task

**Task ID:** `P1-T02-FIX1`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Complete  
**Completed:** 2026-07-28  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time. This completed record remains until the next development chat defines one new objective.

## Objective

Repair the authenticated Admin and Overlay Visual Proof fixture so every request made by the administration console's existing ten-resource refresh receives an explicit, deterministic, schema-compatible fixture response during visual capture, without changing production behavior or beginning another administration feature extraction.

## Completion Result

- Added visual-proof-only responses for `/api/v1/admin/balance-telemetry`, `/api/v1/admin/live-ops`, and `/api/v1/admin/expedition-creator`.
- Preserved the existing ten-resource `Promise.all` refresh and all `AdminApp` request ownership.
- Added `tools/test/admin-visual-proof-fixture.test.mjs` to derive the ten refresh endpoints from the real administration source and require an explicit fixture response for every one.
- Kept the fallback `route.continue()` behavior for requests outside the authenticated fixture while proving the administration refresh cannot reach it.
- Ran the authenticated capture against the real production-built admin and overlay surfaces.
- Preserved all screenshot names, viewport coverage, navigation behavior, authentication fixture behavior, overlay modes, transparency behavior, styling, accessibility behavior, and production runtime behavior.
- Extracted no administration feature and made no Timers change.

## Root Cause Confirmed Before Editing

`tools/visual-proof/capture-admin-overlay.mjs` intercepted `/api/v1/**`, fulfilled paths present in `adminData`, and continued every other request. The existing administration shell requested ten resources, but `adminData` contained only seven of them.

The missing requests fell through to the inactive Vite preview proxy at `127.0.0.1:8787`:

- `/api/v1/admin/balance-telemetry`
- `/api/v1/admin/live-ops`
- `/api/v1/admin/expedition-creator`

The workflow, production builds, preview servers, navigation, and capture commands were otherwise functioning.

## Behavior Changed

Inside `tools/visual-proof/capture-admin-overlay.mjs` only, the three previously missing administration GET requests now receive deterministic fixture envelopes compatible with the administration response models and production route shapes.

## Behavior Preserved

- `apps/admin/src/main.tsx` and its ten-resource `Promise.all` refresh
- `AdminApp` ownership of remote state and requests
- Server feature source and behavior
- Production API routes, methods, envelopes, response shapes, authorization, database behavior, and browser-client behavior
- Administration and overlay production builds
- Authentication fixture and role gate
- Navigation identifiers, order, labels, icons, and default tab
- Existing desktop, tablet, mobile, overlay, viewer-event, and transparent capture coverage
- Existing output paths and screenshot names
- Shared UI, CSS, responsive behavior, reduced motion, low effects, keyboard behavior, and forced-colors behavior
- Gameplay, balance, content, player data, deployment, and runtime behavior

## Files Changed

Fixture and regression scope:

- `tools/visual-proof/capture-admin-overlay.mjs`
- `tools/test/admin-visual-proof-fixture.test.mjs`

Project-control scope:

- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- `docs/handoffs/2026-07-28-p1-t02-server-diagnostics.md`

No workflow change was required.

## Executable Pre-Change Baseline

Before editing the fixture, Admin and Overlay Visual Proof run `30353056639` was rerun unchanged.

Rerun job `90267084937` established:

- `pnpm install --frozen-lockfile`: passed
- Production contracts, UI, admin, and overlay builds: passed
- Existing UI graphics regression: passed
- Playwright Chromium installation: passed
- Built admin and overlay preview startup: passed
- Authenticated capture: failed

The preview diagnostics recorded all three missing paths falling through to Vite's inactive proxy.

## Validation Evidence

### Focused regression

Executed against the reconstructed source checkout:

```text
node --test tools/test/admin-visual-proof-fixture.test.mjs
```

Result: 2 passed, 0 failed.

The test proves:

- The administration refresh contains exactly ten unique requests.
- Every request has an explicit authenticated fixture entry.
- The three repaired paths remain present.
- Visual-proof interception is installed before the production-built admin surface loads.
- The fixture uses the standard `{ data: ... }` envelope.
- Non-fixture requests may still continue, while refresh requests cannot fall through.

### Frozen install, repository tests, builds, and complete verification

GitHub Actions CI run `30357665819`, job `90269540183`, completed successfully against validated source head `a26e5f0a10dbf848a1dc1a46b459e0bf2d5c0e89`.

It ran:

```text
pnpm install --frozen-lockfile
pnpm verify
```

`pnpm verify` includes `pnpm test:repository`, the focused regression test, all repository verification suites, and the complete production build pipeline including:

```text
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

Result: passed.

### Exact authenticated visual-proof workflow

Admin and Overlay Visual Proof run `30357668480`, job `90269548106`, completed successfully against the same validated source head.

Successful steps included:

- Frozen dependency installation
- Production contracts and shared UI builds
- `pnpm --filter @neon-wreckers/admin run build`
- `pnpm --filter @neon-wreckers/overlay run build`
- Existing UI graphics regression
- Workspace-owned Chromium installation
- Built admin and overlay preview startup
- `node tools/visual-proof/capture-admin-overlay.mjs`
- Visual-proof artifact upload

Artifact `8687505083` contains all 26 existing captures across desktop, tablet, mobile, 720p, 1080p, 1440p, 4K, viewer-event, and transparent overlay modes. No diagnostic artifact was produced.

## Final Diff Review

The final task diff is limited to:

- Three deterministic fixture responses
- One focused regression test
- Required project-control and handoff records

There is no administration application source, Server feature, Timers feature, API, database, CSS, shared UI, browser-client, overlay runtime, workflow, gameplay, content, or deployment change.

## Rollback Method

Revert the final squash merge commit recorded in `docs/handoffs/LATEST.md`. The rollback removes only the fixture entries, focused test, and task documentation.

## Deferred Work

- The Timers extraction remains a separate future Phase 1 task.
- Further administration frontend decomposition must continue one narrow feature at a time.
- Refresh decomposition, contract consolidation, API decomposition, styling cleanup, and later-phase Studio or live-content work remain outside this task.

## Expected Stopping Point

Reached.

Stop here. Do not begin the Timers extraction or another administration feature in this chat.
