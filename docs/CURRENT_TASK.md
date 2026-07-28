# Neon Wreckers Current Task

**Task ID:** `P1-T04-PLAYERS`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Complete, validated, merged, and stopped  
**Started:** 2026-07-28  
**Completed:** 2026-07-28  
**Starting main commit:** `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`  
**Implementation merge commit:** `d15c50a080e0fd84f9ccd91466e2c6ded22b5961`  
**Phase authority:** `docs/phases/PHASE_01.md`  
**Baseline authority:** `docs/phases/P1_T01_ADMIN_BASELINE.md`

Only one task may be active in this file at a time. This completed task remains here until a future chat follows `START_HERE.md` and replaces it with one newly authorized objective.

The repository owner's explicit identifier `P1-T04-PLAYERS` governed this work unit. The generic `P1-T04` administration API work unit listed in `docs/phases/PHASE_01.md` was not started or modified.

## Completed Objective

Extract only the existing Players administration page, `AdminPlayer` browser presentation model, Players-specific local state, client-side filtering, selected-player cleanup, modal presentation, adjustment command, and cooldown-reset commands from `apps/admin/src/main.tsx` into a focused module under `apps/admin/src/features/players/` without changing behavior.

## Final Architecture

- `apps/admin/src/features/players/players-page.tsx` owns the Players presentation model, local query and form state, client-side filtering, selection cleanup, modal presentation, adjustment command, and cooldown-reset commands.
- `AdminApp` continues owning authentication, authorization presentation, navigation, page composition, shell-owned `players` state, the `/api/v1/admin/players` request, the exact ten-resource `Promise.all` refresh, and cross-feature orchestration.
- The feature continues receiving the existing player records, full-refresh callback, and toast function through props.
- The feature continues using the real `requestApi` browser client directly.
- No duplicate request layer, service abstraction, compatibility wrapper, endpoint-specific runtime schema, or feature-owned loading was introduced.

## Preserved Browser Contract

The extraction preserves:

- The exact `AdminPlayer` shape: `id`, `displayName`, `twitchLogin`, `credits`, `xp`, `level`, `reputation`, `bannedUntil`, and active cooldown records.
- Search default `""` and selected-player default `null`.
- Credits, XP, and reputation adjustment defaults of numeric `0`.
- Audit reason default `Operator correction`.
- Client-side, case-insensitive filtering against the combined display name and Twitch login without trimming, normalization, debounce, tokenization, fuzzy matching, or a search-specific request.
- Shell loading of the complete current player response as request six in the exact ten-resource refresh.
- Selection cleanup only when the selected identifier disappears from refreshed props.
- No automatic selected-object reconciliation when the same identifier remains.
- No modal closing, form reset, reason reset, selection replacement, optimistic update, loading flag, duplicate-submit prevention, or new disabled state after successful commands.
- Exact `Number(event.target.value)` conversion for all three adjustment inputs, including blank-to-zero, negative, decimal, and browser serialization consequences.
- No browser confirmation for adjustment or cooldown-reset commands.

## Preserved Requests and Command Behavior

Adjustment remains:

```text
POST /api/v1/admin/players/:id/adjust
JSON.stringify({ credits, xp, reputation, reason })
```

Individual cooldown reset remains:

```text
POST /api/v1/admin/players/:id/cooldowns/reset
JSON.stringify({ actionKey: cooldown.actionKey, reason })
```

All-cooldowns reset remains:

```text
POST /api/v1/admin/players/:id/cooldowns/reset
JSON.stringify({ reason })
```

For every command:

- Success emits only the existing title with tone `success` and awaits the supplied full refresh exactly once.
- Adjustment success title remains `Player balances updated`.
- Individual cooldown success title remains `Cooldown reset`.
- All-cooldowns success title remains `All cooldowns reset`.
- Failure emits `Admin command failed`, `errorMessage(error)`, and tone `danger`.
- Failure emits no false success and performs no refresh.

## Preserved Rendering and Navigation

All existing Players copy, labels, placeholders, values, number formatting, locale date rendering, icons, tones, button text, variants, disabled-state behavior, CSS classes, modal behavior, empty-list behavior, populated-list rendering, navigation identifier, navigation order, and default administration tab remain unchanged.

The existing authenticated visual-proof fixture still explicitly covers all ten refresh endpoints and still produces:

- `proof/admin/desktop/players.png`, 1920 x 1080
- `proof/admin/tablet/players.png`, 1024 x 768
- `proof/admin/mobile/players.png`, 390 x 844

## Preserved Production API Contract

No production API file changed. Focused regression protection verifies the existing player-list, adjustment, and cooldown-reset authorization, optional query behavior, limits, active-cooldown filtering, sorting, response shape, integer validation, default values, reason trimming and length validation, Prisma transaction, additive deltas, zero clamping, persistence, cooldown deletion, successful zero-count deletion, audit actions and payloads, request identifiers, response envelopes, and failure semantics.

## Commit Evidence

- Starting `main`: `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`
- Task-definition commit: `4a2d5fd4b4f5251c8d07e58e7b27dd4edfe082`
- Pre-change baseline record commit: `b0bd153a204a62a69af0963497f02954f7bf72e6`
- Players feature-module commit: `ffda785a329924bd5fdbb62cf259a116778e79c8`
- Players extraction and shell-composition commit: `7d42af7194aebefa529492348df334d22fc797f8`
- Focused regression-test commit and validated source head: `1bb543286e00ff2e2078d78d73dd29b19090810f`
- Final reviewed branch head: `5c239907feaab199a799896914822893e7f02243`
- Implementation pull request: `#40`
- Implementation squash merge: `d15c50a080e0fd84f9ccd91466e2c6ded22b5961`

The permanent detailed record is `docs/handoffs/2026-07-28-p1-t04-players.md`.

## Validation Evidence

### Executable pre-change baseline

Application source remained identical to starting `main` at task-definition commit `4a2d5fd4b4f4b5251c8d07e58e7b27dd4edfe082`.

- CI run `30388992236`, Verify job `90375401810`: frozen install and complete repository verification, success
- CI and security gates run `30388992031`: success
- CodeQL run `30388992173`, JavaScript/TypeScript job `90375401775`: success

### Validated source head

Commit `1bb543286e00ff2e2078d78d73dd29b19090810f` passed CI, UI verification, focused and complete repository tests, administration and overlay builds, browser integration, authenticated visual proof, CodeQL, dependency review, secret scan, Compose validation, and production image builds.

Visual artifact `8700533312`, digest `sha256:a2a2114c0177883e909f6eaba46fb07e6ebcd2619e484472bf3f56d84c2f0899`, contains all three existing Players captures. They were downloaded and inspected directly.

### Final reviewed branch head

Commit `5c239907feaab199a799896914822893e7f02243` passed:

- CI run `30390272548`, Verify job `90379790363`
- UI Revamp Verify run `30390272544`, verify job `90379789770`
- Browser integration run `30390272656`, Playwright job `90379790476`
- Admin and Overlay Visual Proof run `30390272739`, screenshots job `90379790635`
- CodeQL run `30390272576`, JavaScript/TypeScript job `90379790415`
- CI and security gates run `30390272549`
  - Repository verification and production-image job `90379790188`
  - Dependency review job `90379790201`
  - Secret scan job `90379790322`

Final visual artifact `8700670078`, digest `sha256:b76ec91ba6ab78e7c6d682e0670c681dc96af1234e19b482cabc0ed014547e25`, was produced from the final reviewed branch head.

The local execution container could not resolve GitHub or the npm registry, so executable validation ran through the repository's authenticated GitHub Actions environment.

## Final Diff Boundary

Implementation pull request `#40` changed exactly:

- `apps/admin/src/features/players/players-page.tsx`
- `apps/admin/src/main.tsx`
- `tools/test/admin-players-feature.test.mjs`
- `docs/CURRENT_TASK.md`
- `docs/handoffs/2026-07-28-p1-t04-players.md`

The application-source patch was reviewed in full. No API, browser-client, CSS, visual-proof fixture, workflow, shared UI, gameplay, content, worker, deployment, Server, Timers, Refunds, or unrelated administration feature changed.

## Rollback Method

Revert implementation merge commit `d15c50a080e0fd84f9ccd91466e2c6ded22b5961`. This restores the inline Players page and removes the focused feature module and regression test without an API, database, gameplay, content, worker, or deployment rollback.

## Stop Boundary

`P1-T04-PLAYERS` is complete, validated, merged, and stopped. No next implementation task is active.

Do not begin Commands, Integrations, refresh decomposition, contract consolidation, administration API decomposition, or another Phase 1 task in this chat. A future chat must start from the latest `main`, follow `START_HERE.md`, choose exactly one objective, and replace this file before implementation.