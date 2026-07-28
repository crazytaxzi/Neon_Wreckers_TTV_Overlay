# Phase 1 Administration Baseline and Extraction Map

**Task:** `P1-T01`  
**Recorded:** 2026-07-27  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Inspected branch:** `main`  
**Starting commit:** `7375ad7a0af70d36c72d621237c8292b17b4359e`  
**Scope:** Inspection, baseline recording, and extraction planning only  
**Application source changed:** No

## Purpose

This document records the verified administration-frontend baseline before Phase 1 decomposition begins. It is the boundary contract for the first extraction tasks.

The goal is not to redesign the administration console, change its behavior, introduce a new architecture in one sweep, or begin the future desktop Studio. The goal is to make the current browser administration console separable in small, reversible units while preserving every existing runtime contract.

## P1-T01 Scope Confirmation

`P1-T01` permits:

- Reading the full repository where needed.
- Inspecting the complete `apps/admin` workspace and its direct dependencies.
- Recording responsibilities, dependencies, side effects, tests, risks, and an extraction order.
- Updating Phase 1 control documentation.
- Adding regression tests only when needed to capture current behavior before later extraction.

`P1-T01` forbids:

- Refactoring `apps/admin/src/main.tsx`.
- Changing API routes or request bodies.
- Changing database models, migrations, content, game mechanics, rewards, balance, cooldowns, progression, deployment, or styling.
- Beginning the desktop Studio.
- Removing packages or documentation.
- Deploying the application.

No forbidden implementation work was performed.

## Verified Repository State

The repository is a pnpm monorepo requiring Node.js `>=22.16.0` and pnpm `>=10.32.0`.

The root build compiles shared contracts, integrations, UI, generated database clients, database TypeScript, API, worker, player web app, administration app, and overlay. The root test sequence covers engine, content, dependency, repository, and API tests. Browser tests are a separate Playwright command and are not part of `pnpm test` or `pnpm verify`.

The administration application is a Vite/React application served under `/admin/`. During Vite development, `/api` is proxied to `http://127.0.0.1:8787`.

## Complete `apps/admin` Workspace

The workspace currently contains seven source/configuration files:

| File | Current responsibility |
| --- | --- |
| `apps/admin/package.json` | React/Vite package metadata and build scripts. No package-local test script. |
| `apps/admin/index.html` | Root document, dark color scheme, and `/src/main.tsx` entry. |
| `apps/admin/tsconfig.json` | Composite React TypeScript project. |
| `apps/admin/vite.config.ts` | React plugin, `/admin/` base path, and development API proxy. |
| `apps/admin/src/main.tsx` | Complete application bootstrap, session gate, shell, data orchestration, every administration page, forms, mutations, and local response models. |
| `apps/admin/src/admin.css` | Administration layouts, responsive behavior, form/list helpers, and entry animation. |
| `apps/admin/src/admin-graphics.css` | Administration-specific visual treatment, low-effects behavior, reduced-motion handling, forced-colors behavior, and responsive graphics. |

`apps/admin/src/main.tsx` is 2,251 lines at the inspected commit.

## Direct Dependencies of `main.tsx`

### React

`main.tsx` directly uses:

- `useCallback`
- `useEffect`
- `useState`
- `FormEvent`
- `ReactNode`
- `createRoot`

### Browser client

`main.tsx` imports `requestApi` and `errorMessage` from `@neon-wreckers/browser-client`.

`requestApi`:

- Sends cookies with `credentials: "include"`.
- Adds `content-type: application/json` when a request has a body and no explicit content type.
- Validates the common API success/error envelope.
- Accepts an optional Zod payload schema.

The administration application does not pass payload schemas to `requestApi`. Its response payloads are therefore envelope-validated but cast to handwritten TypeScript types without runtime payload validation.

### Shared UI package

`main.tsx` directly imports:

- `AppShell`
- `Badge`
- `Button`
- `CommandHeader`
- `CommandNavigation`
- `ComponentShowcase`
- `ConfirmWindow`
- `DataGrid`
- `Field`
- `Input`
- `LoadingScreen`
- `Modal`
- `Notification`
- `NWIcon`
- `Panel`
- `ProfileChip`
- `ResponsiveGrid`
- `SectionTitle`
- `Select`
- `StatusDisplay`
- `Textarea`
- `ThemeProvider`
- `ToastProvider`
- `defaultTheme`
- `TabItem`
- `useToast`

Importing the root of `@neon-wreckers/ui` also imports every UI stylesheet layer as a side effect. This broad CSS dependency must remain unchanged during the first feature extractions.

### Administration styles

`main.tsx` imports `./admin.css`, which imports `./admin-graphics.css`.

The first extractions must not rename classes, move these imports, split the style sheets, or alter CSS order.

## Application Bootstrap and Shell Responsibilities

The current file owns all of the following:

1. `createRoot` browser bootstrap.
2. `ThemeProvider` and `ToastProvider`.
3. Session lookup through `GET /api/v1/me`.
4. Anonymous and unauthorized access screens.
5. Role gate allowing `admin` or `streamer`.
6. Active-tab state.
7. The complete administration navigation model.
8. Header, profile chip, sign-out action, and navigation shell.
9. Global data refresh across ten administration domains.
10. The page registry for all administration screens.
11. Shared confirmation state for wreck spawning.
12. Configuration draft publication.
13. Event trigger/reset commands.
14. Twitch EventSub subscription reconciliation.
15. Toast handling for mutations and failures.
16. Browser redirects and browser-native confirmation prompts.

The API repeats the same `admin` or `streamer` role boundary through `requireAdmin`. Authorization therefore remains server-authoritative and must not be moved into feature modules as a substitute for API enforcement.

## Navigation and Feature Inventory

| Navigation ID | Visible label | Current component | Primary responsibility |
| --- | --- | --- | --- |
| `operations` | Operations | `OperationsPage` | Station status, live-event commands, StreamElements health, Twitch subscription reconciliation, and manual wreck spawn. |
| `expeditions` | Expedition Creator | `ExpeditionCreatorPage` | Author, revise, schedule, activate, retire, and delete expedition versions. |
| `integrations` | Integrations | `IntegrationsPage` | StreamElements OAuth/token account verification, selection, settings, and removal. |
| `commands` | Commands | `CommandsPage` | Create, edit, enable, and retire allowlisted Twitch chat commands. |
| `server` | Server | `ServerPage` | Read-only process, throughput, database, queue, timer, game-balance, and cloud-cost telemetry. |
| `timers` | Timers | `TimersPage` | List active expedition timers and force resolution. |
| `players` | Players | `PlayersPage` | Search players, adjust balances, and reset cooldowns. |
| `transactions` | Refunds | `TransactionsPage` | List loyalty transactions and issue audited refunds. |
| `config` | Config | `ConfigPage` | Create configuration drafts, activate or roll back versions, and inspect live-ops warnings/evidence. |
| `interface` | UI Library | `ComponentShowcase` | Render the shared UI package's live component matrix. |

Supporting components and helpers in the same file include:

- `AccessDenied`
- `CardCommand`
- `formatBytes`
- `formatDuration`
- `lifecycleTone`

## State Ownership Map

### Application-level state

`AdminApp` owns:

- `tab`
- `me`
- `station`
- `streamElements`
- `commands`
- `config`
- `overview`
- `players`
- `transactions`
- `balanceTelemetry`
- `liveOps`
- `expeditionCreator`
- `confirmSpawn`

This means every successful mutation currently calls the same application-level `refresh`, which issues ten GET requests in parallel even when only one feature changed.

The initial extraction sequence must preserve that behavior. Per-feature fetching, caching, invalidation, and refresh reduction are separate later tasks because changing them during component movement would mix architecture changes with behavior-preserving extraction.

### Feature-local state

| Feature | Local state |
| --- | --- |
| Operations | None. Uses callbacks passed from `AdminApp`. |
| Integrations | None. Uses local async command functions and derived selected-account state. |
| Commands | Selected command ID and editable command draft. |
| Server | None. Purely derived from supplied telemetry. |
| Timers | None. |
| Players | Search query, selected player, credit adjustment, XP adjustment, reputation adjustment, and audit reason. |
| Transactions | Refund reason. |
| Expedition Creator | Modal visibility plus slug, name, description, risk, fuel cost, minimum crew, loot rolls, minimum/maximum duration, loot pool, lifecycle, scheduled time, and expiry time. |
| Config | Editor modal visibility. |
| UI Library | State is owned inside `ComponentShowcase` in `@neon-wreckers/ui`. |

### Effects

- `AdminApp` runs the session request and then the global refresh.
- `CommandsPage` keeps the selected draft synchronized with refreshed command data.
- `PlayersPage` clears its selected player when refreshed data no longer contains that player.
- Shared UI code applies the theme through a layout effect.
- Shared modal code owns Escape handling, focus trapping, portal rendering, and focus restoration.
- Shared toast code owns timed dismissal and the live notification region.

## API Dependency Map

### Authentication and shell

| Method | Path | Use |
| --- | --- | --- |
| GET | `/api/v1/me` | Resolve current user and role gate. |
| POST | `/api/v1/auth/logout` | End session, then redirect to `/`. |

### Global read refresh

| Method | Path | Consumer |
| --- | --- | --- |
| GET | `/api/v1/station` | Operations and header status. |
| GET | `/api/v1/integrations/streamelements/health` | Operations and Integrations. |
| GET | `/api/v1/admin/chat-commands` | Commands. |
| GET | `/api/v1/admin/config` | Config. |
| GET | `/api/v1/admin/overview` | Server and Timers. |
| GET | `/api/v1/admin/players` | Players. |
| GET | `/api/v1/admin/transactions` | Refunds. |
| GET | `/api/v1/admin/balance-telemetry` | Server. |
| GET | `/api/v1/admin/live-ops` | Config. |
| GET | `/api/v1/admin/expedition-creator` | Expedition Creator. |

### Operations mutations

| Method | Path | Current request behavior |
| --- | --- | --- |
| POST | `/api/v1/admin/actions/spawn-wreck` | Browser confirmation through shared `ConfirmWindow`; refresh after success. |
| POST | `/api/v1/admin/events/:slug/trigger` | Trigger one allowlisted live event; refresh after success. |
| POST | `/api/v1/admin/events/:slug/reset` | Body includes `stopActive` and an operator reason; refresh after success. |
| POST | `/api/v1/integrations/twitch/subscribe` | Reconcile EventSub subscriptions and show the returned per-subscription result in a toast. |

The visible event slugs are currently:

- `reactor-instability`
- `black-market-visit`
- `ghost-ship`

### StreamElements mutations and navigation

| Method | Path | Current request behavior |
| --- | --- | --- |
| GET navigation | `/api/v1/auth/streamelements/start?returnTo=/admin/` | Full-page browser redirect. |
| POST | `/api/v1/integrations/streamelements/import-legacy` | Verify/import current server token. |
| POST | `/api/v1/integrations/streamelements/connections/:id/select` | Select charged channel. |
| POST | `/api/v1/integrations/streamelements/connections/:id/verify` | Verify account identity. |
| POST | `/api/v1/integrations/streamelements/connections/:id/settings` | Body contains `pointsEnabled`. |
| DELETE | `/api/v1/integrations/streamelements/connections/:id` | Browser-native confirmation, then remove. |

### Chat-command mutations

| Method | Path | Current request behavior |
| --- | --- | --- |
| POST | `/api/v1/admin/chat-commands` | Create command. |
| PUT | `/api/v1/admin/chat-commands/:id` | Replace editable command fields. |
| DELETE | `/api/v1/admin/chat-commands/:id` | Browser-native confirmation, then retire. |

The frontend maps only these server actions:

- `scan`
- `salvage` with `cutters`
- `salvage` with `cargo`
- `point_action` with `rush_scan`
- `point_action` with `safety_override`

The API validates the same discriminated allowlist. Extraction must not generalize this into arbitrary action execution.

### Timer mutation

| Method | Path | Current request behavior |
| --- | --- | --- |
| POST | `/api/v1/expeditions/:id/resolve-now` | Browser-native confirmation, then server resolution and refresh. |

### Player mutations

| Method | Path | Current request behavior |
| --- | --- | --- |
| POST | `/api/v1/admin/players/:id/adjust` | Body contains credits, XP, reputation, and audit reason. |
| POST | `/api/v1/admin/players/:id/cooldowns/reset` | Body contains optional `actionKey` and required reason. |

### Refund mutation

| Method | Path | Current request behavior |
| --- | --- | --- |
| POST | `/api/v1/admin/transactions/:id/refund` | Body contains reason; browser-native confirmation before request. |

### Expedition Creator mutations

| Method | Path | Current request behavior |
| --- | --- | --- |
| POST | `/api/v1/admin/expedition-creator` | Submit validated definition, lifecycle, optional schedule, and optional expiry. |
| POST | `/api/v1/admin/expedition-creator/:id/activate` | Activate version and retire prior active version server-side. |
| POST | `/api/v1/admin/expedition-creator/:id/retire` | Browser-native confirmation, then retire active version. |
| DELETE | `/api/v1/admin/expedition-creator/:id` | Browser-native confirmation, then delete an eligible version. |

### Configuration mutations

| Method | Path | Current request behavior |
| --- | --- | --- |
| POST | `/api/v1/admin/config` | Submit slug, lifecycle, and parsed JSON payload. |
| POST | `/api/v1/admin/config/:id/activate` | Activate selected version. |
| POST | `/api/v1/admin/config/:id/rollback` | Body contains a fixed operator rollback reason. |

## Handwritten Response Models

`main.tsx` currently defines:

- `CurrentUser`
- `StationSummary`
- `StreamElementsConnection`
- `StreamElementsStatus`
- `ChatCommandAction`
- `ChatCommand`
- `ConfigVersion`
- `LiveOpsDashboard`
- `ExpeditionCreatorData`
- `AdminOverview`
- `BalanceTelemetry`
- `MetricWindow`
- `AdminPlayer`
- `LoyaltyTransaction`
- `PushToast`

Initial extraction rule:

> Move a type only when the feature that owns it is extracted. Do not create one new global dumping-ground `types.ts` file.

Cross-feature types should remain at the nearest stable common boundary. Feature-local API models should live with their feature until shared contract schemas are deliberately introduced in a later task.

Runtime Zod validation for administration payloads is desirable, but it is not part of the first component-movement tasks because adding it can create new failure behavior.

## User-Visible and Accessibility Contracts to Preserve

The first extractions must preserve:

- `/admin/` routing and Vite base behavior.
- Anonymous and unauthorized screens.
- `admin` or `streamer` role handling.
- Existing navigation IDs, order, labels, icons, and default `operations` tab.
- All visible headings, button labels, notification copy, field labels, defaults, and confirmation wording.
- All endpoint paths, HTTP methods, request bodies, refresh timing, and toast behavior.
- Browser redirects.
- Browser-native confirmations where currently used.
- Modal Escape handling.
- Modal focus trapping and focus restoration.
- Skip-link behavior and `main` landmark.
- Toast and notification live regions.
- Table semantics.
- Keyboard-reachable navigation.
- Reduced-motion, low-effects, forced-colors, and responsive CSS behavior.
- Current locale-dependent date/number formatting.
- Current USD telemetry display.
- Shared UI stylesheet import order.
- Administration stylesheet import order and class names.

## Existing Test and Proof Coverage

### Root validation

The root scripts provide:

- Repository structure/static assertions.
- Dependency auditing.
- Content validation.
- API tests.
- Engine tests.
- Full TypeScript/Vite build.
- `pnpm verify`, which runs root tests and build.

Browser tests are separate from `pnpm verify`.

### Browser coverage

Current Playwright coverage includes:

- Anonymous player landing.
- Twitch sign-in route behavior.
- Anonymous administration authorization boundary.
- Anonymous administration keyboard reachability.
- Anonymous administration Axe scan.
- Anonymous administration screenshot at desktop size.

It does not authenticate into the administration console or exercise any administration feature.

### Source-text assertions tied to `main.tsx`

Four repository tests read `apps/admin/src/main.tsx` directly:

- `tools/test/expedition-creator.test.mjs`
- `tools/test/live-ops-durability.test.mjs`
- `tools/test/streamelements-control-center.test.mjs`
- `tools/test/twitch-eventsub.test.mjs`

These tests confirm that expected text or patterns exist, but they are coupled to the monolithic file path. Feature extraction can fail them even when runtime behavior is unchanged.

When a covered feature moves, its test must be updated in the same work unit to read the new canonical module or, preferably, be replaced with a behavioral or contract-level assertion that does not depend on one file location.

### API route inventory

`tools/test/api-routes.test.mjs` statically inventories declared API routes and protects against duplicate or missing route declarations. It protects route presence, not frontend request behavior.

### Visual-proof script

`tools/visual-proof/capture-admin-overlay.mjs` contains mocked authenticated administration data and captures:

- Desktop views for Operations, Integrations, Commands, Server, Timers, Players, Refunds, Config, and UI Library.
- Tablet views for selected features.
- Mobile views for selected features.

This is useful proof infrastructure, but it is not part of the automated Playwright test suite and does not fail the root validation gate.

The script currently does not list the Expedition Creator in its capture matrix even though it provides the application's other administration views.

## Missing Regression Protection

Before or during feature extraction, add protection for:

1. Authenticated shell rendering and navigation.
2. Server page read-only telemetry rendering.
3. Operations mutation method/path/body and refresh.
4. Integrations OAuth redirect plus select/verify/settings/remove flows.
5. Chat-command create/edit/retire request bodies and draft synchronization.
6. Timer force-resolution confirmation and request.
7. Player search, modal behavior, adjustment body, and cooldown-reset body.
8. Refund eligibility controls, confirmation, and request body.
9. Config JSON parse failure, create, activate, and rollback requests.
10. Expedition Creator template loading, revision loading, loot selection, schedule requirements, create/activate/retire/delete requests.
11. Modal focus, Escape, and restoration in authenticated administration use.
12. Administration behavior at mobile widths for modal-heavy pages.
13. Successful and failed refresh states.
14. A payload-shape mismatch at the browser boundary, once shared runtime schemas are intentionally introduced.

Do not attempt to add all of this coverage in one extraction commit. Add the smallest relevant behavioral protection with each feature.

## Target Dependency Direction

The target for the first decomposition pass is:

```text
main.tsx
  -> app providers and AdminApp
      -> feature pages
          -> feature-local models and helpers
          -> @neon-wreckers/browser-client
          -> @neon-wreckers/ui
      -> shared administration styles
```

Rules:

1. `main.tsx` becomes bootstrap-only over time.
2. The application shell may import feature pages.
3. Feature pages must not import the application shell.
4. Feature pages must not import one another.
5. Feature-local models and helpers remain inside their feature folder.
6. A shared administration helper is created only after at least two extracted features require the same behavior.
7. API routes, shared UI components, CSS tokens, and CSS import order remain external stable dependencies during the first pass.
8. Global refresh behavior stays in `AdminApp` until page movement is complete or a separately scoped task changes data orchestration.
9. No feature may gain direct database, Redis, queue, filesystem, secret, or deployment access.
10. The API remains authoritative.

## Proposed Administration Module Shape

This is a destination map, not permission to create every directory at once.

```text
apps/admin/src/
  main.tsx
  app/
    AdminApp.tsx
    AdminShell.tsx
    navigation.ts
  features/
    operations/
    expeditions/
    integrations/
    commands/
    server/
    timers/
    players/
    transactions/
    config/
  shared/
    [only helpers proven shared by multiple extracted features]
  admin.css
  admin-graphics.css
```

Each task should create only the directories required by that task.

## Extraction Order

### 1. Server page

Move:

- `ServerPage`
- `AdminOverview`
- `BalanceTelemetry`
- `MetricWindow`
- `formatBytes`
- `formatDuration`

Why first:

- Read-only.
- No feature-local effect.
- No mutation.
- No browser redirect.
- No modal or browser-native confirmation.
- Data remains supplied by `AdminApp`.
- It establishes the feature-module pattern with the smallest behavioral surface.

Required protection:

- Administration package build.
- Authenticated browser smoke for the Server navigation destination and key telemetry.
- Existing anonymous boundary and accessibility tests remain passing.

### 2. Timers page

Move:

- `TimersPage`

Why second:

- One focused mutation.
- One confirmation.
- Uses an already-mapped section of `AdminOverview`.

Required protection:

- Confirm/cancel behavior.
- Exact `POST /api/v1/expeditions/:id/resolve-now`.
- Refresh after success.
- Error toast.

### 3. Transactions page

Move:

- `TransactionsPage`
- `LoyaltyTransaction`

Required protection:

- Refund button eligibility.
- Confirmation.
- Exact refund body and endpoint.
- Success/error toast and refresh.

### 4. Players page

Move:

- `PlayersPage`
- `AdminPlayer`

Required protection:

- Search filtering.
- Selected-player reset after refresh.
- Modal focus/Escape behavior.
- Adjustment and cooldown-reset request bodies.
- Required audit reason behavior.

### 5. Commands page

Move:

- `CommandsPage`
- `ChatCommand`
- `ChatCommandAction`

Required protection:

- New/edit draft state.
- Draft synchronization after refresh.
- Exact allowlisted action mapping.
- Create/update/retire methods and paths.
- Update `tools/test/streamelements-control-center.test.mjs` so it no longer assumes the editor lives in `main.tsx`.

### 6. Integrations page

Move:

- `IntegrationsPage`
- `StreamElementsConnection`
- `StreamElementsStatus`

Required protection:

- OAuth navigation target.
- Import/select/verify/settings/delete methods, paths, and bodies.
- Account mismatch and kill-switch notices.
- Update source-text assertions that currently target `main.tsx`.

### 7. Operations page

Move:

- `OperationsPage`
- `CardCommand`
- `StationSummary`

Required protection:

- Fixed event slugs.
- Trigger/reset request bodies.
- Twitch subscription result toast.
- Spawn confirmation.
- Station and StreamElements status rendering.
- Existing Twitch source-text assertion must follow the new canonical feature file or be made behavior-based.

### 8. Config page

Move:

- `ConfigPage`
- `ConfigVersion`
- `LiveOpsDashboard`
- `lifecycleTone`
- Configuration publication currently owned by `AdminApp`, if and only if the task explicitly moves it with the page.

Required protection:

- JSON parse failure behavior.
- Create, activate, and rollback methods/paths/bodies.
- Live-ops warning and evidence rendering.
- Update `tools/test/live-ops-durability.test.mjs`.

### 9. Expedition Creator

Move:

- `ExpeditionCreatorPage`
- `ExpeditionCreatorData`

Why late:

- Largest feature-local state surface.
- Multiple lifecycle mutations.
- Scheduling and date conversion.
- Dynamic loot selection.
- Built-in template and revision loading.
- Delete/retire confirmations.
- Existing source-text tests are directly coupled to `main.tsx`.

Required protection:

- Blank defaults.
- Template copy behavior.
- Revision copy behavior.
- Loot cap and selection.
- Schedule requirements.
- Exact create payload.
- Activate, retire, and delete behavior.
- Update `tools/test/expedition-creator.test.mjs`.

### 10. UI Library wrapper

Move only an administration wrapper if one becomes useful. `ComponentShowcase` itself remains owned by `@neon-wreckers/ui`.

### 11. Shell, bootstrap, and data orchestration

Only after feature pages are separated should a later task consider moving:

- Providers and `Root`.
- Access screens.
- Navigation model.
- Header and shell.
- Session lookup.
- Global refresh.
- Cross-feature mutation callbacks.

Do not combine shell extraction with a feature extraction.

## First Implementation Work Unit

The next task is `P1-T02`.

Its exact objective is:

> Extract the read-only Server administration page, its server-owned response models, and its pure formatting helpers into a feature module while preserving authentication, navigation, global refresh behavior, API paths, data flow, styling, visible copy, and runtime behavior.

Planned files are constrained in `docs/CURRENT_TASK.md`.

## Baseline Validation Record

### Repository and source inspection

Completed:

- Verified current `main` remained at `7375ad7a0af70d36c72d621237c8292b17b4359e` before the documentation branch was created.
- Read the complete `START_HERE.md` startup chain.
- Read every file in `apps/admin`.
- Read the direct browser-client implementation.
- Read the shared UI exports and the relevant provider, shell, navigation, modal, toast, table, form, accessibility, and showcase implementations.
- Read the administration API route implementations, chat-command routes, integration routes, and authorization service used by the frontend endpoints.
- Read directly related browser tests, repository tests, route inventory, and visual-proof script.
- Confirmed the inspected `main` commit has no attached status checks and no pull-request workflow runs.

### Commands actually attempted

```text
git clone --branch main https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay.git
Result: NOT RUN TO COMPLETION.
Failure: DNS resolution failed for github.com.

node --version
Result: v22.16.0.

pnpm --version
Result: command not found.

corepack pnpm --version
Result: FAILED.
Failure: DNS resolution failed for registry.npmjs.org (EAI_AGAIN).
```

### Preferred baseline commands not run

The following were not run:

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

Reason:

- No local repository checkout was available.
- DNS prevented cloning from GitHub.
- pnpm was not installed.
- Corepack could not download pnpm because npm registry DNS resolution failed.
- No CI or workflow result was attached to the inspected commit.

Status:

> No application test or build is claimed to pass from this P1-T01 session.

The next implementation environment must run the relevant baseline before changing source. A validation failure must be treated as pre-existing until shown otherwise, then recorded before the extraction proceeds.

## P1-T01 Completion Statement

This task produced the required baseline and extraction map without modifying application source, API behavior, data, styling, content, deployment, or gameplay.

The actual refactor must begin in a new chat under `P1-T02`.
