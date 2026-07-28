# Neon Wreckers Current Task

**Task ID:** `P1-T02`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Ready to start  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

## Objective

Extract the read-only Server diagnostics feature from `apps/admin/src/main.tsx` into a focused feature module, add regression protection for its rendered telemetry and formatting, and preserve all runtime behavior, styling, navigation, data loading, and API ownership.

This is the first administration frontend extraction. It must remain a small, behavior-preserving work unit.

## Required Work

1. Pull and inspect the latest `main` branch.
2. Complete the `START_HERE.md` startup sequence.
3. Read `docs/phases/P1_T01_ADMIN_BASELINE.md` completely.
4. Run the available pre-change baseline validation.
5. Add focused regression protection for the current Server page before or alongside extraction.
6. Create a focused Server feature module under `apps/admin/src/features/server/`.
7. Move only:
   - `ServerPage`
   - `AdminOverview`
   - `BalanceTelemetry`
   - `MetricWindow`
   - `formatBytes`
   - `formatDuration`
8. Import the extracted page and required types into `apps/admin/src/main.tsx`.
9. Preserve the existing `AdminApp` state, full-refresh callback, endpoint ownership, props, page key, navigation, labels, CSS classes, and rendered behavior.
10. Run the required validation and review the final diff for unrelated changes.
11. Update project status, current task, and the latest handoff.
12. Stop before beginning another feature extraction.

## Expected Behavior Change

None.

The Server diagnostics tab must render and behave exactly as it did before extraction.

## Expected Behavior That Must Remain Unchanged

- Default administration tab and all navigation identifiers, order, labels, and icons
- Session verification and browser-side role gate
- `AdminApp` ownership of `/api/v1/admin/overview` and `/api/v1/admin/balance-telemetry` loading
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

## Allowed Scope

Implementation changes are limited to:

- `apps/admin/src/main.tsx`
- New files under `apps/admin/src/features/server/`
- The smallest relevant existing test file or a new focused test under `tools/test/` or `tests/browser/`
- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- A dated handoff record when useful

A newly required file outside this scope must be documented in this file before modification.

## Forbidden Changes

Do not perform any of the following during this task:

- Change API paths, methods, payloads, response shapes, or authorization
- Move remote-data loading or refresh ownership out of `AdminApp`
- Change the full-refresh behavior
- Extract another administration page or shell responsibility
- Consolidate shared contracts or rewrite response models beyond the minimum move required for this feature
- Change `@neon-wreckers/browser-client`
- Change `@neon-wreckers/ui`
- Change `apps/admin/src/admin.css` or `apps/admin/src/admin-graphics.css`
- Change database models, migrations, seed behavior, game mechanics, balance, rewards, loot, cooldowns, progression, or content
- Redesign the administration interface
- Begin the desktop Studio
- Remove packages or documentation
- Deploy to production

## Required Regression Protection

The focused protection must cover or statically lock, at minimum:

- The Server page remains outside the composition entrypoint after extraction.
- The page receives `overview` and `balanceTelemetry` through props.
- The page performs no direct `requestApi` call.
- Overview absence still renders the loading screen.
- Memory, disk, load, uptime, database, queue, and gameplay telemetry sections remain present.
- Missing disk continues to render `Unavailable`.
- Balance telemetry remains optional.
- Byte and duration formatting remain unchanged.
- The Server tab still resolves to the extracted page.

Prefer interaction or render-level coverage when the existing toolchain supports it. Do not add a new testing framework or dependency merely to complete this task without first documenting the need.

## Required Validation

Record the exact commands actually run and their results.

Minimum gate:

```bash
pnpm install --frozen-lockfile
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
```

Run the focused test directly when it is not already included by `pnpm test:repository`.

Preferred complete gate when the environment supports it:

```bash
pnpm verify
```

The visual-proof workflow or equivalent local capture should be run when available, but it does not replace the production build and focused regression test.

If a command cannot run because the environment lacks Node.js, pnpm, browser binaries, network access, or another required dependency, record the limitation. Do not label an unrun check as passing.

## Rollback Method

Revert the single-purpose Server extraction commit. Because no API, database, styling, or data-loading behavior may change, rollback must restore the previous inline `ServerPage` and helper definitions without affecting other features.

## Completion Evidence

This task is complete only when:

- The Server feature is in a focused module.
- `apps/admin/src/main.tsx` no longer defines the Server page or its private formatting helpers.
- The extracted feature has no direct API ownership.
- Focused regression protection is present and passing.
- The administration build passes.
- The final diff contains no unrelated changes.
- Project-control files and the latest handoff are updated.
- The resulting commit hash is recorded.
- The new-chat check has been performed.

## Expected Stopping Point

Stop after the Server diagnostics extraction is validated, documented, and committed.

The Timers extraction or any other administration feature must begin in a new chat unless the repository owner explicitly changes the objective and the handoff protocol still permits continuation.
