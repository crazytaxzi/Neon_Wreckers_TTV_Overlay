# Neon Wreckers Current Task

**Task ID:** `P1-T03`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Complete, validated, documented, and merged  
**Started:** 2026-07-28  
**Completed:** 2026-07-28  
**Starting main commit:** `78646d84e8b47b73dd3cf4cf3cce61dfc02e6cbd`  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time. This completed record remains until a new development chat defines exactly one next objective.

## Objective

Extract only the existing Timers administration page, Timers-specific presentation, browser confirmation, and force-resolve command from `apps/admin/src/main.tsx` into a focused module under `apps/admin/src/features/timers/` without changing behavior.

## Completed Architecture

- Added `apps/admin/src/features/timers/timers-page.tsx`.
- Moved only the Timers page, timer presentation, confirmation, and force-resolve command into that module.
- Kept authentication, navigation, page composition, remote loading, and cross-feature orchestration in `AdminApp`.
- Kept the ten-resource `Promise.all` refresh byte-for-byte intact.
- Continued receiving the existing timer records through props from shell-owned `AdminOverview` state.
- Continued receiving the full-refresh callback and toast function through props.
- Continued using the production `requestApi` browser client directly.
- Made no Server feature, API, database, browser-client, CSS, shared UI, gameplay, content, worker, deployment, or second-feature change.

## Preserved Behavior

### Data and rendering

- Source data remains `overview?.timers ?? []` from the existing `/api/v1/admin/overview` response.
- Timer records retain `id`, `name`, `playerName`, and `resolvesAt`.
- The exact heading, description, icon, table columns, bold player label, mission label, locale date rendering, right-aligned warning control, `Resolve now` button, empty state, and informational notice remain unchanged.

### Confirmation and command

- Confirmation copy remains `Resolve this expedition immediately?`.
- Cancelling returns without a request, toast, or refresh.
- Confirming sends the exact bodyless request:

```text
POST /api/v1/expeditions/:id/resolve-now
```

- Request options remain exactly `{ method: "POST" }`.
- Success toast remains `{ title: "Expedition timer resolved", tone: "success" }`.
- Success invokes the existing full refresh exactly once.
- Failure toast remains `{ title: "Timer command failed", message: errorMessage(error), tone: "danger" }`.
- Failure emits no false success and performs no refresh.

### Shell and server boundaries

- Navigation remains `{ id: "timers", label: "Timers", icon: "events" }`, sixth after Server and before Players.
- The default administration tab remains `operations`.
- The existing ten-resource refresh remains one shell-owned `Promise.all`.
- The authenticated visual-proof fixture still explicitly covers all ten refresh endpoints and populated Timers data.
- The exact API route remains owned by `apps/api/src/routes/expeditions.ts` and still invokes `requireAdmin(context.prisma, request)` before server-side resolution.
- The API route remains body-independent.

## Regression Protection

Added `tools/test/admin-timers-feature.test.mjs` with six focused tests proving:

- `AdminApp` imports and composes the focused Timers feature.
- The extracted feature does not own authentication, navigation, overview loading, or unrelated API requests.
- Active records, labels, columns, locale date rendering, button text, empty state, notice copy, and visual classes remain present.
- Confirmed force resolution sends the exact bodyless POST, emits the exact success toast, and refreshes exactly once.
- Cancelled confirmation sends no request, toast, or refresh.
- Failed force resolution emits only the exact danger toast and does not refresh.
- Navigation order, default tab, ten-resource refresh, visual-proof endpoint coverage, Timers screenshot capture, and API authorization remain intact.

## Commit Record

- Starting `main`: `78646d84e8b47b73dd3cf4cf3cce61dfc02e6cbd`
- Task definition: `cca0abea2c75b9f30352bd1a62536a9e02126641`
- Timers feature module: `fcbc53e3af06ea0de123ab6e66816c570a0d4f3c`
- Timers extraction and shell composition: `6eeb12e81b8a306fa6ba35ef5004116bd2c84b2d`
- Focused regression test: `ca1a3f9470d0fcfe35024fdae2bfa1de1e9a97f1`
- Validated source head: `ca1a3f9470d0fcfe35024fdae2bfa1de1e9a97f1`
- Final reviewed branch head: `dad7ed15f7ff309df3860a679c947423eff71bba`
- Final merge commit: `ecdc63024a7d3380988d43b91435f2b614d3efb1`
- Final documented `main` closeout commit: the final `docs/handoffs/LATEST.md` closeout commit created after this record

## Executable Pre-Change Baseline

The task-definition commit changed project-control documentation only, leaving application source identical to starting `main`.

Tested commit: `cca0abea2c75b9f30352bd1a62536a9e02126641`

- CI run `30371064822`
- Verify job `90314741971`
- Result: success
- Frozen dependency installation: success
- Complete `pnpm verify`: success

The complete gate included:

```text
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

## Final Source Validation

Tested commit: `ca1a3f9470d0fcfe35024fdae2bfa1de1e9a97f1`

### Complete repository verification

- CI run `30372552445`
- Verify job `90319894219`
- Result: success
- Frozen dependency installation: success
- Complete `pnpm verify`: success
- Focused Timers regression: success as part of `pnpm test:repository`
- Administration production build: success
- Overlay production build: success

### Authenticated Admin and Overlay Visual Proof

- Workflow run `30372551080`
- Screenshots job `90319889665`
- Result: success
- Frozen dependency installation: success
- Production surface builds: success
- Chromium installation: success
- Built preview startup: success
- Exact capture command `node tools/visual-proof/capture-admin-overlay.mjs`: success
- Artifact upload: success
- Artifact `8693597195`, digest `sha256:b9bdd3dec9c1443c6e0be9bd4c47ee6a6ceae232a33748719168c639465dfcec`
- The artifact contains the existing 26 captures, including `proof/admin/desktop/timers.png`.

### Additional final-source gates

- CodeQL run `30372552587`, job `90319894144`: success
- UI Revamp Verify run `30372551099`, job `90319888544`: success
- Browser integration tests run `30372551084`: success
- CI and security gates run `30372551055`: success

## Final Reviewed Branch Validation

Tested commit: `dad7ed15f7ff309df3860a679c947423eff71bba`

- CI run `30373289045`: success
- Admin and Overlay Visual Proof run `30373289202`: success
- CodeQL run `30373289713`: success
- UI Revamp Verify run `30373289886`: success
- Browser integration tests run `30373289646`: success
- CI and security gates run `30373290124`: success

## Final Diff Boundary

The reviewed pull request contains exactly:

- `apps/admin/src/main.tsx`
- `apps/admin/src/features/timers/timers-page.tsx`
- `tools/test/admin-timers-feature.test.mjs`
- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- `docs/handoffs/2026-07-28-p1-t03-timers.md`

No Refunds, Players, Commands, Integrations, Expedition Creator, Config, Operations, Server, refresh decomposition, API, CSS, shared UI, gameplay, content, worker, deployment, Docker, nginx, Vite, or workflow change is included.

## Rollback Method

Revert merge commit `ecdc63024a7d3380988d43b91435f2b614d3efb1`. This restores the inline Timers page and removes the focused Timers module and regression test without an API, database, content, gameplay, or deployment rollback.

## Stopping Point

`P1-T03` is complete, validated, documented, and merged. Stop here. Do not begin Refunds, Players, refresh decomposition, or another Phase 1 task in this chat.
