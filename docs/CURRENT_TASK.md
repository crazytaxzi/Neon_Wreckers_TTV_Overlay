# Neon Wreckers Current Task

**Task ID:** `P1-T03`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Active  
**Started:** 2026-07-28  
**Starting main commit:** `78646d84e8b47b73dd3cf4cf3cce61dfc02e6cbd`  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

## Objective

Extract only the existing Timers administration page, its Timers-specific presentation, browser confirmation, and force-resolve command from `apps/admin/src/main.tsx` into a focused module under `apps/admin/src/features/timers/` without changing behavior.

## Reason

`apps/admin/src/main.tsx` still owns most administration features. The documented extraction order identifies Timers as the next narrow slice after Server diagnostics because it has one data input, one confirmation, and one mutation while the shell can continue owning authentication, navigation, remote loading, and the shared full refresh.

## Pre-Change Behavior and Ownership Record

### Current Timers implementation

- `TimersPage` is defined inline in `apps/admin/src/main.tsx`.
- `AdminApp` composes it under the `timers` page identifier.
- The page receives `overview`, `refresh`, and `pushToast` through props.
- The page performs no authentication, navigation, or unrelated administration request.

### Active expedition timer data

- `AdminApp` loads `GET /api/v1/admin/overview` as part of its existing ten-resource `Promise.all` refresh.
- The response type is `AdminOverview`, currently exported by `apps/admin/src/features/server/server-page.tsx`.
- The Timers page renders `overview?.timers ?? []`.
- Each timer record has the existing shape:
  - `id: string`
  - `name: string`
  - `playerName: string`
  - `resolvesAt: string`
- Timers and Server therefore consume different portions of the same shell-owned Server overview response. This task may narrow the Timers prop to the existing timer records, but it must not change the Server feature, overview request, response shape, or shell ownership.

### Force-resolve confirmation and command

- Clicking `Resolve now` invokes the Timers-local command for that row identifier.
- The exact confirmation text is `Resolve this expedition immediately?`.
- Rejecting the confirmation returns immediately and sends no request, toast, or refresh.
- Confirming sends the exact request:

```text
POST /api/v1/expeditions/:id/resolve-now
```

- The browser request is made through the existing `requestApi` client.
- The request options contain only `method: "POST"`.
- No request body is supplied.
- No endpoint-specific runtime schema, alternate client, adapter, compatibility wrapper, or duplicate request layer is used.

### Toast, refresh, and failure behavior

On success:

```text
title: Expedition timer resolved
tone: success
```

The command then awaits the existing `refresh` callback exactly once. That callback reloads all ten administration resources in one `Promise.all`.

On failure:

```text
title: Timer command failed
message: errorMessage(error)
tone: danger
```

The failure path does not emit the success toast and does not invoke the full refresh.

### Existing rendering contract

The populated table retains these columns and values:

1. `Player` - bold `playerName`
2. `Mission` - `name`
3. `Scheduled return` - `new Date(resolvesAt).toLocaleString()`
4. `Control` - right-aligned warning button labeled `Resolve now`

The empty state is exactly `No active expedition timers.`.

The page heading remains:

- Eyebrow: `SCHEDULE CONTROL`
- Title: `Active Expedition Timers`
- Description: `Force an overdue or stuck expedition into its server-calculated resolved state. Players must still claim their rewards.`
- Icon: `events`

The informational notice remains:

- Title: `Other command timers`
- Tone: `info`
- Body: `Player crafting, salvage, scan, station-maintenance, and career timers are listed and reset from the Players workspace. Live-event timers are stopped and reset from Operations.`

### Navigation and visual-proof coverage

- The Timers navigation contract is `{ id: "timers", label: "Timers", icon: "events" }`.
- It remains sixth, after Server and before Players.
- The default administration tab remains `operations`.
- The authenticated visual-proof fixture provides populated timer records through `/api/v1/admin/overview`.
- The Admin and Overlay Visual Proof capture includes the existing desktop `Timers` screenshot at `proof/admin/desktop/timers.png`.
- The fixture-coverage regression derives the ten refresh endpoints from the real administration source and requires an explicit response for every endpoint.

### Existing API route and authorization

- `apps/api/src/routes/expeditions.ts` owns `POST /api/v1/expeditions/:id/resolve-now`.
- The route calls `requireAdmin(context.prisma, request)` before resolving the expedition.
- The identifier comes from the route parameter.
- The route does not consume an administration request body.
- Resolution, persistence, status validation, reward calculation, and response data remain server-owned and are outside this task.

## Authorized Files or Directories

Application source:

- `apps/admin/src/main.tsx`
- New focused files under `apps/admin/src/features/timers/`

Regression protection:

- One focused test under `tools/test/` or the smallest directly relevant browser-test location

Project-control documentation:

- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- One dated handoff record under `docs/handoffs/` when useful

## Required Architecture

- Move only the Timers page, Timers-specific presentation, confirmation, and force-resolve command into the focused Timers feature module.
- Keep authentication, authorization presentation, navigation, page composition, remote state loading, and cross-feature orchestration in `AdminApp`.
- Continue receiving the existing timer records through props from shell-owned overview state.
- Continue receiving the existing full-refresh callback and toast function through props.
- Keep the production command connected to `requestApi` from `@neon-wreckers/browser-client`.
- Preserve the ten-resource `Promise.all` refresh exactly.
- Preserve the full refresh after successful force resolution.
- Do not make the Timers feature own the overview GET request.
- Do not import another administration feature into the Timers feature.

## Explicitly Forbidden Changes

- Do not extract Refunds, Players, Commands, Integrations, Expedition Creator, Config, Operations, or another administration feature.
- Do not change the Server feature.
- Do not change or decompose the ten-resource refresh.
- Do not move general shell state or API orchestration out of `AdminApp`.
- Do not change production API routes, methods, payloads, response shapes, authorization, audit behavior, database behavior, or browser-client behavior.
- Do not change gameplay, balance, rewards, content, expedition resolution rules, timing calculations, worker behavior, CSS, shared UI, graphics, visual design, navigation, accessibility behavior, or screenshot expectations.
- Do not change deployment architecture, Docker, nginx, Vite configuration, or unrelated workflows.
- Do not add endpoint-specific runtime schemas or perform contract consolidation.
- Do not hide unrelated cleanup inside this task.
- Do not begin Refunds, Players, refresh decomposition, or later administration work in this chat.

## Expected Behavior Change

None. This is an ownership extraction only.

## Expected Behavior That Must Remain Unchanged

- Exact navigation identifier, order, label, icon, and default tab
- Exact table headings, row values, date rendering, button text, empty state, page copy, notice copy, and existing CSS classes
- Exact confirmation copy and cancellation behavior
- Exact request method, route interpolation, and bodyless payload behavior
- Exact success and failure toast titles, messages, and tones
- Exactly one full refresh after success and no refresh after failure or cancellation
- Existing ten-resource administration refresh and all endpoint paths
- Existing authenticated visual-proof fixture coverage and screenshot output
- API authorization, server-side resolution, persistence, and response behavior
- Authentication, accessibility, gameplay, content, deployment, and production behavior

## Executable Pre-Change Baseline

The task-definition commit must contain project-control documentation only. Before application source is edited, run against that unchanged source state:

```text
pnpm install --frozen-lockfile
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

`pnpm verify` is preferred when the validation environment supports it.

The local execution container cannot resolve GitHub or the npm registry. The executable baseline will therefore run through the repository's authenticated GitHub Actions environment, and the run ID, job ID, tested commit, and exact result must be recorded before source editing continues.

## Regression Protection Required

The focused regression must prove at minimum:

- `AdminApp` imports and composes the Timers feature.
- The feature does not own authentication, navigation, the overview GET request, or unrelated API requests.
- Active timers render from the existing record shape.
- The existing empty state remains present.
- Confirming sends the exact bodyless `POST /api/v1/expeditions/:id/resolve-now` request.
- Cancelling sends no request.
- Success emits the exact success toast and invokes the full refresh exactly once.
- Failure emits the exact danger toast and does not emit false success or refresh.
- Existing labels, columns, date rendering, button text, confirmation copy, notice copy, and visual classes remain unchanged.
- The ten-resource administration refresh remains intact.
- The authenticated visual-proof fixture explicitly covers every refresh endpoint.
- The API route still requires administrative authorization and remains body-independent.

## Validation Commands

At minimum:

```text
pnpm install --frozen-lockfile
node --test tools/test/admin-timers-feature.test.mjs
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
pnpm verify
```

Also run the exact authenticated Admin and Overlay Visual Proof workflow or its exact local capture equivalent against the validated source head.

When validation runs remotely, record the workflow run IDs, job IDs, tested commit, and exact result.

## Rollback Method

Revert the final Timers extraction merge commit. The rollback restores the inline Timers page and removes the focused Timers module and regression test without requiring an API, database, content, or deployment rollback.

## Completion Evidence

Pending:

- Executable pre-change baseline commit, run ID, job ID, and result
- Timers feature module and shell composition diff
- Focused regression-test commit and result
- Full `pnpm verify` result
- Admin and Overlay Visual Proof run, job, artifact, and result
- Final diff review showing only authorized files
- Starting main commit
- Task-definition commit
- Timers extraction commit
- Focused regression-test commit
- Validated source head
- Final merge commit
- Final documented main closeout commit

## Expected Stopping Point

Stop after the Timers extraction is validated, documented, merged, and its final commit hashes are recorded. Do not begin Refunds, Players, refresh decomposition, or another Phase 1 task in this chat.
