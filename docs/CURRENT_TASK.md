# Neon Wreckers Current Task

**Task ID:** `P1-T02-FIX1`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Active  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

## Objective

Repair the authenticated Admin and Overlay Visual Proof fixture so every request made by the administration console's existing ten-resource refresh receives an explicit, deterministic, schema-compatible fixture response during visual capture, without changing production behavior or beginning another administration feature extraction.

## Reason

The visual-proof capture currently mocks seven of the ten administration refresh resources. Requests for these existing resources fall through to the inactive Vite preview proxy and fail with `ECONNREFUSED 127.0.0.1:8787`:

- `/api/v1/admin/balance-telemetry`
- `/api/v1/admin/live-ops`
- `/api/v1/admin/expedition-creator`

The production-built administration and overlay surfaces, frozen dependency installation, and preview startup already succeed. The defect is isolated to the authenticated visual-proof fixture.

## Authorized Files or Directories

Application-independent fixture and regression scope:

- The smallest necessary file or files under `tools/visual-proof/`
- The directly related Admin and Overlay Visual Proof workflow only if required
- One focused regression test under `tools/test/`

Project-control scope:

- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- One dated handoff record under `docs/handoffs/` when useful

## Explicitly Forbidden Changes

- Do not extract Timers or any other administration feature.
- Do not change `apps/admin/src/main.tsx`.
- Do not change `apps/admin/src/features/server/server-page.tsx` or the Server feature.
- Do not change production API routes, response shapes, authorization, database behavior, gameplay, balance, content, CSS, shared UI, deployment architecture, browser-client behavior, or overlay runtime behavior.
- Do not change screenshot expectations, viewport coverage, navigation behavior, authentication behavior, styling, or accessibility behavior merely to make capture pass.
- Do not add unrelated cleanup.

## Expected Behavior Change

Inside the visual-proof environment only:

- The three missing administration GET requests receive deterministic fixture responses compatible with the existing administration response models and production route shapes.
- Every endpoint requested by the authenticated ten-resource refresh is intercepted explicitly before the fallback `route.continue()` path.
- The Admin and Overlay Visual Proof capture completes against the real production-built admin and overlay surfaces.

## Expected Behavior That Must Remain Unchanged

- The existing ten-resource `Promise.all` refresh and `AdminApp` ownership of it
- All production API calls, routes, envelopes, response shapes, authorization, and database behavior
- Authentication fixture behavior and browser-side role gate
- Current screenshots, navigation labels and order, viewport coverage, overlay modes, transparency behavior, and capture output paths
- Administration and overlay styling, responsive behavior, reduced motion, low effects, keyboard behavior, and forced-colors behavior
- All gameplay, balance, content, player data, deployment, and runtime behavior

## Executable Pre-Change Baseline

Before editing application-independent fixture source, Admin and Overlay Visual Proof run `30353056639` was rerun unchanged. Rerun job `90267084937` established:

- `pnpm install --frozen-lockfile`: passed
- Production contracts, UI, admin, and overlay builds: passed
- Existing UI graphics regression: passed
- Playwright Chromium installation: passed
- Built admin and overlay preview startup: passed
- Authenticated capture: failed

The captured preview diagnostics record all three missing paths falling through to Vite's inactive `127.0.0.1:8787` proxy.

## Validation Commands

At minimum:

```text
pnpm install --frozen-lockfile
node --test tools/test/admin-visual-proof-fixture.test.mjs
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
node tools/visual-proof/capture-admin-overlay.mjs
```

The exact local capture equivalent may start the two production-built Vite previews before the capture command.

Run `pnpm verify` when the environment supports it. Run the Admin and Overlay Visual Proof workflow against the task branch.

## Rollback Method

Revert the final single-purpose fixture-repair commit. No production application, API, database, styling, or deployment source should require rollback.

## Completion Evidence

Pending:

- Focused regression result proving every ten-resource refresh endpoint has an explicit fixture response
- Repository test result
- Admin and overlay production build results
- Successful authenticated Admin and Overlay Visual Proof capture
- `pnpm verify` result or exact environment limitation
- Final diff review showing only authorized files
- Final commit hash

## Expected Stopping Point

Stop after the visual-proof fixture repair is validated, documented, and committed. Do not begin the Timers extraction or any other administration feature work in this chat.
