# Neon Wreckers Current Task

**Task ID:** `P1-T03-REFUNDS`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Implementation complete and source-validated; final reviewed-branch validation and merge pending  
**Started:** 2026-07-28  
**Starting main commit:** `de35951935551a6b1244734ff39003bcf08e2a1c`  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

## Objective

Extract only the existing Refunds administration page, Refunds-specific presentation, refund-reason state, browser confirmation, and refund command from `apps/admin/src/main.tsx` into a focused module under `apps/admin/src/features/refunds/` without changing behavior.

## Completed Architecture

- Added `apps/admin/src/features/refunds/refunds-page.tsx`.
- Moved only the Refunds page, transaction presentation, refund-reason state, eligibility check, confirmation flow, and refund command into that module.
- Kept authentication, navigation, page composition, transaction loading, remote resource loading, and cross-feature orchestration in `AdminApp`.
- Kept the existing ten-resource `Promise.all` refresh intact and in the same order.
- Continued receiving shell-owned `LoyaltyTransaction[]`, the full-refresh callback, and toast delivery through props.
- Continued using the production `requestApi` browser client directly.
- Added no duplicate request layer, compatibility wrapper, endpoint-specific runtime schema, or contract-consolidation change.
- Changed no API route, authorization, StreamElements behavior, database behavior, audit behavior, CSS, shared UI, gameplay, content, worker, deployment, or second administration feature.

## Preserved Behavior

### Data and presentation

- The shell continues loading `/api/v1/admin/transactions` as the seventh request in the ten-resource administration refresh.
- Transaction records retain `id`, `amount`, `actionSlug`, `status`, `createdAt`, `error`, `user.displayName`, and `user.twitchLogin`.
- The exact eyebrow, heading, description, icon, reason label, table columns, locale date rendering, status badges, warning button, empty state, and `admin-stack` root class remain unchanged.
- Status tones remain `committed` -> `success`, `ambiguous` -> `warning`, and every other state -> `neutral`.
- Navigation remains `{ id: "transactions", label: "Refunds", icon: "credits" }`, after Players and before Config.
- The default administration tab remains `operations`.

### Reason, eligibility, confirmation, and cancellation

- Default reason remains `Operator-approved point refund`.
- The Refund button remains enabled only for `committed` or `ambiguous` transactions when `reason.length >= 3`.
- Confirmation copy remains `Refund ${transaction.amount} points to ${transaction.user.displayName}?`.
- Cancelling returns without a request, toast, or refresh.

### Request, success, and failure

Exact request remains:

```text
POST /api/v1/admin/transactions/:id/refund
body: JSON.stringify({ reason })
```

- The browser does not trim or normalize the reason before serialization.
- Success toast remains `Points refunded`, message `${transaction.amount} points returned to ${transaction.user.displayName}.`, tone `success`.
- Success invokes the existing full ten-resource refresh exactly once.
- Failure toast remains `Refund failed`, message `errorMessage(error)`, tone `danger`.
- Failure emits no false success and performs no refresh.

### Production route boundary

The untouched route in `apps/api/src/routes/admin.ts` still:

- Requires administration authorization.
- Trims and validates reason length from 3 through 300 characters.
- Loads the transaction with its user.
- Permits only `committed` and `ambiguous` states.
- Requires the correct active StreamElements connection and original channel.
- Credits StreamElements before local refund persistence.
- Preserves `admin-refund:${transaction.id}` idempotency and the prior external reference.
- Updates the local transaction to `refunded` only after external credit succeeds.
- Records the existing `loyalty.refund` audit event.
- Preserves the existing failure ordering, including the possibility that external credit succeeds before a later local persistence failure.

## Regression Protection

Added `tools/test/admin-refunds-feature.test.mjs` with focused protection proving:

- `AdminApp` imports and composes the Refunds feature.
- The feature does not own authentication, navigation, transaction loading, the shell refresh, or unrelated requests.
- Transaction shape, populated rendering, empty state, labels, columns, date rendering, badge tones, button copy, variants, and classes remain present.
- The default reason, eligible and ineligible statuses, and three-character minimum remain unchanged.
- Confirming sends the exact route, method, and serialized JSON body.
- Cancelling sends no request, toast, or refresh.
- Success emits the exact toast and refreshes exactly once.
- Failure emits only the exact danger toast and does not refresh.
- Navigation, default tab, ten-resource refresh order, visual-proof fixture coverage, Refunds capture, browser-client behavior, API authorization, validation, StreamElements-first ordering, ledger update, and audit behavior remain intact.

## Commit Record

- Starting `main`: `de35951935551a6b1244734ff39003bcf08e2a1c`
- Task definition: `0008a09ecb667866a01894b6b37e668ecdc93609`
- Pre-change baseline record: `29436a4266752235a88df24d12f215d87615e384`
- Refunds feature module: `6f3b49456bc10a01b9ac8e8790c1373f4e1be8d2`
- Refunds extraction and shell composition: `7be6ba27295cc89fa23f34dad8beb468eb5184c0`
- Focused regression test: `401e26f261de01d76f1447f278250a8f4652f341`
- Validated source head: `401e26f261de01d76f1447f278250a8f4652f341`
- Final reviewed branch head: pending final documentation commit
- Final merge commit: pending
- Final documented `main` closeout commit: pending

## Executable Pre-Change Baseline

The task-definition commit changed project-control documentation only. Application source remained identical to starting `main`.

Tested source commit: `0008a09ecb667866a01894b6b37e668ecdc93609`

- CI run `30380261092`
- Verify job `90346080291`
- Result: success
- Frozen dependency installation: success
- Complete `pnpm verify`: success
- `pnpm test:repository`: success
- Administration production build: success
- Overlay production build: success

## Validated Source Head

Source head: `401e26f261de01d76f1447f278250a8f4652f341`  
Pull-request merge test ref: `66ade79e4da0798ae098384656459581c2abb9e3`

### Complete repository verification

- CI run `30382941611`
- Verify job `90355022440`
- Result: success
- Frozen dependency installation: success
- Complete `pnpm verify`: success
- Focused Refunds regression: success as part of `pnpm test:repository`
- Administration production build: success
- Overlay production build: success

### Authenticated Admin and Overlay Visual Proof

- Workflow run `30382941552`
- Screenshots job `90355021602`
- Result: success
- Frozen dependency installation: success
- Production surface builds: success
- Chromium installation: success
- Built preview startup: success
- Exact authenticated capture: success
- Artifact upload: success
- Artifact `8697799828`
- Digest `sha256:9bb39a2df4011a43f93d302e379b7265a8721596dbdd1407211ad477b657d283`
- The artifact contains the existing administration and overlay captures, including `proof/admin/desktop/transactions.png`.

### Additional source-head gates

- Browser integration tests run `30382941553`, Playwright job `90355022020`: success
- CI and security gates run `30382941614`: success
  - Secret scan job `90355022254`
  - Repository verification and production-image job `90355022340`
  - Dependency review job `90355022383`
- CodeQL run `30382941722`: success
- UI Revamp Verify run `30382941799`: success

The local execution container could not resolve GitHub or the npm registry, so executable validation ran in the repository's authenticated GitHub Actions environment.

## Current Diff Boundary

Pull request `#38` currently contains only:

- `apps/admin/src/main.tsx`
- `apps/admin/src/features/refunds/refunds-page.tsx`
- `tools/test/admin-refunds-feature.test.mjs`
- `docs/CURRENT_TASK.md`
- `docs/handoffs/2026-07-28-p1-t03-refunds.md`

Project-status and latest-handoff documentation will be added before final reviewed-branch validation.

No Players, Commands, Integrations, Expedition Creator, Config, Operations, Server, Timers, refresh decomposition, API, database, browser-client, CSS, shared UI, gameplay, content, worker, deployment, Docker, nginx, Vite, or workflow file is included.

## Rollback Method

Before merge, reset or delete the task branch. After merge, revert the final Refunds extraction merge commit. No API, database, content, gameplay, or deployment migration is required.

## Stopping Point

Complete the final documentation, validate the reviewed branch head, review the final diff, merge pull request `#38`, record the final merge and `main` closeout commits, then stop. Do not begin Players, refresh decomposition, contract consolidation, administration API decomposition, or another Phase 1 task in this chat.
