# Neon Wreckers Current Task

**Task ID:** `P1-T05-COMMANDS`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Active, pre-change contract recorded, executable baseline pending  
**Started:** 2026-07-28  
**Starting main commit:** `cecec0f476c91c7397ec0212ff9bc2e637c8835b`  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

The repository owner's explicit task identifier `P1-T05-COMMANDS` governs this work unit. The generic `P1-T05` contract-consolidation work unit listed in `docs/phases/PHASE_01.md` is not started or modified. The administration extraction baseline identifies Commands as the next feature after Players.

## Objective

Extract only the existing Commands administration page, Commands browser presentation models when required for compilation, Commands-specific local state, action-value conversion, editor presentation, save command, and retirement command from `apps/admin/src/main.tsx` into focused files under `apps/admin/src/features/commands/` without changing behavior.

## Reason

Commands is the next feature in the verified administration extraction order. Its discriminated action model, refresh-driven draft synchronization, create-versus-update request behavior, and unusual post-mutation local-state behavior require focused regression protection before the shell boundary changes.

## Authorized Files and Directories

- `apps/admin/src/main.tsx`
- New focused files under `apps/admin/src/features/commands/`
- One focused Commands regression test under `tools/test/` or the smallest directly relevant browser-test location
- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- A dated Commands handoff record under `docs/handoffs/` when useful

## Explicitly Forbidden Changes

- Do not extract Integrations, Expedition Creator, Config, Operations, UI Library, or another administration feature.
- Do not change Server, Timers, Refunds, or Players.
- Do not change or decompose the ten-resource refresh.
- Do not move authentication, authorization presentation, navigation, page composition, remote loading, shell-owned command state, or cross-feature orchestration out of `AdminApp`.
- Do not move command loading into the Commands feature.
- Do not add search, filtering, pagination, sorting, grouping, aliases, debouncing, optimistic updates, loading indicators, duplicate-submit prevention, new disabled states, or new confirmation dialogs.
- Do not change command names, triggers, permissions, costs, cooldowns, actions, rewards, balance, or gameplay behavior.
- Do not change Twitch, StreamElements, authentication, authorization, chat processing, or point-action behavior.
- Do not change production API routes, methods, payloads, response shapes, validation, normalization, persistence, audit behavior, database behavior, browser-client behavior, or failure semantics.
- Do not change CSS, shared UI, graphics, navigation, accessibility behavior, modal behavior, or screenshot expectations.
- Do not change deployment architecture, Docker, nginx, Vite configuration, workflows, or unrelated tooling.
- Do not introduce endpoint-specific runtime schemas, contract consolidation, a feature-wide API client, adapter, service layer, compatibility wrapper, repository abstraction, or duplicate request helper.
- Do not hide unrelated cleanup inside this task.
- Do not begin Integrations extraction, refresh decomposition, API decomposition, contract consolidation, Phase 2 implementation, or another task in this chat.
- Do not modify prepared Phase 2 documents unless required to resolve a direct contradiction in active Phase 1 controls.

## Required Architecture

- Move only Commands presentation models, feature-local state, client-side action conversion, editor presentation, save behavior, confirmation, and retirement behavior into focused files under `apps/admin/src/features/commands/`.
- Keep authentication, authorization presentation, navigation, page composition, shell-owned `commands` state, the `/api/v1/admin/chat-commands` request, the complete ten-resource refresh, and cross-feature orchestration in `AdminApp`.
- Continue receiving the existing command records through props.
- Continue receiving the existing full-refresh callback and toast function through props.
- Continue using the real `requestApi` browser client directly.
- Preserve the exact ten-resource `Promise.all` refresh and request order.
- Preserve the full refresh after every currently successful Commands mutation.
- Preserve exact request methods, routes, payloads, property order, JSON serialization, confirmations, toast text, toast tone, disabled-state logic, error handling, action conversion, selection behavior, and local-state behavior.
- Preserve the exact navigation identifier, order, label, icon, and default administration tab.
- Keep Commands connected to the production API through the existing browser client.

## Verified Repository State

The latest `main` branch is exactly:

```text
cecec0f476c91c7397ec0212ff9bc2e637c8835b
```

No commit exists after that closeout on `main` when this task was defined.

Verified completed Players records:

- Players implementation merge: `d15c50a080e0fd84f9ccd91466e2c6ded22b5961`
- Players documentation closeout merge: `8e0a07b5ea73ce43b9bcc3c26d60f941b655b88d`
- Permanent Players handoff record: `9b708d0ed96b8b3074ebef2dfa3932fa04c58f60`
- Final documented Players closeout: `cecec0f476c91c7397ec0212ff9bc2e637c8835b`

`P1-T04-PLAYERS` is complete, validated, merged, documented, and stopped.

## Verified Pre-Change Browser Contract

### Commands browser models

The current browser presentation model is:

```ts
type ChatCommandAction =
  | { type: "scan" }
  | { type: "salvage"; mode: "cutters" | "cargo" }
  | {
      type: "point_action";
      slug: "rush_scan" | "safety_override";
    };

type ChatCommand = {
  id: string;
  trigger: string;
  description: string;
  enabled: boolean;
  requiresPlayer: boolean;
  action: ChatCommandAction;
  updatedAt: string | null;
  source: "default" | "configured";
};
```

No endpoint-specific runtime schema is passed to `requestApi`. The browser model is compile-time presentation typing only.

### Shell-owned data and loading

`AdminApp` owns:

```text
const [commands, setCommands] = useState<ChatCommand[]>([])
```

The shell loads Commands as request three in the existing ten-resource refresh:

```text
1. GET /api/v1/station
2. GET /api/v1/integrations/streamelements/health
3. GET /api/v1/admin/chat-commands
4. GET /api/v1/admin/config
5. GET /api/v1/admin/overview
6. GET /api/v1/admin/players
7. GET /api/v1/admin/transactions
8. GET /api/v1/admin/balance-telemetry
9. GET /api/v1/admin/live-ops
10. GET /api/v1/admin/expedition-creator
```

The request remains:

```ts
requestApi<ChatCommand[]>("/api/v1/admin/chat-commands")
```

The shell continues calling `setCommands(commandData)` after the shared `Promise.all`. The feature must not own this request or any unrelated request.

### Page composition

`AdminApp` currently composes:

```tsx
<CommandsPage
  commands={commands}
  refresh={refresh}
  pushToast={pushToast}
/>
```

The feature must continue receiving these three dependencies through props.

### Local state and defaults

The Commands page owns:

```text
selected command identifier: useState<string | null>(null)
editable draft: useState<ChatCommand | null>(null)
```

Creating a new command performs these updates in order:

```text
setSelectedId(null)
setDraft(new command object)
```

The exact new-command draft is:

```ts
{
  id: "",
  trigger: "!command",
  description: "Describe what this command does.",
  enabled: true,
  requiresPlayer: true,
  action: { type: "scan" },
  updatedAt: null,
  source: "configured",
}
```

### Refresh synchronization and stale local state

When `selectedId` is truthy and refreshed command props arrive:

- The feature finds a matching command by exact identifier.
- A matching object replaces the complete draft object.
- A missing identifier clears `selectedId` and `draft` in that order.
- When `selectedId` is null, the effect returns without changing the draft.

This produces two compatibility-sensitive post-success behaviors:

1. Updating an existing command leaves the modal open and the subsequent full refresh replaces the draft with the refreshed matching object.
2. Creating a new command leaves `selectedId` null, so the subsequent full refresh does not select or replace the newly created command. The original local draft remains open and stale.
3. Successful retirement clears only `selectedId` before refresh. Because the effect returns when `selectedId` is null, the draft remains open and stale, and the modal changes to create mode.

Do not close the modal, clear the draft, select the created command, replace the retired draft, reset fields, optimistically update the list, or otherwise repair these behaviors in this extraction.

### List rendering and transformation

Commands render in the exact incoming array order. There is no browser search, filter, sort, grouping, pagination, alias expansion, or other list transformation.

Each command button preserves:

- Key: `command.id`
- Base class: `admin-player-button`
- Selected class: `is-selected`
- Selection behavior: set identifier, then store the complete current command object as draft
- Trigger inside `<strong>`
- Description inside `<span>`
- Status text: `Enabled` or `Disabled`
- Source text appended after ` · `

An empty command array renders the existing empty `admin-player-list` inside the existing `Panel`. No empty-state message exists.

### Modal open, close, and title behavior

The modal is always composed and preserves:

```text
open: Boolean(draft)
close: setDraft(null), then setSelectedId(null)
size: lg
description: Configure the trigger and its allowlisted server action.
```

Modal title behavior:

```text
existing selection: Edit <trigger>
new or stale unselected draft: Create <trigger>
no draft: Command editor
```

The editor's internal eyebrow is `EDIT COMMAND` when `selectedId` is truthy and `NEW COMMAND` otherwise.

### Form fields and browser conversion

The editor preserves:

- Trigger label: `Chat trigger`
- Trigger hint: `Starts with ! and matches the full normalized chat message`
- Trigger input conversion: raw `event.target.value`
- Description label: `Description`
- Description input conversion: raw `event.target.value`
- Server action label: `Server action`
- Enabled checkbox class: `admin-check`
- Enabled conversion: raw `event.target.checked`
- Enabled copy: `Command enabled`

The browser does not trim, lowercase, collapse whitespace, validate the trigger pattern, trim the description, enforce lengths, validate uniqueness, or alter `requiresPlayer` from the editor. The server is authoritative for those rules.

### Action select mapping

The current presentation key is derived exactly as:

```text
scan action -> scan
salvage cutters -> salvage:cutters
salvage cargo -> salvage:cargo
rush scan point action -> point:rush_scan
safety override point action -> point:safety_override
```

The select options and order remain:

```text
scan -> Scan for wreck
salvage:cutters -> Deploy cutters
salvage:cargo -> Deploy cargo recovery
point:rush_scan -> Spend points: rush scan
point:safety_override -> Spend points: safety override
```

`setAction` performs independent exact-value checks and replaces only the `action` property through object spread. Unknown values do nothing.

### Save behavior

Save returns immediately when no draft exists. No browser confirmation is used.

Create remains:

```text
POST /api/v1/admin/chat-commands
```

Update remains:

```text
PUT /api/v1/admin/chat-commands/:encoded-selected-id
```

The selected identifier is encoded with `encodeURIComponent`.

Exact payload construction and property order:

```ts
JSON.stringify({
  trigger: draft.trigger,
  description: draft.description,
  enabled: draft.enabled,
  requiresPlayer: true,
  action: draft.action,
})
```

The browser always serializes `requiresPlayer: true` rather than using the draft property.

Save success emits exactly:

```text
title: Chat command saved
message: draft.trigger
tone: success
```

Save success then awaits the complete refresh exactly once. It performs no direct local-state mutation.

Save failure emits exactly:

```text
title: Command rejected
message: errorMessage(error)
tone: danger
```

Save failure emits no false success, performs no refresh, and leaves local state unchanged.

### Retirement behavior

Retirement returns without side effects when:

- No selected identifier exists.
- No draft exists.
- The browser confirmation is cancelled.

The exact confirmation copy is:

```text
Retire <draft.trigger>?
```

Retirement remains:

```text
DELETE /api/v1/admin/chat-commands/:encoded-selected-id
```

There is no body.

Retirement success emits exactly:

```text
title: Chat command retired
tone: success
no message
```

Retirement success then calls `setSelectedId(null)` and awaits the complete refresh exactly once. It does not clear the draft.

Retirement failure emits exactly:

```text
title: Retire failed
message: errorMessage(error)
tone: danger
```

Retirement failure emits no false success, performs no refresh, and leaves local state unchanged.

### Disabled-state and duplicate-submit behavior

- `Save command` is always rendered when a draft exists and has no current disabled condition.
- `Retire command` is rendered only when `selectedId` is truthy, uses variant `warning`, and has no current disabled condition.
- No loading flag or duplicate-submit prevention exists.
- The command-enabled checkbox controls only the serialized `enabled` value.
- There are no dedicated enable, disable, reset, or test-command endpoints in this browser feature.

## Verified Rendering Contract

Preserve all existing copy, icons, tones, values, classes, variants, and accessibility behavior:

- Root class: `admin-stack`
- Eyebrow: `CHAT AUTOMATION`
- Title: `Command Editor`
- Description: `Commands map to a safe server-side action allowlist. They cannot execute arbitrary code.`
- Icon: `terminal`
- Header action: `New command`
- Layout class: `admin-player-layout`
- List class: `admin-player-list`
- Command button class: `admin-player-button`
- Selected class: `is-selected`
- Modal size: `lg`
- Modal description: `Configure the trigger and its allowlisted server action.`
- Internal editor icon: `terminal`
- Notification title: `Linked viewer account required`
- Notification tone: `info`
- Notification body: `All current command actions modify persistent player state, so the chatter must have signed into Neon Wreckers.`
- Notification title: `Execution boundary`
- Notification tone: `info`
- Notification body: `The action is selected from a validated server allowlist. Point-funded actions still require a verified StreamElements account, the per-account toggle, and the server kill switch.`
- Actions class: `admin-mobile-actions`
- Save button text: `Save command`
- Retire button text: `Retire command`
- Retire variant: `warning`

The extraction must retain the shared `Modal`, `Field`, `Input`, `Select`, `Notification`, `Panel`, `SectionTitle`, and `Button` accessibility behavior without changing shared UI or CSS.

## Navigation Contract

Commands remains the fourth navigation destination:

```ts
{ id: "commands", label: "Commands", icon: "terminal" }
```

It remains after Integrations and before Server. The default administration tab remains `operations`.

## Visual-Proof Contract

The authenticated visual-proof fixture explicitly covers all ten refresh endpoints, including the full Commands response shape.

Existing Commands captures must remain declared and generated:

- `proof/admin/desktop/commands.png` at 1920 x 1080
- `proof/admin/tablet/commands.png` at 1024 x 768
- `proof/admin/mobile/commands.png` at 390 x 844

No visual-proof fixture, viewport, screenshot name, CSS, navigation, or capture workflow change is authorized.

## Verified Production API Contract

### Route authorization and response envelopes

All Commands administration routes use `requireAdmin`, which requires an authenticated, non-suspended player with the `admin` or `streamer` role.

Routes remain:

```text
GET    /api/v1/admin/chat-commands
POST   /api/v1/admin/chat-commands
PUT    /api/v1/admin/chat-commands/:id
DELETE /api/v1/admin/chat-commands/:id
```

Successful routes return the existing `{ data, requestId }` envelope. Existing Fastify error handling and browser-client error extraction remain unchanged.

### Request validation

The server remains authoritative for:

- Trigger trimming
- Trigger minimum 2 and maximum 80 characters
- Trigger pattern `^![a-z0-9][a-z0-9 _-]*$` with case-insensitive matching
- Description trimming
- Description minimum 3 and maximum 240 characters
- Boolean `enabled` with default `true`
- Boolean `requiresPlayer` with default `true`
- Allowlisted discriminated action union
- Path identifier minimum 1 and maximum 120 characters

Allowlisted actions remain:

- `scan`
- `salvage` with mode `cutters` or `cargo`
- `point_action` with slug `rush_scan` or `safety_override`

### Normalization, availability, and ordering

The server:

- Normalizes triggers by trimming, lowercasing, and collapsing whitespace.
- Forces `requiresPlayer: true` when loading configured commands and when saving.
- Merges default and latest configured versions by identifier.
- Removes a command from the available list when its latest lifecycle is `retired`.
- Sorts loaded commands by `trigger.localeCompare`.
- Matches chat messages only when an enabled command has the exact normalized trigger.
- Provides no command alias mechanism.

The browser is not authoritative for availability, validation, normalization, duplicate detection, or execution.

### Persistence, conflict, and audit semantics

Commands persist as immutable `contentVersion` revisions under the `chat-command.` slug prefix.

Save behavior remains:

- Generate a usable identifier from the trigger for new commands.
- Reject an unusable generated identifier.
- Reject a duplicate normalized trigger assigned to a different identifier.
- Acquire the existing transaction lock.
- Create the next active content version.
- Store the normalized command JSON.
- Store validation `{ allowlist: true }`.
- Set `publishedAt`.
- Record `createdById`.
- Write audit action `chat-command.save` with before, after, target, actor, and request identifier.

Retirement behavior remains:

- Acquire the existing transaction lock.
- Create the next retired content version, including when no prior version exists.
- Preserve the latest content JSON or use an empty object.
- Store validation `{ allowlist: true }`.
- Record `createdById`.
- Write audit action `chat-command.retire` with before, `{ retired: true }`, target, actor, and request identifier.

No API, service, database, content-version, transaction-lock, audit, or failure behavior may change.

## Twitch, StreamElements, and Gameplay Relationship

Twitch EventSub chat execution remains server-owned:

- Verify the EventSub signature.
- Deduplicate by external event identifier.
- Normalize and resolve the chat message through `findChatCommand`.
- Ignore absent, disabled, or nonmatching commands.
- Require a linked Neon Wreckers player for all current commands.
- Dispatch `scan` to `scanForWreck`.
- Dispatch `salvage` to `deploySalvage` with the selected mode.
- Dispatch point actions to `executePointAction` with the Twitch message identifier as the idempotency source.

Point-funded commands remain subject to:

- The server point-action kill switch.
- A selected verified StreamElements account.
- The selected account's point-action toggle.
- The server-owned point cost.
- Existing idempotency, loyalty debit, persistence, refund, ambiguous-result, and failure semantics.

No alias, cost, cooldown, permission, reward, gameplay action, StreamElements, or Twitch behavior may change.

## Expected Behavior Change

None. This is a source-ownership extraction only.

## Expected Behavior That Must Remain Unchanged

All browser, API, authentication, authorization, validation, normalization, persistence, audit, Twitch, StreamElements, gameplay, rendering, accessibility, refresh, editor-state, confirmation, toast, visual-proof, build, workflow, and deployment behavior described above.

## Regression Protection Required

The focused Commands regression test must prove at minimum:

1. `AdminApp` imports and composes the focused Commands feature.
2. The feature does not own authentication, authorization presentation, navigation, command loading, the shell refresh, or unrelated requests.
3. `AdminApp` retains shell-owned Commands state and the `/api/v1/admin/chat-commands` request.
4. The exact ten-resource refresh remains intact and in the same order.
5. The authenticated visual-proof fixture still explicitly covers every refresh endpoint.
6. Desktop, tablet, and mobile Commands captures remain declared.
7. The exact command response and action shapes remain supported.
8. Every local state and new-command default remains unchanged.
9. Incoming list order, empty-list behavior, selection, refresh synchronization, and stale draft behavior remain unchanged.
10. Exact action-key derivation and select-value conversion remain unchanged.
11. Exact form labels, hints, values, input conversion, checkbox conversion, copy, classes, icons, tones, variants, and modal behavior remain unchanged.
12. Exact create and update routes, methods, encoded identifiers, payload property order, and JSON serialization remain unchanged.
13. Save success emits the exact toast and invokes the full refresh exactly once.
14. Save failure emits the exact error toast and performs no refresh.
15. Save has no browser confirmation and introduces no post-success local-state mutation.
16. Retirement uses the exact confirmation copy and issues no request or refresh after cancellation.
17. Retirement uses the exact route and bodyless DELETE request.
18. Retirement success emits the exact toast, clears only the selected identifier, and invokes the full refresh exactly once.
19. Retirement failure emits the exact error toast and performs no refresh.
20. No loading flags, optimistic updates, duplicate-submit prevention, state resets, editor closing, selected-object replacement, or new disabled states are introduced.
21. Production route authorization, validation, normalization, persistence, audit, conflict, response, and failure semantics remain intact.
22. Twitch resolution, action dispatch, player requirement, StreamElements gates, and server-authoritative execution remain intact.
23. No API, browser-client, CSS, fixture, workflow, shared UI, gameplay, content, worker, deployment, or unrelated feature change occurs.

## Validation Commands

Establish and record an executable baseline before editing application source. At minimum:

```bash
pnpm install --frozen-lockfile
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

Also run:

```bash
node --test tools/test/admin-commands-feature.test.mjs
pnpm test:browser
pnpm verify
```

Run the authenticated Admin and Overlay Visual Proof workflow or its exact local capture equivalent.

Use existing CI, security, CodeQL, UI verification, Compose validation, dependency review, secret scan, and production-image gates when available.

When validation runs remotely, record:

- Workflow run IDs
- Job IDs
- Tested commit
- Exact result
- Visual-proof artifact identifier
- Visual-proof artifact digest
- Confirmation that desktop, tablet, and mobile Commands captures remain present

Do not claim a command or workflow passed unless it actually ran successfully.

## Diff Review Requirement

Before merge:

- Review every changed file.
- Review the complete final diff.
- Confirm the diff is limited to `apps/admin/src/main.tsx`, focused files under `apps/admin/src/features/commands/`, the focused Commands regression test, and authorized project-control documentation.
- Remove unrelated changes.

## Commit Evidence Required

Record, when applicable:

- Starting `main` commit
- Task-definition commit
- Pre-change baseline record commit
- Commands feature-module commit
- Commands extraction and shell-composition commit
- Focused regression-test commit
- Validated source head
- Final reviewed branch head
- Final implementation merge commit
- Documentation closeout merge commit
- Permanent Commands handoff record commit
- Final documented `main` closeout commit

## Rollback Method

Revert the final Commands implementation merge commit. This must restore the inline Commands page and remove the focused feature module and regression test without requiring an API, database, browser-client, gameplay, content, worker, CSS, visual-proof, or deployment rollback. Revert any separate documentation closeout only when the closeout records must also be rolled back.

## Completion Evidence

This task is complete only when:

- The exact pre-change baseline is recorded before application-source editing.
- Commands is extracted within the authorized boundary.
- Focused regression protection passes.
- Required builds, repository tests, browser integration, authenticated visual proof, and available gates pass.
- Existing Commands captures remain present.
- The final diff has no unrelated changes.
- The implementation is merged.
- Project-control documents and the permanent handoff record contain final commit and validation evidence.
- The final documented `main` closeout is recorded.

## Stop Boundary

Stop after `P1-T05-COMMANDS` is validated, documented, merged, and its final hashes are recorded.

Do not begin Integrations, refresh decomposition, contract consolidation, API decomposition, Phase 2 implementation, or any other task in this chat.
