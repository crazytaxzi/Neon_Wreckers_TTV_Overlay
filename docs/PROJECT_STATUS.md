# Neon Wreckers Project Status

**Status:** Active project ledger  
**Last updated:** 2026-07-28  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Current phase:** Phase 1 - Structural Cleanup and Stabilization  
**Implementation state:** `P1-T04-PLAYERS` complete, validated, documented, and merged; no next task authorized

This file records the verified state of the project. Update it at the end of every completed work unit. Do not use it as a wish list.

## Current Objective

Reduce structural complexity, duplication, stale documentation, and oversized ownership boundaries without changing gameplay, balance, visual design, accessibility behavior, player data, security boundaries, or production behavior.

The controlling objective and non-negotiable rules are defined in `docs/PRIME_DIRECTIVE.md`. The most recently completed work unit remains in `docs/CURRENT_TASK.md` until the next chat replaces it with one active task.

## Current Phase

Phase 1 is **Structural Cleanup and Stabilization** and remains in progress.

Its scope is defined in `docs/phases/PHASE_01.md`. The Phase 1 administration baseline and extraction order are recorded in `docs/phases/P1_T01_ADMIN_BASELINE.md`.

## Completed Project-Control Work

- Created `docs/PRIME_DIRECTIVE.md` as the authoritative project objective and rule set.
- Created `docs/CHAT_HANDOFF_PROTOCOL.md` to define chat boundaries and repository-backed handoffs.
- Created root `START_HERE.md` as the mandatory startup entry point.
- Established this project-status ledger, the current-task file, Phase 1 scope, and latest-handoff record.
- Added a root README notice directing development work to `START_HERE.md`.

## Completed Phase 1 Work

### `P1-T01` - Baseline and Administration Extraction Map

Completed on 2026-07-27.

- Inspected `main` at `7375ad7a0af70d36c72d621237c8292b17b4359e`.
- Completed the mandatory startup sequence.
- Inspected the complete administration workspace and direct dependencies.
- Mapped the approximately 2,251-line `apps/admin/src/main.tsx` entrypoint.
- Defined dependency direction and an ordered feature extraction plan.
- Selected the read-only Server diagnostics feature as the first implementation slice.
- Made no application source or runtime change.

Baseline record commit:

- `537140208c289b6be92b33849f63d0d5cd0b90ca` - `docs: record admin extraction baseline`

### `P1-T02` - Server Diagnostics Extraction

Completed on 2026-07-28.

- Corrected stale Phase 1 and task statuses before implementation.
- Established an executable pre-change baseline through GitHub Actions against unchanged application source.
- Extracted only the read-only Server diagnostics page, its response models, and formatting helpers into `apps/admin/src/features/server/server-page.tsx`.
- Preserved `AdminApp` ownership of state, both endpoint requests, the ten-resource refresh, navigation, and page composition.
- Added focused source and behavior regression protection in `tools/test/admin-server-feature.test.mjs`.
- Passed the focused test, complete repository tests, `pnpm verify`, browser integration, UI verification, CodeQL, and CI security gates.
- Made no API, database, styling, shared-package, gameplay, content, deployment, or second-feature change.

Final merge commit:

- `4cb1b8049ce6e546121e90beb81e2b16be9fb28e` - `refactor(admin): extract server diagnostics`

The historical handoff is `docs/handoffs/2026-07-28-p1-t02-server-diagnostics.md`.

### `P1-T02-FIX1` - Authenticated Visual-Proof Fixture Repair

Completed on 2026-07-28.

- Reproduced the existing Admin and Overlay Visual Proof failure before editing.
- Confirmed frozen installation, production builds, browser installation, and preview startup succeeded while three administration requests fell through to the inactive preview proxy.
- Added deterministic visual-proof-only responses for `/api/v1/admin/balance-telemetry`, `/api/v1/admin/live-ops`, and `/api/v1/admin/expedition-creator`.
- Preserved the administration console's ten-resource `Promise.all` refresh and all production application behavior.
- Added `tools/test/admin-visual-proof-fixture.test.mjs` to derive the refresh endpoints from administration source and require an explicit fixture response for each endpoint.
- Passed the focused regression, full `pnpm verify`, administration and overlay production builds, and the exact authenticated Admin and Overlay Visual Proof workflow.
- Produced all existing captures without changing screenshot names, viewports, navigation, authentication, overlay modes, styling, accessibility, or runtime behavior.
- Made no workflow, administration application, Server, Timers, API, database, CSS, shared UI, browser-client, gameplay, content, or deployment change.

Final merge commit:

- `e206d43eb97bdf5d5d4cc366ef9faa9ed8fa7c79` - `fix(visual-proof): cover admin refresh fixtures`

### `P1-T03` - Timers Administration Extraction

Completed, validated, documented, and merged on 2026-07-28.

- Completed the mandatory startup sequence from `main` commit `78646d84e8b47b73dd3cf4cf3cce61dfc02e6cbd`.
- Verified `P1-T02-FIX1`, merge `e206d43eb97bdf5d5d4cc366ef9faa9ed8fa7c79`, and the latest documented `main` closeout.
- Recorded the existing Timers rendering, data flow, confirmation, exact bodyless POST, toast, refresh, cancellation, visual-proof, API, authorization, and Server-overview relationship before editing.
- Extracted only the Timers page, Timers-specific presentation, confirmation, and force-resolve command into `apps/admin/src/features/timers/timers-page.tsx`.
- Preserved `AdminApp` ownership of authentication, navigation, page composition, overview loading, the complete ten-resource refresh, and cross-feature orchestration.
- Continued passing `overview?.timers ?? []`, `refresh`, and `pushToast` through props.
- Preserved the exact request method, route, bodyless payload, confirmation copy, success and failure toasts, locale date rendering, full refresh after success, and no side effects after cancellation or failure.
- Added focused regression protection in `tools/test/admin-timers-feature.test.mjs`.
- Passed full `pnpm verify`, administration and overlay builds, browser integration, UI verification, CodeQL, security gates, and the exact authenticated Admin and Overlay Visual Proof workflow.
- Made no Refunds, Players, Commands, Integrations, Expedition Creator, Config, Operations, Server, refresh decomposition, API, database, browser-client, shared UI, gameplay, content, worker, deployment, Docker, nginx, Vite, or workflow change.

Commit evidence:

- Validated source head: `ca1a3f9470d0fcfe35024fdae2bfa1de1e9a97f1`
- Final reviewed branch head: `dad7ed15f7ff309df3860a679c947423eff71bba`
- Final merge commit: `ecdc63024a7d3380988d43b91435f2b614d3efb1` - `refactor(admin): extract timers feature`

The detailed handoff is `docs/handoffs/2026-07-28-p1-t03-timers.md`.

### `P1-T03-REFUNDS` - Refunds Administration Extraction

Completed, validated, documented, and merged on 2026-07-28.

- Completed the mandatory startup sequence from `main` commit `de35951935551a6b1244734ff39003bcf08e2a1c`.
- Verified completed Timers merge `ecdc63024a7d3380988d43b91435f2b614d3efb1` and the latest documented `main` closeout.
- Recorded the existing Refunds presentation, shell transaction loading, reason state, eligibility, confirmation, exact request serialization, toasts, refresh, visual proof, production authorization, validation, StreamElements ordering, persistence, audit, and failure semantics before editing.
- Extracted only the Refunds page, Refunds-specific presentation, refund-reason state, eligibility helper, confirmation flow, and refund command into `apps/admin/src/features/refunds/refunds-page.tsx`.
- Preserved `AdminApp` ownership of authentication, navigation, page composition, transaction loading, the complete ten-resource refresh, and cross-feature orchestration.
- Continued passing shell-owned transactions, `refresh`, and `pushToast` through props.
- Preserved the exact reason default, eligibility rules, confirmation copy, POST route, JSON payload, success and failure toasts, full refresh after success, and no side effects after cancellation or failure.
- Added focused regression protection in `tools/test/admin-refunds-feature.test.mjs`.
- Passed full `pnpm verify`, administration and overlay builds, browser integration, UI verification, CodeQL, security gates, and the authenticated Admin and Overlay Visual Proof workflow.
- Produced the existing visual proof, including the desktop Refunds capture, without changing screenshots, CSS, graphics, navigation, accessibility, or runtime behavior.
- Made no Players, Commands, Integrations, Expedition Creator, Config, Operations, Server, Timers, refresh decomposition, API, database, browser-client, shared UI, gameplay, content, worker, deployment, Docker, nginx, Vite, or repository workflow change.

Commit evidence:

- Task definition: `0008a09ecb667866a01894b6b37e668ecdc93609`
- Refunds feature module: `6f3b49456bc10a01b9ac8e8790c1373f4e1be8d2`
- Refunds extraction and shell composition: `7be6ba27295cc89fa23f34dad8beb468eb5184c0`
- Focused regression and validated source head: `401e26f261de01d76f1447f278250a8f4652f341`
- Final reviewed branch head: `9cee80425b9848efd219f5f2cfeeb6364f684f0e`
- Final merge commit: `d4443d94f6bbfa1594a44956dadca1a52aa8beb2` - `refactor(admin): extract refunds feature`

The detailed handoff is `docs/handoffs/2026-07-28-p1-t03-refunds.md`.

### `P1-T04-PLAYERS` - Players Administration Extraction

Completed, validated, documented, and merged on 2026-07-28.

- Completed the mandatory startup sequence from starting `main` commit `2f7ff674bec41b3f9068aaa98824a9dd5be771a7`.
- Verified completed Refunds task, extraction merge `d4443d94f6bbfa1594a44956dadca1a52aa8beb2`, documentation closeout merge `bcb08eba83d278a19339bf28575fc9fd12039190`, and the latest documented `main` closeout.
- Recorded the exact Players browser shape, shell loading, refresh position, filtering, local defaults, selection cleanup, stale selected-object behavior, number conversion, requests, payload order, JSON serialization, toasts, refresh semantics, rendering, visual proof, and production API behavior before editing.
- Extracted only the Players page, `AdminPlayer` presentation model, Players-specific local state, client-side filtering, selected-player cleanup, modal presentation, adjustment command, and cooldown-reset commands into `apps/admin/src/features/players/players-page.tsx`.
- Preserved `AdminApp` ownership of authentication, authorization presentation, navigation, page composition, shell-owned player state, the `/api/v1/admin/players` request, the exact ten-resource refresh, and cross-feature orchestration.
- Continued passing shell-owned player records, `refresh`, and `pushToast` through props.
- Preserved the exact client-side search, defaults, stale selection behavior, input conversion, command routes, methods, payload property order, JSON serialization, toasts, full refresh after success, failure behavior, modal behavior, rendering, and disabled-state rules.
- Added focused regression protection in `tools/test/admin-players-feature.test.mjs`.
- Passed frozen installation, `pnpm verify`, administration and overlay builds, browser integration, UI verification, CodeQL, security gates, production image builds, and the authenticated Admin and Overlay Visual Proof workflow.
- Produced and directly inspected the existing desktop, tablet, and mobile Players captures without changing screenshot names, viewports, fixture behavior, CSS, graphics, navigation, accessibility, or runtime behavior.
- Made no Commands, Integrations, Expedition Creator, Config, Operations, Server, Timers, Refunds, refresh decomposition, API, database, browser-client, shared UI, gameplay, content, worker, deployment, Docker, nginx, Vite, or repository workflow change.

Commit evidence:

- Task definition: `4a2d5fd4b4f4b5251c8d07e58e7b27dd4edfe082`
- Pre-change baseline record: `b0bd153a204a62a69af0963497f02954f7bf72e6`
- Players feature module: `ffda785a329924bd5fdbb62cf259a116778e79c8`
- Players extraction and shell composition: `7d42af7194aebefa529492348df334d22fc797f8`
- Focused regression and validated source head: `1bb543286e00ff2e2078d78d73dd29b19090810f`
- Final reviewed branch head: `5c239907feaab199a799896914822893e7f02243`
- Final implementation merge: `d15c50a080e0fd84f9ccd91466e2c6ded22b5961` - `refactor(admin): extract players feature`

The detailed handoff is `docs/handoffs/2026-07-28-p1-t04-players.md`.

## Verified Current Architecture

The repository remains a pnpm monorepo containing:

- Player web application
- Browser-based administration console
- OBS browser overlay
- Fastify API
- BullMQ worker
- Shared packages for UI, contracts, browser access, integrations, content, and game rules
- PostgreSQL persistence
- Redis-backed queues
- Docker Compose production deployment

The API remains the authoritative runtime boundary for identity, inventory, rewards, progression, administration, and persistent game state.

## Verified Administration Frontend State

The administration console currently:

- Uses React 19 and Vite at `/admin/`.
- Uses state-based tab composition rather than URL routing.
- Loads ten remote resources through one `Promise.all` refresh owned by `AdminApp`.
- Refreshes every resource after successful mutations.
- Defines local response models instead of passing endpoint-specific runtime schemas to `requestApi`.
- Keeps Operations, Expedition Creator, Integrations, Commands, Config, and UI Library in the oversized entrypoint.
- Loads Server diagnostics from `apps/admin/src/features/server/server-page.tsx`.
- Loads Timers administration from `apps/admin/src/features/timers/timers-page.tsx`.
- Passes shell-owned overview timer records, full refresh, and toast delivery into the Timers feature.
- Loads Players administration from `apps/admin/src/features/players/players-page.tsx`.
- Passes shell-owned player records, full refresh, and toast delivery into the Players feature.
- Loads Refunds administration from `apps/admin/src/features/refunds/refunds-page.tsx`.
- Passes shell-owned loyalty transactions, full refresh, and toast delivery into the Refunds feature.
- Depends on shared UI components and the complete shared UI stylesheet stack.
- Preserves reduced-motion, low-effects, keyboard, responsive, and forced-colors behavior.

## Verified Structural Problems

- Most remaining administration frontend responsibilities remain concentrated in `apps/admin/src/main.tsx`.
- The administration API combines unrelated responsibilities in a large route module.
- Several browser-facing data types duplicate shared or server schemas.
- The administration frontend does not pass endpoint-specific runtime schemas into `requestApi`.
- Shared UI styling is imported too broadly across application surfaces.
- Asset loading is split between incompatible approaches.
- Crew portraits are stored inside the player application instead of a shared asset system.
- Most source-controlled game content is loaded at process startup and is not truly live-editable.
- Generic content-version activation exists, but most runtime systems still use statically imported content.
- Runtime event action execution is duplicated between the API and worker.
- Some documentation is duplicated or stale.
- The `client-theme` package remains a deletion candidate pending verification.

## Existing Test Position

Protection now includes:

- Repository route inventory
- Administration production build in the root build pipeline
- Anonymous administration authentication-boundary coverage
- Anonymous administration accessibility and screenshot coverage
- Shared UI and administration graphics assertions
- StreamElements safety-boundary assertions
- Expedition Creator source assertions
- Focused Server extraction, telemetry, optional-panel, no-direct-API, and formatting assertions
- Focused Timers composition, ownership, data shape, rendering, confirmation, request, cancellation, toast, refresh, visual-proof, and authorization assertions
- Focused Players composition, ownership, data shape, local defaults, client filtering, selection cleanup, stale selected-object behavior, exact input conversion, exact request serialization, success and failure behavior, rendering, visual-proof, browser-client, authorization, validation, clamping, persistence, cooldown deletion, and audit assertions
- Focused Refunds composition, ownership, transaction shape, rendering, reason, eligibility, confirmation, exact JSON request, cancellation, toast, refresh, visual-proof, browser-client, authorization, StreamElements ordering, persistence, and audit assertions
- Browser integration tests
- Authenticated administration and overlay visual-proof capture using production-built surfaces
- Focused protection requiring every endpoint in the administration ten-resource refresh to have an explicit authenticated visual-proof fixture response

Missing protection still includes authenticated interaction tests for the remaining administration mutations, full-refresh failure behavior, redirect behavior, and several unrelated feature-local state transitions.

Each future extraction must add focused regression protection before or alongside moving behavior.

## Validation Position

### `P1-T03` Timers

- Executable pre-change baseline: CI run `30371064822`, job `90314741971`, success
- Validated source head `ca1a3f9470d0fcfe35024fdae2bfa1de1e9a97f1`: CI, visual proof, CodeQL, UI verification, browser integration, and security gates succeeded
- Final reviewed branch head `dad7ed15f7ff309df3860a679c947423eff71bba`: CI, visual proof, CodeQL, UI verification, browser integration, and security gates succeeded

### `P1-T03-REFUNDS` executable pre-change baseline

Task-definition commit `0008a09ecb667866a01894b6b37e668ecdc93609` changed documentation only and retained application source from starting `main`.

- CI run `30380261092`, Verify job `90346080291`: frozen install and complete `pnpm verify`, success

### `P1-T03-REFUNDS` validated source head

Commit `401e26f261de01d76f1447f278250a8f4652f341` passed:

- CI run `30382941611`, Verify job `90355022440`: success
- Admin and Overlay Visual Proof run `30382941552`, screenshots job `90355021602`: success
- Browser integration tests run `30382941553`, Playwright job `90355022020`: success
- CI and security gates run `30382941614`: success
- CodeQL run `30382941722`: success
- UI Revamp Verify run `30382941799`: success

Visual artifact `8697799828`, digest `sha256:9bb39a2df4011a43f93d302e379b7265a8721596dbdd1407211ad477b657d283`, includes the existing desktop Refunds capture.

### `P1-T03-REFUNDS` final reviewed branch head

Commit `9cee80425b9848efd219f5f2cfeeb6364f684f0e` passed:

- CI run `30383641923`, Verify job `90357369617`: frozen install and complete `pnpm verify`, success
- Admin and Overlay Visual Proof run `30383641616`, screenshots job `90357369045`: production builds, browser installation, built previews, authenticated capture, and artifact upload, success
- Browser integration tests run `30383642017`, Playwright job `90357369983`: success
- CodeQL run `30383641829`, JavaScript/TypeScript job `90357369367`: success
- UI Revamp Verify run `30383641724`, verify job `90357369170`: success
- CI and security gates run `30383642758`: success
  - Repository verification and production-image job `90357373135`
  - Dependency review job `90357373183`
  - Secret scan job `90357373212`

Visual artifact `8698083588`, digest `sha256:58037a390768861378d63b080062ff48ffda97bf6ffb5633c7545f4da0c8123c`, includes `proof/admin/desktop/transactions.png`.

### `P1-T04-PLAYERS` executable pre-change baseline

Task-definition commit `4a2d5fd4b4f4b5251c8d07e58e7b27dd4edfe082` changed documentation only and retained application source from starting `main`.

- CI run `30388992236`, Verify job `90375401810`: frozen install and complete repository verification, success
- CI and security gates run `30388992031`: success
- CodeQL run `30388992173`, JavaScript/TypeScript job `90375401775`: success

### `P1-T04-PLAYERS` validated source head

Commit `1bb543286e00ff2e2078d78d73dd29b19090810f` passed:

- CI run `30389920172`, Verify job `90378605835`: success
- UI Revamp Verify run `30389921069`, verify job `90378608397`: success
- Browser integration run `30389920043`, Playwright job `90378605713`: success
- Admin and Overlay Visual Proof run `30389920349`, screenshots job `90378605799`: success
- CodeQL run `30389921190`, JavaScript/TypeScript job `90378608922`: success
- CI and security gates run `30389920082`: success
  - Repository verification and production-image job `90378669917`
  - Dependency review job `90378669957`
  - Secret scan job `90378670009`

Visual artifact `8700533312`, digest `sha256:a2a2114c0177883e909f6eaba46fb07e6ebcd2619e484472bf3f56d84c2f0899`, includes the existing desktop, tablet, and mobile Players captures.

### `P1-T04-PLAYERS` final reviewed branch head

Commit `5c239907feaab199a799896914822893e7f02243` passed:

- CI run `30390272548`, Verify job `90379790363`: success
- UI Revamp Verify run `30390272544`, verify job `90379789770`: success
- Browser integration run `30390272656`, Playwright job `90379790476`: success
- Admin and Overlay Visual Proof run `30390272739`, screenshots job `90379790635`: success
- CodeQL run `30390272576`, JavaScript/TypeScript job `90379790415`: success
- CI and security gates run `30390272549`: success
  - Repository verification and production-image job `90379790188`
  - Dependency review job `90379790201`
  - Secret scan job `90379790322`

Final visual artifact `8700670078`, digest `sha256:b76ec91ba6ab78e7c6d682e0670c681dc96af1234e19b482cabc0ed014547e25`, was produced from the final reviewed branch head. The desktop, tablet, and mobile Players captures remain present.

The local container could not resolve GitHub or the npm registry, so the executable baselines and final validations ran through the repository's authenticated GitHub Actions environment.

## Known Risks and Limitations

- Cleanup work can accidentally change behavior if refactoring and feature work are mixed.
- The administration full-refresh callback couples every page to every remote resource.
- Source-string command tests and visual captures do not replace full authenticated end-to-end mutation coverage.
- The fixture-coverage regression intentionally couples visual proof to the current refresh endpoint list so a future refresh change fails loudly until the fixture is reconciled.
- Moving response models and components together can accidentally become premature contract consolidation.
- Seed behavior may overwrite future live-edited content fields unless redesigned later.
- Static content imports prevent ordinary content activation from becoming live without restart.
- Running expeditions and delayed worker jobs must retain stable definitions during future content changes.
- Asset changes can break the game, admin preview, or overlay if logical keys are not validated across every client.
- Repository documentation contains stale counts and duplicated historical material that must be handled carefully rather than deleted blindly.

## Not Yet Implemented

- Further administration frontend feature extractions
- Administration shell and refresh decomposition
- Administration API decomposition
- Shared contract consolidation
- Live database-backed content revisions
- Runtime content cache invalidation
- Unified asset upload and asset registry
- Shared editable card templates
- Separate desktop Neon Wreckers Studio
- Scheduled content-pack activation
- Seasonal, holiday, subscriber, and one-time event packs
- Instant rollback of active runtime content revisions
- Removal of the current browser administration console

## Current Readiness

`P1-T04-PLAYERS` is complete, validated, documented, and merged at `d15c50a080e0fd84f9ccd91466e2c6ded22b5961`.

This is a required new-chat boundary. No next implementation task is active.

The next chat must:

1. Follow `START_HERE.md` from the latest `main` branch.
2. Verify implementation merge `d15c50a080e0fd84f9ccd91466e2c6ded22b5961` and the final documented `main` closeout in `docs/handoffs/LATEST.md`.
3. Choose exactly one next objective within Phase 1.
4. Replace `docs/CURRENT_TASK.md` before implementation.
5. Do not begin Commands, Integrations, refresh decomposition, contract consolidation, API decomposition, or another administration task in this completed Players chat.

## Deferred Work

- Continue administration frontend decomposition one narrow feature at a time
- Desktop Studio user interface design
- New game mechanics
- New ships, crew, events, rewards, or balance changes
- Holiday and seasonal content creation
- New overlay presentation features
- Native mobile applications
- Refresh decomposition beyond a future explicit task
- Endpoint-specific runtime schema adoption beyond the contract-consolidation workstream

## Update Requirements

At the end of each completed work unit, update:

- Last-updated date
- Current phase
- Current implementation state
- Completed work and commit evidence
- Verified risks or blockers
- Next required work
- Deferred ideas discovered during implementation

Claims in this file must be supported by repository state, test output, deployment evidence, or explicit user decisions.