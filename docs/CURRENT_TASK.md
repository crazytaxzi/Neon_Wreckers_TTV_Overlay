# Neon Wreckers Current Task

**Task ID:** `P1-T03-REFUNDS`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Complete, validated, documented, and merged  
**Started:** 2026-07-28  
**Completed:** 2026-07-28  
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
- Final reviewed branch head: `9cee80425b9848efd219f5f2cfeeb6364f684f0e`
- Final merge commit: `d4443d94f6bbfa1594a44956dadca1a52aa8beb2`
- Final documented `main` closeout commit: the final `docs/handoffs/LATEST.md` closeout commit created after this record

## Executable Pre-Change Baseline

Application source remained identical to starting `main` at the tested task-definition commit `0008a09ecb667866a01894b6b37e668ecdc93609`.

- CI run `30380261092`
- Verify job `90346080291`
- Frozen dependency installation: success
- Complete `pnpm verify`: success
- `pnpm test:repository`: success
- Administration production build: success
- Overlay production build: success

## Validated Source Head

Source head: `401e26f261de01d76f1447f278250a8f4652f341`

- CI run `30382941611`, Verify job `90355022440`: success
- Admin and Overlay Visual Proof run `30382941552`, screenshots job `90355021602`: success
- Browser integration tests run `30382941553`, Playwright job `90355022020`: success
- CI and security gates run `30382941614`: success
- CodeQL run `30382941722`: success
- UI Revamp Verify run `30382941799`: success
- Visual artifact `8697799828`
- Digest `sha256:9bb39a2df4011a43f93d302e379b7265a8721596dbdd1407211ad477b657d283`

## Final Reviewed Branch Validation

Tested source head: `9cee80425b9848efd219f5f2cfeeb6364f684f0e`

- CI run `30383641923`, Verify job `90357369617`: frozen install and complete `pnpm verify`, success
- Admin and Overlay Visual Proof run `30383641616`, screenshots job `90357369045`: production builds, browser installation, built previews, authenticated capture, and artifact upload, success
- Visual artifact `8698083588`, digest `sha256:58037a390768861378d63b080062ff48ffda97bf6ffb5633c7545f4da0c8123c`, includes `proof/admin/desktop/transactions.png`
- Browser integration tests run `30383642017`, Playwright job `90357369983`: success
- CodeQL run `30383641829`, JavaScript/TypeScript job `90357369367`: success
- UI Revamp Verify run `30383641724`, verify job `90357369170`: success
- CI and security gates run `30383642758`: success
  - Repository verification and production-image job `90357373135`
  - Dependency review job `90357373183`
  - Secret scan job `90357373212`

The local execution container could not resolve GitHub or the npm registry, so executable validation ran in the repository's authenticated GitHub Actions environment.

## Final Diff Boundary

Pull request `#38` contained exactly:

- `apps/admin/src/main.tsx`
- `apps/admin/src/features/refunds/refunds-page.tsx`
- `tools/test/admin-refunds-feature.test.mjs`
- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- `docs/handoffs/2026-07-28-p1-t03-refunds.md`

No Players, Commands, Integrations, Expedition Creator, Config, Operations, Server, Timers, refresh decomposition, API, database, browser-client, CSS, shared UI, gameplay, content, worker, deployment, Docker, nginx, Vite, or workflow file was included.

## Rollback Method

Revert Refunds extraction merge commit `d4443d94f6bbfa1594a44956dadca1a52aa8beb2`. No API, database, content, gameplay, or deployment migration is required.

## Stopping Point

`P1-T03-REFUNDS` is complete, validated, documented, and merged as `d4443d94f6bbfa1594a44956dadca1a52aa8beb2`. Stop here. Do not begin Players, refresh decomposition, contract consolidation, administration API decomposition, or another Phase 1 task in this chat.
