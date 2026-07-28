# Neon Wreckers Current Task

**Task ID:** `P1-T02`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Complete  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time. This completed record remains in place until the next chat defines a new task.

## Objective

Extract the read-only Server diagnostics feature from `apps/admin/src/main.tsx` into a focused feature module, add regression protection for its rendered telemetry and formatting, and preserve all runtime behavior, styling, navigation, data loading, and API ownership.

## Completion Result

Completed on 2026-07-28.

- `ServerPage`, `AdminOverview`, `BalanceTelemetry`, `MetricWindow`, `formatBytes`, and `formatDuration` now live in `apps/admin/src/features/server/server-page.tsx`.
- `apps/admin/src/main.tsx` imports the extracted page and response types.
- `AdminApp` still owns both Server endpoint requests, the ten-resource refresh, state, navigation, and page composition.
- The extracted feature imports no browser API client and performs no request or mutation.
- Focused regression protection lives in `tools/test/admin-server-feature.test.mjs`.
- No API, database, CSS, shared UI, shared contract, gameplay, content, deployment, or other administration feature changed.

## Behavior Change

None.

The Server diagnostics tab renders and behaves as it did before extraction.

## Behavior Preserved

- Default administration tab and all navigation identifiers, order, labels, and icons
- Session verification and browser-side role gate
- `AdminApp` ownership of `/api/v1/admin/overview` and `/api/v1/admin/balance-telemetry`
- The ten-resource `Promise.all` refresh
- Loading state when overview data is unavailable
- Request, latency, error, socket, player, queue, database, and process telemetry
- Optional balance-telemetry panel
- Google Cloud free-tier guardrail values and cost formatting
- Missing-disk rendering
- All user-visible text and number formatting
- Existing CSS class names and shared UI component usage
- Responsive, reduced-motion, low-effects, keyboard, and forced-colors behavior
- API authorization and response behavior

## Files Changed

Application and regression scope:

- `apps/admin/src/main.tsx`
- `apps/admin/src/features/server/server-page.tsx`
- `tools/test/admin-server-feature.test.mjs`

Project-control scope:

- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/phases/PHASE_01.md`
- `docs/handoffs/LATEST.md`

A temporary branch-only checkout-transfer workflow was created because the local container could not resolve GitHub or the npm registry. It was deleted before final validation and is absent from the final diff.

## Validation Evidence

### Executable pre-change baseline

The task branch initially contained project-control corrections only, with the application source unchanged from `main` at `a1086818c0e2d51f23a0e890fa84236a59137ac8`.

GitHub Actions CI run `30352627626`, job `90253431826`, completed successfully and ran:

- Frozen dependency installation with pnpm 10.32.0 and Node.js 22.16.0
- `pnpm verify`

This establishes the executable pre-change baseline that `P1-T01` could not obtain.

### Focused and repository regression checks

Executed against the exact exported task checkout:

```text
node --test tools/test/admin-server-feature.test.mjs
```

Result: 3 passed, 0 failed.

```text
node --test tools/test/*.test.mjs
```

Result: 88 passed, 0 failed after local Git metadata was initialized for the repository test that calls `git ls-files`.

### Final extracted source validation

Source extraction commit:

- `60afb9759ba0dc9480e20871a76b637b8a7eefda` - `refactor(admin): extract server diagnostics`

Validated source head before project-control closeout:

- `b9d1a7b8fec5ee6b974eb2d972ae626cc4dbd889`

Successful workflows:

- CI run `30353056396`, job `90254858193`: frozen install and `pnpm verify`
- Browser integration tests run `30353056560`
- UI Revamp Verify run `30353058064`
- CodeQL run `30353056383`
- CI and security gates run `30353056546`

### Visual-proof limitation

Admin and Overlay Visual Proof run `30353056639` built the production surfaces successfully, then failed during screenshot capture. The diagnostic logs show requests for these existing shell-owned resources fell through to the inactive Vite proxy:

- `/api/v1/admin/balance-telemetry`
- `/api/v1/admin/live-ops`
- `/api/v1/admin/expedition-creator`

`tools/visual-proof/capture-admin-overlay.mjs` does not provide fixture entries for those endpoints, while the unchanged `AdminApp` refresh already requested all three before this extraction. This is a pre-existing visual-proof fixture defect, not an extracted Server-page regression. Repairing that fixture is outside `P1-T02` and is deferred.

## Final Diff Review

The reviewed diff against starting `main` contains only:

- The focused Server feature module
- Removal of the corresponding inline definitions from `main.tsx`
- The focused regression test
- Required project-control status and handoff updates

No temporary workflow, unrelated source change, API change, styling change, or second feature extraction remains.

## Rollback Method

Revert the final `P1-T02` merge commit recorded in `docs/handoffs/LATEST.md`. That restores the inline Server page and helpers without affecting another feature.

## Deferred Discovery

Repair the authenticated visual-proof fixture so it mocks every resource in the current ten-resource administration refresh. Do not combine that repair with another feature extraction unless the next task explicitly authorizes it.

## Expected Stopping Point

Reached.

Stop here. The Timers extraction, visual-proof fixture repair, or any other administration work must begin in a new chat after `docs/CURRENT_TASK.md` is replaced with one newly authorized objective.
