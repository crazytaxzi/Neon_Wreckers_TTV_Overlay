# Neon Wreckers Latest Handoff

**Handoff date:** 2026-07-27  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Work branch:** `agent/p1-t01-admin-baseline`  
**Base branch and commit:** `main` at `7375ad7a0af70d36c72d621237c8292b17b4359e`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Completed task:** `P1-T01` - Baseline and administration extraction map  
**Next task:** `P1-T02` - Extract the read-only Server administration page  
**Handoff status:** P1-T01 complete; merge the documentation PR before implementation begins

This is the current handoff. Replace its contents at the end of every completed work unit. Historical handoffs may be copied to a dated file before replacement when they retain useful evidence.

## Read First

The next chat must begin with:

1. `START_HERE.md`
2. `docs/PRIME_DIRECTIVE.md`
3. `docs/CHAT_HANDOFF_PROTOCOL.md`
4. `docs/PROJECT_STATUS.md`
5. `docs/CURRENT_TASK.md`
6. `docs/phases/PHASE_01.md`
7. `docs/phases/P1_T01_ADMIN_BASELINE.md`
8. This handoff
9. The latest repository state, recent commits, and current diff

Do not rely on the previous conversation as the source of truth.

## Work Completed

`P1-T01` reconstructed the current administration frontend from repository source and produced a documentation-only baseline.

Completed:

- Verified the latest inspected `main` commit was `7375ad7a0af70d36c72d621237c8292b17b4359e`.
- Read `START_HERE.md` and every required control document in order.
- Read every file in `apps/admin`.
- Read all 2,251 lines of `apps/admin/src/main.tsx`.
- Read the direct browser-client implementation.
- Read the relevant shared UI provider, shell, navigation, modal, toast, table, form, theme, accessibility, and showcase implementations.
- Read administration, chat-command, integration, and authorization API source directly related to the frontend.
- Read directly related Playwright tests, repository tests, API-route inventory, and the authenticated visual-proof script.
- Mapped the complete administration feature inventory.
- Mapped all application-level and feature-local state.
- Mapped every frontend API request, method, body, redirect, confirmation, refresh, and toast dependency.
- Identified the handwritten response types and the absence of administration payload schemas at the browser boundary.
- Identified accessibility, CSS-order, responsive, and shared-UI side-effect contracts that must remain stable.
- Identified existing test coverage and missing authenticated administration regression protection.
- Identified four repository tests coupled directly to `apps/admin/src/main.tsx`.
- Defined the dependency direction, destination module shape, extraction order, rollback rules, and first implementation work unit.
- Replaced `docs/CURRENT_TASK.md` with the narrow `P1-T02` Server-page extraction task.
- Updated `docs/PROJECT_STATUS.md`.

No application source, API, database, dependency, gameplay, styling, content, or deployment file changed.

## Documentation Changes

- `docs/phases/P1_T01_ADMIN_BASELINE.md`
  - Full verified baseline.
  - Feature/state/API/side-effect map.
  - Test inventory and gaps.
  - Dependency rules.
  - Ordered extraction plan.
  - Exact validation limitations.
- `docs/CURRENT_TASK.md`
  - Replaced with `P1-T02`.
- `docs/PROJECT_STATUS.md`
  - Records P1-T01 completion and P1-T02 readiness.
- `docs/handoffs/LATEST.md`
  - Replaced with this handoff.

## Relevant Commits

- `0e33e28eae87d8951553fa20615291bbf8292626` - Record admin baseline and extraction map.
- `207f7ce1aeb88d702019f1fd9dc22706321dfeb7` - Define Server extraction task.
- `746256259ecc289de9cd94620342cec4715de358` - Update Phase 1 project status.

The handoff update is the final documentation commit on the branch.

## Baseline Findings

### Administration concentration

`apps/admin/src/main.tsx` currently owns:

- Browser bootstrap and providers.
- Session lookup and access screens.
- Role gating.
- Navigation and shell.
- Ten-domain global refresh.
- Ten visible administration destinations.
- All feature forms and local state.
- Every mutation callback.
- Redirects, browser confirmations, shared confirmation modal, and toasts.
- Fifteen handwritten response/support types.

### First extraction choice

The Server page is first because it is:

- Read-only.
- Stateless at feature level.
- Free of mutations, redirects, confirmations, modals, and feature effects.
- Already supplied data by `AdminApp`.
- Small enough to establish a feature-module pattern without changing data orchestration.

### Important boundary

`P1-T02` must move only:

- `ServerPage`
- `formatBytes`
- `formatDuration`
- `MetricWindow`
- `AdminOverview`
- `BalanceTelemetry`

It must leave:

- Authentication.
- Navigation.
- Shell.
- Global refresh.
- API calls.
- `overview` and `balanceTelemetry` state.
- CSS imports and class names.
- Visible copy and calculations.

inside their current ownership boundaries.

## Validation Performed

### Repository-backed inspection

Completed successfully through the connected GitHub repository:

- Latest commit and recent history inspection.
- Complete administration workspace inspection.
- Direct dependency inspection.
- Related API/security inspection.
- Related test/proof inspection.
- Documentation diff creation on a branch from the verified main commit.

### Commands actually attempted

```text
git clone --branch main https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay.git
Result: failed before checkout because DNS could not resolve github.com.

node --version
Result: v22.16.0.

pnpm --version
Result: command not found.

corepack pnpm --version
Result: failed because DNS could not resolve registry.npmjs.org (EAI_AGAIN).
```

### Commands not run

```bash
pnpm install --frozen-lockfile
pnpm test:repository
pnpm test:dependencies
pnpm test:content
pnpm test:api
pnpm test:engine
pnpm build
pnpm verify
pnpm test:browser
```

No test or build is claimed to pass.

The inspected main commit had no attached status checks and no pull-request workflow runs.

## Current Task

The next task is `P1-T02` exactly as defined in `docs/CURRENT_TASK.md`.

Primary objective:

> Extract the read-only Server administration page, its server-owned response models, and its pure formatting helpers into a feature module without changing runtime behavior.

The next implementation environment must run the available pre-change validation before moving source.

## Required Next Actions

1. Review and merge the `P1-T01` documentation pull request.
2. Start a new chat.
3. Pull the new latest `main`.
4. Complete the full startup sequence.
5. Confirm `P1-T02` and its allowed files.
6. Run the available pre-change baseline and record any existing failure.
7. Add the narrow authenticated Server-page Playwright fixture and smoke test.
8. Extract only the Server feature files named in `docs/CURRENT_TASK.md`.
9. Preserve all current runtime contracts.
10. Run the required validation.
11. Commit, update control docs, and stop before the next feature.

## Known Risks and Limitations

- No fresh executable baseline was available in the P1-T01 environment.
- Browser tests currently cover only the anonymous administration boundary.
- Four repository tests read the monolithic admin file directly.
- Global refresh still issues ten GET requests after mutations and must not be redesigned during initial feature movement.
- Shared UI root imports broad CSS side effects.
- The authenticated visual-proof script is not part of the automated test gate.
- The documentation branch must be merged before `docs/CURRENT_TASK.md` on `main` becomes authoritative for P1-T02.

## Deferred Ideas

Do not begin during `P1-T02`:

- Other administration feature extractions.
- Admin shell or global-refresh redesign.
- Runtime response-schema introduction.
- Administration API decomposition.
- Desktop Studio.
- Live content revisions.
- Asset upload registry.
- Editable card designers.
- Seasonal or holiday packs.
- New game content, mechanics, or balance.
- Visual redesign.

## New-Chat Prompt

> After the P1-T01 documentation pull request is merged, pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Read `START_HERE.md` and every file it requires, including `docs/phases/P1_T01_ADMIN_BASELINE.md`, before planning or changing anything. Reconstruct the current state from the repository, confirm `P1-T02` and its exact file boundaries, run and record the available pre-change baseline, then extract only the read-only Server administration page, its owned telemetry types, and its pure formatting helpers. Preserve authentication, navigation, global refresh, API behavior, styling, visible copy, and data flow. Add the narrow authenticated Server-page smoke test, validate, commit, update the handoff, and stop before extracting another feature.
