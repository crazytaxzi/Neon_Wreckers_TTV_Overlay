# Neon Wreckers Current Task

**Task ID:** `P1-T02`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Ready after `P1-T01` is merged  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

## Objective

Extract the read-only Server administration page, its server-owned response models, and its pure formatting helpers into a feature module without changing runtime behavior.

This is the first implementation task. It must establish the extraction pattern with the smallest practical administration feature.

## Required Startup

Before changing source:

1. Pull the latest `main` branch after the `P1-T01` baseline branch is merged.
2. Read `START_HERE.md` and every file it requires.
3. Read `docs/phases/P1_T01_ADMIN_BASELINE.md`.
4. Confirm this task is still the only active task.
5. Inspect the current diff and recent commits.
6. Run the available pre-change validation and record the exact result before editing.

Do not rely on the prior chat as the source of truth.

## Required Work

1. Add the smallest authenticated administration browser fixture needed to render the current Server page with deterministic mocked responses.
2. Add a focused desktop Playwright smoke test that:
   - Opens the authenticated administration shell.
   - Selects the existing `Server` navigation destination.
   - Confirms the current Server heading and representative telemetry are rendered.
   - Does not change visible application behavior.
3. Create `apps/admin/src/features/server/ServerPage.tsx`.
4. Move only:
   - `ServerPage`
   - `formatBytes`
   - `formatDuration`
5. Create `apps/admin/src/features/server/types.ts`.
6. Move only:
   - `MetricWindow`
   - `AdminOverview`
   - `BalanceTelemetry`
7. Update `apps/admin/src/main.tsx` to import those feature exports.
8. Preserve the existing `AdminApp` state, global `refresh`, page registry, props, navigation, and data flow.
9. Review the final diff for accidental copy, styling, endpoint, or behavior changes.
10. Run the required validation.
11. Update project status, current task, and handoff documentation.
12. Commit the completed work unit and stop.

## Intended Module Boundary

```text
apps/admin/src/main.tsx
  -> apps/admin/src/features/server/ServerPage.tsx
      -> apps/admin/src/features/server/types.ts
      -> @neon-wreckers/ui
```

The Server feature remains presentation-only in this task.

It must not fetch its own data, own refresh behavior, or call the API directly.

## Allowed Scope

Application and test changes are limited to:

- `apps/admin/src/main.tsx`
- `apps/admin/src/features/server/ServerPage.tsx`
- `apps/admin/src/features/server/types.ts`
- `tests/browser/fixtures.ts`
- One new focused authenticated Server-page Playwright spec under `tests/browser/`
- Existing test configuration only if a minimal path correction is required to run that spec

Completion documentation may update:

- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/phases/P1_T01_ADMIN_BASELINE.md` only for a factual correction discovered during implementation
- `docs/handoffs/LATEST.md`

Do not edit other files without replacing this task scope before implementation.

## Behavior That Must Remain Identical

Preserve:

- `/admin/` base path.
- Default `operations` tab.
- `server` navigation ID, label, icon, and order.
- Session and role gate behavior.
- All ten global refresh requests.
- `overview` and `balanceTelemetry` state ownership in `AdminApp`.
- `ServerPage` prop names and nullable behavior.
- Loading-screen label.
- All visible Server-page copy.
- All telemetry calculations.
- Byte formatting and duration formatting.
- Locale-dependent number formatting.
- USD display and current cost calculations.
- Shared UI imports and rendered component types.
- Administration and shared UI CSS imports, order, class names, and responsive behavior.
- No new network request from the extracted feature.
- No mutation, redirect, confirmation, toast, or effect added to the extracted feature.

## Forbidden Changes

Do not:

- Extract any other administration page.
- Move `Root`, `AdminApp`, `AccessDenied`, navigation, shell, session lookup, or global refresh.
- Change an API path, method, request body, or response shape.
- Add runtime payload schemas.
- Consolidate or rename shared types outside the Server feature.
- Create a global administration API client.
- Create a global administration `types.ts`.
- Split or change CSS.
- Change UI components, copy, icons, colors, layout, animation, accessibility behavior, or formatting.
- Change API, worker, database, content, game rules, deployment, dependencies, or package configuration.
- Begin desktop Studio work.
- Clean up unrelated code.
- Continue into `P1-T03` in the same chat.

## Test Requirements

The new authenticated browser fixture must be narrow and deterministic. It may borrow verified data shapes from `tools/visual-proof/capture-admin-overlay.mjs`, but it must not turn the general browser fixture into a complete fake backend.

The focused Server-page test must protect the existing page, not assert a redesigned structure.

At minimum, assert:

- Authenticated administration shell is visible.
- `Server` navigation is reachable.
- `Server Load & Throughput` is visible after navigation.
- At least one process/throughput value and one database/queue value from the fixture are rendered.
- The page contains the current Google Cloud safe-zone section.

Keep the anonymous authorization and accessibility coverage intact.

## Required Validation

Record every command actually run and its result.

Preferred pre-change gate:

```bash
pnpm install --frozen-lockfile
pnpm --filter @neon-wreckers/admin build
pnpm test:repository
```

Focused browser gate after starting the required local preview services:

```bash
pnpm exec playwright test tests/browser/admin-server.spec.ts --project=desktop-chromium
```

Regression gate:

```bash
pnpm exec playwright test tests/browser/auth-boundaries.spec.ts tests/browser/accessibility.spec.ts --project=desktop-chromium
```

Preferred final source gate:

```bash
pnpm test:dependencies
pnpm test:content
pnpm test:api
pnpm test:engine
pnpm build
```

Use `pnpm verify` when the environment supports the complete source-level gate.

If environment services, credentials, browsers, dependencies, or network access prevent a command from running, record the exact limitation. Do not label an unrun check as passing.

## Completion Criteria

This task is complete only when:

- The Server page and only its owned types/helpers are outside `main.tsx`.
- `main.tsx` still owns all data fetching and application orchestration.
- The focused authenticated Server-page smoke test exists.
- Existing anonymous administration protection remains intact.
- The final diff contains no unrelated edits.
- Validation results are recorded honestly.
- `docs/PROJECT_STATUS.md` is updated.
- `docs/CURRENT_TASK.md` is replaced with the next narrow task.
- `docs/handoffs/LATEST.md` is replaced with a complete handoff.
- The work is committed.
- The new-chat check has been performed.

## Rollback Boundary

The rollback unit is the complete `P1-T02` commit.

If extraction introduces behavior changes that cannot be corrected within this narrow scope, revert the work unit rather than widening the task.

## Expected Stopping Point

Stop immediately after the Server extraction is validated, documented, and committed.

The next feature extraction must begin in a new chat.
