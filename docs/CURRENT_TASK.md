# Neon Wreckers Current Task

**Task ID:** `P1-T03-REFUNDS`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Active; executable pre-change baseline pending  
**Started:** 2026-07-28  
**Starting main commit:** `de35951935551a6b1244734ff39003bcf08e2a1c`  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

## Objective

Extract only the existing Refunds administration page, Refunds-specific presentation, refund-reason state, browser confirmation, and refund command from `apps/admin/src/main.tsx` into a focused module under `apps/admin/src/features/refunds/` without changing behavior.

## Reason

Refunds is the next narrow administration frontend slice in the verified Phase 1 extraction order. It owns one feature-specific resource, one local reason value, one confirmation, and one audited mutation while still depending on shell-owned transaction loading, full refresh, toast delivery, navigation, authentication, and page composition.

## Authorized Files or Directories

- `apps/admin/src/main.tsx`
- New focused files under `apps/admin/src/features/refunds/`
- One focused regression test under `tools/test/` or the smallest directly relevant browser-test location
- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- A dated Refunds handoff record under `docs/handoffs/` when useful

## Explicitly Forbidden Changes

- Do not extract Players, Commands, Integrations, Expedition Creator, Config, Operations, Server, Timers, or another administration feature.
- Do not change the Server or Timers features.
- Do not change, decompose, reorder, or partially recover the ten-resource administration refresh.
- Do not move authentication, navigation, page composition, transaction loading, general shell state, remote resource loading, or cross-feature orchestration out of `AdminApp`.
- Do not change production API routes, methods, payloads, response shapes, authorization, transaction eligibility, validation, audit behavior, StreamElements behavior, database behavior, or browser-client behavior.
- Do not change point balances, refund rules, transaction states, gameplay, balance, rewards, content, timing calculations, or worker behavior.
- Do not change CSS, shared UI, graphics, visual design, navigation, accessibility behavior, or screenshot expectations.
- Do not change deployment architecture, Docker, nginx, Vite configuration, or unrelated workflows.
- Do not add an endpoint-specific runtime schema, duplicate request layer, compatibility wrapper, or contract-consolidation change.
- Do not hide unrelated cleanup inside this task.
- Do not begin Players extraction, refresh decomposition, administration API decomposition, contract consolidation, or later Phase 1 work in this chat.

## Expected Behavior Change

None. This is an ownership extraction only.

## Required Architecture

- Add a focused Refunds feature module under `apps/admin/src/features/refunds/`.
- Move only the Refunds page, Refunds-specific presentation, refund-reason state, confirmation flow, and refund command into that module.
- Keep authentication, navigation, page composition, remote resource loading, and cross-feature orchestration in `AdminApp`.
- Continue receiving the existing shell-owned loyalty transactions through props.
- Continue receiving the existing full-refresh callback and toast function through props.
- Continue using `requestApi` from `@neon-wreckers/browser-client` directly.
- Preserve the single ten-resource `Promise.all` refresh exactly.
- Preserve the full refresh after a successful refund.

## Pre-Change Refunds Contract

### Shell ownership and transaction loading

`AdminApp` owns `transactions` as `LoyaltyTransaction[]` state and loads it through the existing seventh request in the ten-resource refresh:

```text
GET /api/v1/admin/transactions
```

The request remains inside the shell-owned `Promise.all`. The returned records are stored with `setTransactions(transactionsData)` and passed into the Refunds page with `refresh` and `pushToast`.

The handwritten browser record shape is:

```text
id: string
amount: number
actionSlug: string
status: string
createdAt: string
error: string | null
user.displayName: string
user.twitchLogin: string
```

The production GET route requires administration authorization, includes the related user display name and Twitch login, orders transactions by `createdAt` descending, and returns at most 100 records.

### Refund reason state

The Refunds page owns one local string state value.

Exact default:

```text
Operator-approved point refund
```

The field label remains:

```text
Required refund reason
```

The input remains controlled by that state without trimming or normalization in the browser before submission.

### Eligibility and disabled-state behavior

The Refund button is enabled only when both conditions are true:

1. `row.status` is exactly `committed` or `ambiguous`.
2. `reason.length` is at least `3` in the browser.

The exact disabled expression remains behaviorally equivalent to:

```text
!["committed", "ambiguous"].includes(row.status) || reason.length < 3
```

All other transaction states remain ineligible in the administration presentation.

### Confirmation and cancellation

Exact confirmation copy:

```text
Refund ${transaction.amount} points to ${transaction.user.displayName}?
```

Rejecting confirmation returns immediately. Cancellation sends no request, emits no toast, and invokes no refresh.

### Refund request and serialization

Exact route and method:

```text
POST /api/v1/admin/transactions/:id/refund
```

Exact request options remain behaviorally identical to:

```text
{
  method: "POST",
  body: JSON.stringify({ reason })
}
```

`requestApi` continues to pass the serialized JSON string through unchanged, add `content-type: application/json` when a body is present, include browser credentials, validate only the shared API envelope, and use no endpoint-specific runtime schema.

### Success behavior

After a successful refund request, the page emits exactly:

```text
title: Points refunded
message: ${transaction.amount} points returned to ${transaction.user.displayName}.
tone: success
```

It then awaits the supplied full refresh exactly once.

### Failure behavior

A failed refund emits exactly:

```text
title: Refund failed
message: errorMessage(error)
tone: danger
```

Failure emits no false success and performs no refresh.

### Populated and empty rendering

The Refunds page currently renders:

- Root class: `admin-stack`
- Eyebrow: `FINANCIAL OPERATIONS`
- Title: `Point Transactions & Refunds`
- Description: `Refunds credit StreamElements first and update the local ledger only after confirmation.`
- Icon: `credits`
- Required reason field before the transaction panel
- A `DataGrid` using transaction `id` as the row key
- Empty state: `No point transactions.`

Exact columns and presentation:

1. `Player` renders `row.user.displayName` in `<strong>`.
2. `Command` renders `row.actionSlug`.
3. `Points` renders `row.amount`, right aligned.
4. `Status` renders the raw status inside a `Badge`.
5. `Created` renders `new Date(row.createdAt).toLocaleString()`.
6. `Control` is right aligned and renders a small warning `Refund` button.

Status tones remain:

- `committed` -> `success`
- `ambiguous` -> `warning`
- every other state -> `neutral`

### Navigation and visual proof

Navigation remains exactly:

```text
{ id: "transactions", label: "Refunds", icon: "credits" }
```

It remains after Players and before Config. The default administration tab remains `operations`.

The authenticated visual-proof fixture continues to provide `/api/v1/admin/transactions` explicitly as part of all ten refresh endpoints. It currently supplies populated settled, pending, and failed records. The existing desktop Refunds capture remains:

```text
proof/admin/desktop/transactions.png
```

No screenshot name, viewport, navigation label, fixture interception behavior, CSS, or visual expectation may change.

## Production Refund API Contract

The existing route remains in `apps/api/src/routes/admin.ts` and must not be edited.

### Authorization and input validation

- Calls `requireAdmin(context.prisma, request)` before performing the refund.
- Reads the path transaction identifier as a string.
- Parses the request body with a Zod object containing only `reason`.
- Server validation trims the reason and requires a minimum length of `3` and maximum length of `300`.
- Loads the loyalty transaction with its full related user through `findUniqueOrThrow`.
- Rejects every status except `committed` and `ambiguous` with `NOT_REFUNDABLE`.

### StreamElements selection and validation

- Reads the original `requestJson` as a record.
- Resolves the username from `requestJson.username`, then the user Twitch login, then the display name.
- Requires an active StreamElements connection.
- Resolves the original channel from `requestJson.channelId`, then `transaction.broadcasterId`.
- Rejects a channel mismatch before issuing the credit.

### StreamElements-first ordering

The route calls `context.loyaltyProvider.credit` before any local ledger update or refund audit write.

Exact credit inputs remain:

```text
channelId: selected connection channel
username: resolved original username
amount: transaction.amount
reason: server-trimmed reason
idempotencyKey: admin-refund:${transaction.id}
priorReference: transaction.externalReference when present
```

The StreamElements provider sends a positive absolute point amount through its existing PUT request and includes `reason`, `idempotencyKey`, and `priorReference` in its JSON body.

### Local persistence and audit

Only after the external credit succeeds, one Prisma transaction:

1. Updates the loyalty transaction status to `refunded`.
2. Replaces `responseJson` with `adminRefundReference`, `reason`, and `channelId`.
3. Creates an audit record with action `loyalty.refund`, the transaction identifier as target, and the refunded amount, reason, external reference, and channel ID.

The route then returns the updated transaction in the normal API success envelope.

### Existing failure semantics

- Authorization, body validation, missing transaction, ineligible status, missing StreamElements connection, channel mismatch, or provider-credit failure occur before local refund persistence and audit creation.
- The external StreamElements credit deliberately occurs before the local Prisma transaction. If the external credit succeeds but the later local transaction fails, that failure propagates after the external credit. This extraction must not reorder, wrap, compensate, or otherwise alter that existing behavior.

## Regression Protection Required

The focused regression must prove at minimum:

- `AdminApp` imports and composes the focused Refunds feature.
- The extracted feature does not own authentication, navigation, transaction loading, or unrelated API requests.
- Transactions render using the existing data shape.
- The existing empty state remains present.
- The default refund reason remains `Operator-approved point refund`.
- Eligible `committed` and `ambiguous` records and ineligible records retain the same button behavior.
- The browser minimum reason-length requirement remains `3`.
- Confirming sends the exact POST route and exact `JSON.stringify({ reason })` payload.
- Cancelling sends no request, toast, or refresh.
- Success emits the exact existing toast and invokes the full refresh exactly once.
- Failure emits the exact existing danger toast and no false success or refresh.
- Existing labels, columns, date rendering, status tones, button text, confirmation copy, root class, and UI component variants remain unchanged.
- The single ten-resource administration refresh and endpoint order remain intact.
- The authenticated visual-proof fixture still explicitly covers all ten refresh endpoints and the desktop Refunds capture.
- The production route still preserves administration authorization, reason validation, eligibility validation, StreamElements account checks, StreamElements-first ordering, idempotency key, prior reference, local ledger update, audit behavior, and failure ordering.

## Validation Commands

Establish the executable pre-change baseline before application source edits and record the tested commit, workflow run IDs, job IDs, and exact results.

Minimum baseline and final checks:

```text
pnpm install --frozen-lockfile
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

Also run:

- The focused Refunds regression test
- The authenticated Admin and Overlay Visual Proof workflow or its exact local capture equivalent
- `pnpm verify` when the environment supports it

When validation is remote, record the workflow run IDs, job IDs, tested commit, and exact result.

## Rollback Method

Before merge, reset or delete the task branch. After merge, revert the final Refunds extraction merge commit. No API, database, content, gameplay, or deployment migration is authorized or required.

## Completion Evidence Required

Record:

- Starting `main` commit
- Task-definition commit
- Refunds feature-module commit
- Refunds extraction and shell-composition commit
- Focused regression-test commit
- Executable pre-change baseline runs and jobs
- Validated source head and validation runs and jobs
- Final reviewed branch head and validation runs and jobs
- Final diff boundary
- Final merge commit
- Final documented `main` closeout commit

## Expected Stopping Point

Stop after the Refunds extraction is validated, documented, merged, and all final commit hashes are recorded. Do not begin Players, refresh decomposition, contract consolidation, administration API decomposition, or any other Phase 1 task in this chat.
