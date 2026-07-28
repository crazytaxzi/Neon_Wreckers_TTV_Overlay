# Neon Wreckers Current Task

**Task ID:** `P1-T04-PLAYERS`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Active, pre-change contract recorded, executable baseline pending  
**Started:** 2026-07-28  
**Starting main commit:** `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time.

The repository owner's explicit task identifier is authoritative for this work unit. The generic `P1-T04` administration API work unit listed in `docs/phases/PHASE_01.md` is not started or modified by this Players extraction.

## Objective

Extract only the existing Players administration page, `AdminPlayer` presentation model when required for compilation, Players-specific local state, client-side filtering, selected-player cleanup, modal presentation, adjustment command, and cooldown-reset commands from `apps/admin/src/main.tsx` into a focused module under `apps/admin/src/features/players/` without changing behavior.

## Reason

Players is the next feature in the verified administration extraction order. It is self-contained but stateful and mutation-heavy, so it requires focused regression protection before the shell boundary is changed.

## Authorized Files and Directories

- `apps/admin/src/main.tsx`
- New focused files under `apps/admin/src/features/players/`
- One focused Players regression test under `tools/test/` or the smallest directly relevant browser-test location
- `docs/CURRENT_TASK.md`
- `docs/PROJECT_STATUS.md`
- `docs/handoffs/LATEST.md`
- A dated Players handoff record under `docs/handoffs/` when useful

## Explicitly Forbidden Changes

- Do not extract Commands, Integrations, Expedition Creator, Config, Operations, UI Library, or another administration feature.
- Do not change Server, Timers, or Refunds.
- Do not change or decompose the ten-resource refresh.
- Do not move general shell state, authentication, navigation, page composition, remote resource loading, or cross-feature orchestration out of `AdminApp`.
- Do not move player loading into the Players feature.
- Do not change the Players GET request into query-driven or server-side search.
- Do not add debouncing, pagination, sorting controls, fuzzy search, loading indicators, optimistic updates, duplicate-submit prevention, selection synchronization, or new disabled states.
- Do not add browser confirmation to player commands.
- Do not reset adjustment fields, audit reason, selection, or modal state after successful commands.
- Do not change production API routes, request payloads, response shapes, authorization, validation, clamping, persistence, audit, cooldown deletion, database behavior, or browser-client behavior.
- Do not change CSS, shared UI, graphics, visual design, navigation, accessibility behavior, modal behavior, or screenshot expectations.
- Do not change gameplay, credits, XP, reputation, levels, cooldown timing, rewards, content, worker behavior, point balances, deployment architecture, Docker, nginx, Vite, or workflows.
- Do not introduce endpoint-specific runtime schemas, contract consolidation, a feature-wide API client, adapter, repository abstraction, compatibility wrapper, service layer, or duplicate request helper outside the focused feature behavior.
- Do not hide unrelated cleanup inside this task.
- Do not begin Commands extraction, refresh decomposition, contract consolidation, API decomposition, or later Phase 1 work.

## Required Architecture

- Move only Players presentation and feature-local behavior into a focused Players module.
- Keep authentication, authorization presentation, navigation, page composition, the shell-owned `players` state, all remote loading, the full refresh, and cross-feature orchestration in `AdminApp`.
- Continue receiving the existing player records through props.
- Continue receiving the existing full-refresh callback and toast function through props.
- Continue using the real `requestApi` browser client directly.
- Preserve the existing ten-resource `Promise.all` refresh exactly and in the same order.
- Preserve the full refresh after every successful player mutation.
- Preserve exact request methods, routes, payloads, property order, JSON serialization, toast text, toast tone, disabled-state logic, error handling, input conversion, selection cleanup, and local-state behavior.
- Preserve the navigation identifier, order, label, icon, and default administration tab.
- Keep the feature connected to the production API through the existing browser client.

## Verified Pre-Change Browser Contract

### Shell-owned data and loading

`AdminApp` owns:

```text
const [players, setPlayers] = useState<AdminPlayer[]>([])
```

The shell loads the complete current player response as the sixth request in the existing ten-resource refresh:

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

The shell continues calling `setPlayers(playersData)` after the shared `Promise.all`. The feature must not own this request or issue search-specific requests.

### Presentation model

The current browser presentation model is:

```ts
export type AdminPlayer = {
  id: string;
  displayName: string;
  twitchLogin: string;
  credits: number;
  xp: number;
  level: number;
  reputation: number;
  bannedUntil: string | null;
  cooldowns: Array<{
    id: string;
    actionKey: string;
    expiresAt: string;
  }>;
};
```

The production list route currently also returns `userId`; the handwritten browser presentation model does not declare or render that extra response property. Neither boundary may be changed in this task.

### Local state and defaults

The Players page currently owns:

- Search query: `useState("")`
- Selected player: `useState<AdminPlayer | null>(null)`
- Credits adjustment: numeric `useState(0)`, rendered as `0`
- XP adjustment: numeric `useState(0)`, rendered as `0`
- Reputation adjustment: numeric `useState(0)`, rendered as `0`
- Audit reason: `useState("Operator correction")`

### Client-side filtering

Search remains client-side and case-insensitive. It compares the lowercase query against the combined display name and Twitch login without trimming, normalization, tokenization, fuzzy matching, debounce, or a new request:

```ts
players.filter(player =>
  `${player.displayName} ${player.twitchLogin}`
    .toLowerCase()
    .includes(query.toLowerCase())
)
```

An empty query includes every loaded player. A query with no match leaves the existing list container empty. There is no explicit empty-list message.

### Selection and refresh cleanup

Selecting a player stores the complete current player object. The modal opens when `selected` is truthy. The modal close callback sets `selected` to `null`.

After refreshed player props arrive, the current effect clears selection only when the selected identifier no longer exists:

```ts
if (selected && !players.some(player => player.id === selected.id)) {
  setSelected(null)
}
```

The current behavior does not replace the selected object merely because a refreshed object has the same identifier. Therefore, after a successful command and refresh:

- The modal remains open when the identifier still exists.
- Adjustment values remain unchanged.
- Audit reason remains unchanged.
- Selection remains the original object reference.
- Displayed balances and cooldowns are not automatically reconciled from the refreshed collection.
- No local form reset, selection replacement, modal closing, or optimistic update occurs.

This stale-object behavior is a compatibility contract for this extraction.

### Number input conversion

All adjustment inputs use `type="number"` and convert with `Number(event.target.value)`.

Preserved browser conversion consequences include:

- Blank string converts to `0`.
- Negative numeric text remains negative.
- Decimal numeric text becomes a non-integer number and is sent as such.
- Browser-rejected nonnumeric text normally exposes an empty value, which converts to `0`.
- A programmatic nonnumeric string would convert to `NaN`; `JSON.stringify` serializes a `NaN` object property as `null`.
- The browser does not pre-clamp, round, validate integer ranges, or prevent a request.
- Server validation remains authoritative and rejects invalid non-integers, nulls, and out-of-range values.

### Shared command behavior

Player commands currently use no browser confirmation.

The shared command behavior is:

```text
method: POST
body: JSON.stringify(body)
success: success toast with title only and tone success, then await full refresh once
failure: danger toast with title Admin command failed and message errorMessage(error)
failure refresh: none
```

No loading flag, duplicate-submit prevention, optimistic update, form reset, modal close, selected-object replacement, or new disabled state exists.

### Adjustment request

Exact route:

```text
POST /api/v1/admin/players/:id/adjust
```

Exact payload construction and property order:

```ts
JSON.stringify({
  credits,
  xp,
  reputation,
  reason
})
```

Success toast:

```text
title: Player balances updated
tone: success
no message
```

### Individual cooldown reset

Exact route:

```text
POST /api/v1/admin/players/:id/cooldowns/reset
```

Exact payload construction and property order:

```ts
JSON.stringify({
  actionKey: cooldown.actionKey,
  reason
})
```

Success toast:

```text
title: Cooldown reset
tone: success
no message
```

### All cooldowns reset

Exact route:

```text
POST /api/v1/admin/players/:id/cooldowns/reset
```

Exact payload construction and property order:

```ts
JSON.stringify({
  reason
})
```

The body must not contain `actionKey`.

Success toast:

```text
title: All cooldowns reset
tone: success
no message
```

### Failure behavior

Every failed player command emits exactly:

```text
title: Admin command failed
message: errorMessage(error)
tone: danger
```

Failure emits no success toast and performs no refresh.

## Verified Rendering Contract

Preserve all existing copy, values, formatting, status displays, controls, variants, disabled states, and classes:

- Root class: `admin-stack`
- Eyebrow: `PLAYER ADMINISTRATION`
- Title: `Accounts, Balances & Cooldowns`
- Description: `All changes require a reason and are written to the audit log.`
- Icon: `crew`
- Search label: `Find player`
- Search placeholder: `Display name or Twitch login`
- Layout class: `admin-player-layout`
- List class: `admin-player-list`
- Player button base class: `admin-player-button`
- Selected-player class: `is-selected`
- Display name is rendered inside `<strong>`
- Secondary line: `@${player.twitchLogin} · L${player.level}`
- Credits use `player.credits.toLocaleString()`
- Cooldown count text remains `${player.cooldowns.length} cooldowns`, including the current plural-insensitive wording
- Empty loaded or filtered lists render an empty `admin-player-list` inside the existing `Panel`
- Modal title: `Manage ${selected.displayName}`
- Modal description: `Adjust balances and persistent cooldowns with an audited reason.`
- Modal size: `lg`
- Credits status: label `Credits`, icon `credits`, tone `success`, compact
- XP status: label `XP`, icon `data`, tone `info`, compact
- Reputation status: label `Reputation`, icon `museum`, tone `purple`, compact
- Audit label: `Required audit reason`
- Adjustment labels: `Credit adjustment`, `XP adjustment`, `Reputation adjustment`
- Apply button: default variant, full width, `Apply adjustments`, never disabled by current local logic
- Cooldown eyebrow: `ACTION TIMERS`
- Cooldown title: `Active Cooldowns`
- Cooldown icon: `events`
- Cooldown container class: `admin-cooldowns`
- Expiration rendering: `new Date(cooldown.expiresAt).toLocaleString()`
- Individual reset button: size `sm`, variant `ghost`, text `Reset`, no added disabled state
- All-cooldowns button: variant `warning`, full width, text `Reset every player timer`
- All-cooldowns button is disabled only when `!selected.cooldowns.length`
- `bannedUntil` remains in the data model but is not rendered by the current Players page

## Verified Navigation Contract

- Default administration tab remains `operations`.
- Players remains `{ id: "players", label: "Players", icon: "crew" }`.
- Players remains after Timers and before Refunds.
- Navigation remains shell-owned and state-based.

## Verified Visual-Proof Contract

The authenticated fixture explicitly covers all ten refresh endpoints and provides populated Players data using the current shape.

Existing Players captures must remain present:

- `proof/admin/desktop/players.png`, 1920 x 1080
- `proof/admin/tablet/players.png`, 1024 x 768
- `proof/admin/mobile/players.png`, 390 x 844

The fixture, workflow, screenshot names, viewports, routes, CSS, and visual expectations must not change.

## Verified Production API Contract

### Player list route

`GET /api/v1/admin/players` currently:

- Requires administration authorization through `requireAdmin`.
- Accepts optional query `q` with maximum length 100.
- Uses case-insensitive contains matching against `displayName` or `twitchLogin` when `q` is present.
- Does not require the frontend to use `q`.
- Loads users with player records and includes player cooldowns whose `expiresAt` is greater than the current time.
- Filters out users without player records after the query.
- Sorts by display name ascending.
- Returns at most 100 records.
- Returns `id`, `userId`, `displayName`, `twitchLogin`, `credits`, `xp`, `level`, `reputation`, `bannedUntil`, and `cooldowns` through the existing API envelope.

### Adjustment route

`POST /api/v1/admin/players/:id/adjust` currently:

- Requires administration authorization.
- Reads the player identifier from the route.
- Validates credits and XP as integers from `-10,000,000` through `10,000,000`, each defaulting to `0` when omitted.
- Validates reputation as an integer from `-100,000` through `100,000`, defaulting to `0` when omitted.
- Trims reason server-side and requires 3 through 300 characters.
- Loads the current player inside the existing Prisma transaction.
- Adds deltas to current values.
- Clamps credits, XP, and reputation to a minimum of zero.
- Preserves audit action `player.adjust`.
- Preserves target player ID, before values, after values, reason through the spread body, and request identifier.
- Returns the updated player through the existing API envelope.

### Cooldown reset route

`POST /api/v1/admin/players/:id/cooldowns/reset` currently:

- Requires administration authorization.
- Accepts optional nonempty `actionKey`.
- Trims reason server-side and requires 3 through 300 characters.
- Deletes only matching player cooldowns when `actionKey` is present.
- Deletes every cooldown for the player when `actionKey` is absent.
- Preserves successful zero-count deletion behavior.
- Preserves audit action `cooldown.reset`.
- Audits `*` as the action key when resetting every cooldown.
- Preserves deleted count, reason, player target, and request identifier.
- Returns `{ reset: removed.count }` through the existing API envelope.

No production API file is authorized to change.

## Regression Protection Requirements

The focused regression must prove at minimum:

- `AdminApp` imports and composes the focused Players feature.
- The feature does not own authentication, navigation, player loading, the shell refresh, or unrelated requests.
- `AdminApp` continues owning `players` state and the `/api/v1/admin/players` request.
- The ten-resource refresh remains intact and in the same order.
- The authenticated visual-proof fixture explicitly covers every refresh endpoint.
- Desktop, tablet, and mobile Players captures remain declared.
- Players render using the existing data shape.
- Search default remains an empty string.
- Search remains client-side, case-insensitive, and based on the combined display name and Twitch login.
- Selected-player default remains `null`.
- Selection clears when the selected identifier disappears from refreshed props.
- Selection is not replaced merely because a refreshed object has the same identifier.
- Adjustment defaults remain numeric zero and render as `0`.
- Audit-reason default remains `Operator correction`.
- Empty-list behavior remains an empty current list container without new copy.
- Modal opening and existing close callback remain unchanged.
- Exact `Number(event.target.value)` conversion remains present for all three inputs.
- No confirmation is introduced.
- Exact adjustment, individual cooldown, and all-cooldown POST routes and serialized payloads are preserved.
- Success toasts and one full refresh are preserved for all three commands.
- Failure emits only the existing danger toast and no refresh.
- Success introduces no modal close, form reset, selected-object replacement, or other local-state mutation.
- The all-cooldowns disabled rule remains unchanged.
- Production route authorization, validation, clamping, persistence, cooldown deletion, audit, response, and failure semantics remain intact.
- No API, browser-client, CSS, visual-proof fixture, workflow, or unrelated feature behavior changes.

## Validation Commands

Establish and record an executable pre-change baseline before editing application source. At minimum:

```bash
pnpm install --frozen-lockfile
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

Also run:

- The focused Players regression test
- The authenticated Admin and Overlay Visual Proof workflow or exact local capture equivalent
- The existing browser integration suite
- `pnpm verify` when supported
- Existing security, CodeQL, and UI verification gates when available

When validation runs remotely, record workflow run IDs, job IDs, tested commit, exact result, visual artifact ID, digest, and confirmation that desktop, tablet, and mobile Players captures are present.

## Rollback Method

Before merge, reset or delete the task branch. After merge, revert the final Players extraction merge commit. No API, database, content, gameplay, or deployment migration is expected.

## Completion Evidence

Record:

- Starting `main` commit
- Task-definition commit
- Pre-change baseline record commit when separate
- Players feature-module commit
- Players extraction and shell-composition commit
- Focused regression-test commit
- Validated source head
- Final reviewed branch head
- Final implementation merge commit
- Documentation closeout merge commit when required
- Final documented `main` closeout commit
- Exact final diff boundary
- Validation run and artifact evidence

## Expected Stopping Point

Stop after the Players extraction is validated, documented, merged, and final hashes are recorded. Do not begin Commands, Integrations, refresh decomposition, contract consolidation, API decomposition, or another Phase 1 task in this chat.
