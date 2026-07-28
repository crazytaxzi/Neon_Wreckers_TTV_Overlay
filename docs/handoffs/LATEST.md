# Neon Wreckers Latest Handoff

**Handoff date:** 2026-07-27  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Branch:** `main`  
**Starting commit:** `7375ad7a0af70d36c72d621237c8292b17b4359e`  
**Ending work-state commit:** `1a773b3abdab570907567ba671a26dd66e3f4611`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Completed task:** `P1-T01` - Baseline and administration extraction map  
**Next task:** `P1-T02` - Extract Server diagnostics feature  
**Handoff status:** Ready for a new development chat

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
9. The latest repository state, recent commits, and the diff relevant to `P1-T02`

Do not rely on the previous conversation as the source of truth.

## Completed Objective

`P1-T01` established a source-verified Phase 1 baseline and the exact administration frontend extraction map without changing runtime behavior.

The complete baseline is recorded in:

- `docs/phases/P1_T01_ADMIN_BASELINE.md`

## Work Completed

- Completed the mandatory `START_HERE.md` startup sequence.
- Inspected `main` at starting commit `7375ad7a0af70d36c72d621237c8292b17b4359e`.
- Compared the current repository with the last application commit and confirmed no intervening administration frontend source change.
- Inspected the complete `apps/admin` workspace.
- Inspected direct dependencies in `@neon-wreckers/browser-client` and `@neon-wreckers/ui`.
- Inspected relevant root scripts, workspace configuration, API route ownership, repository tests, browser tests, visual-proof tooling, and workflow configuration.
- Mapped the approximately 2,251-line `apps/admin/src/main.tsx` entrypoint.
- Recorded all administration pages, navigation, response models, remote state, local state, forms, API paths, methods, mutations, redirects, confirmations, utilities, and side effects.
- Identified existing regression protection and missing authenticated-interaction coverage.
- Defined feature-module dependency direction and an ordered extraction sequence.
- Selected the read-only Server diagnostics page as the first implementation slice.
- Replaced `docs/CURRENT_TASK.md` with the narrow `P1-T02` objective and boundaries.
- Updated `docs/PROJECT_STATUS.md` to record completion and current limitations.
- Made no application source, API, database, styling, accessibility, gameplay, content, or deployment change.

## Commits Created

- `537140208c289b6be92b33849f63d0d5cd0b90ca` - `docs: record admin extraction baseline`
- `3a9651c43766e8ce3143f994018f0f9ad9c3b790` - `docs: define first admin extraction task`
- `1a773b3abdab570907567ba671a26dd66e3f4611` - `docs: close phase one baseline task`

The commit that updates this handoff becomes the repository head after the work-state commit above.

## Behavior Changed

None.

## Behavior Deliberately Preserved

- All game mechanics, rewards, balance, loot, cooldowns, progression, and content
- Player data and database schema
- API paths, methods, payloads, response behavior, permissions, and audit logging
- Administration rendering, navigation, forms, mutations, confirmations, redirects, and toasts
- The ten-resource `Promise.all` refresh and `AdminApp` remote-data ownership
- Shared UI, administration styling, responsive behavior, reduced motion, low effects, keyboard behavior, and forced-colors behavior
- Deployment and infrastructure behavior

## Validation Performed

Repository-backed inspection:

- Verified the current branch and starting commit through the GitHub connector.
- Inspected the current administration source blob and related source, route, test, workflow, and configuration files.
- Verified the repository route inventory includes the frontend's current endpoint set.
- Queried GitHub for workflow runs and combined commit statuses on the starting commit.

Local checkout attempt:

```text
rm -rf /tmp/neon-wreckers-p1t01 && git clone --depth 1 --branch main https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay.git /tmp/neon-wreckers-p1t01
```

Result:

```text
fatal: unable to access 'https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay.git/': Could not resolve host: github.com
```

## Validation Not Performed

The following commands were not run because the execution environment could not obtain a local checkout:

```text
pnpm install --frozen-lockfile
pnpm test:repository
pnpm test:dependencies
pnpm test:content
pnpm test:api
pnpm test:engine
pnpm build
pnpm verify
```

GitHub reported no workflow runs and no combined commit statuses for the inspected starting commit. Do not interpret this documentation work as a fresh passing application baseline.

## Known Risks and Limitations

- `P1-T02` must begin in a clone-capable environment and establish an executable pre-change baseline.
- Authenticated administration interactions do not have complete request, payload, confirmation, toast, refresh, or local-state regression coverage.
- The monolithic refresh couples all administration features and must remain unchanged during the first extraction.
- Handwritten response models overlap server schemas and shared contracts, but contract consolidation is not authorized in `P1-T02`.
- Shared UI imports load a broad stylesheet stack and must remain unchanged during the first extraction.
- The administration API remains oversized and is a later Phase 1 workstream.

## Next Objective

Complete `P1-T02` exactly as defined in `docs/CURRENT_TASK.md`:

> Extract the read-only Server diagnostics feature from `apps/admin/src/main.tsx` into a focused feature module, add regression protection for its rendered telemetry and formatting, and preserve all runtime behavior, styling, navigation, data loading, and API ownership.

## Allowed Scope for Next Objective

- `apps/admin/src/main.tsx`
- New files under `apps/admin/src/features/server/`
- The smallest relevant test file or a new focused test under `tools/test/` or `tests/browser/`
- Required project-control and handoff documents at completion

Use the exact scope in `docs/CURRENT_TASK.md` when a shorter summary here omits detail.

## Forbidden Scope for Next Objective

- No change to API calls, route modules, authorization, payloads, or response shapes
- No change to `AdminApp` remote-data or full-refresh ownership
- No extraction of another page or shell responsibility
- No contract consolidation
- No browser-client, shared-UI, CSS, database, gameplay, content, deployment, or Studio work

## Required Validation for Next Objective

Minimum:

```text
pnpm install --frozen-lockfile
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
```

Also run the focused Server extraction regression test directly if it is not already included by `pnpm test:repository`.

Preferred when available:

```text
pnpm verify
```

Record every command honestly. An unrun command is not a pass.

## Rollback Method

For `P1-T01`, revert the documentation commits listed above.

For `P1-T02`, the implementation must remain one small, single-purpose extraction commit that can be reverted to restore the inline Server page without affecting another feature.

## Deferred Ideas

Do not begin these during `P1-T02`:

- Another administration feature extraction
- Administration API decomposition
- Contract consolidation or endpoint-specific runtime schemas
- Refresh decomposition
- Shared styling ownership cleanup
- Desktop Studio implementation
- Live content revisions
- Asset upload registry
- Shared editable card designer
- Seasonal or holiday packs
- New game content, mechanics, or visual redesign

## New-Chat Check

This is a good new-chat boundary. `P1-T01` is complete, documented, and committed. `P1-T02` has a different primary objective and begins the first source refactor, so continuing in this chat would increase the risk of scope drift or stale assumptions.

## Ready-to-Paste New-Chat Prompt

> Pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Read `START_HERE.md` and every file it requires, including `docs/phases/P1_T01_ADMIN_BASELINE.md`, before planning or changing anything. Reconstruct the current state from the repository, confirm task `P1-T02` and its boundaries, establish the executable pre-change baseline, then extract only the read-only Server diagnostics feature with focused regression protection. Preserve all runtime behavior, styling, navigation, data loading, and API ownership. Stop after the Server extraction is validated and committed; do not begin another feature extraction in the same chat.
