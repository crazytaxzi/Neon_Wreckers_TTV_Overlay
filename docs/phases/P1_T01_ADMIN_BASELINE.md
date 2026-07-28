# P1-T01 Administration Frontend Baseline and Extraction Map

**Task:** `P1-T01`  
**Phase:** Phase 1 - Structural Cleanup and Stabilization  
**Status:** Complete  
**Baseline date:** 2026-07-27  
**Inspected branch:** `main`  
**Starting commit:** `7375ad7a0af70d36c72d621237c8292b17b4359e`  
**Administration entrypoint blob:** `91b5fe0b0d61b56d2aec28bf70353f0eeb13469d`

## 1. Objective and Boundary Confirmation

This work unit established the Phase 1 baseline and mapped the administration frontend without changing application source, runtime behavior, styling, APIs, database state, content, deployment, or game mechanics.

The following remained explicitly outside this task:

- Refactoring `apps/admin/src/main.tsx`
- Changing route paths, methods, payloads, authorization, or audit behavior
- Changing database models or migrations
- Changing gameplay, rewards, balance, content, styling, or accessibility behavior
- Building the desktop Studio
- Removing packages, compatibility layers, assets, or documentation
- Deploying any change

The expected stopping point is this committed baseline and extraction map. The first extraction belongs to `P1-T02` and must begin in a new chat.

## 2. Repository State Reconstructed

The mandatory startup sequence in `START_HERE.md` was completed in order. The controlling files agree that:

- The current phase is Phase 1, Structural Cleanup and Stabilization.
- Phase 1 implementation had not started before this baseline task.
- The active task was `P1-T01`.
- The repository is a pnpm monorepo using Node.js 22.16 or later and pnpm 10.32 or later.
- The administration frontend is a React 19 and Vite application at `/admin/`.
- The API is the authoritative boundary for authentication, permissions, persistent state, rewards, configuration activation, and audited administrative actions.

The inspected `main` head was nine commits ahead of the last application commit `55736da1c803bf90f77274e25753868409d411ff`. That comparison contained project-control documentation, a README notice, and crew portrait assets. It contained no administration frontend source change. The administration baseline therefore corresponds to the current `main` source at the starting commit listed above.

## 3. Administration Workspace Inventory

The complete tracked administration workspace inspected for this task consists of:

- `apps/admin/package.json`
- `apps/admin/index.html`
- `apps/admin/tsconfig.json`
- `apps/admin/vite.config.ts`
- `apps/admin/src/main.tsx`
- `apps/admin/src/admin.css`
- `apps/admin/src/admin-graphics.css`

Important workspace facts:

- `apps/admin/src/main.tsx` is approximately 2,251 lines and contains the application bootstrap, shell, authentication gate, remote-data orchestration, local response models, every page component, every administrative mutation, and utility functions.
- `apps/admin/src/admin.css` owns administration layout and responsive rules and imports `admin-graphics.css`.
- `apps/admin/src/admin-graphics.css` owns administration-specific visual treatment and includes low-effects, reduced-motion, responsive, and forced-colors behavior.
- `vite.config.ts` serves the application at `/admin/` and proxies `/api` to the local API during development.
- The workspace has no dedicated unit-test script. Its build command is `tsc -b && vite build`.

## 4. Direct Dependency Map

`apps/admin/src/main.tsx` directly depends on:

### React and browser runtime

- `useCallback`, `useEffect`, and `useState`
- `createRoot`
- `FormData`, `JSON.parse`, `Date`, `window.confirm`, and `window.location`

### `@neon-wreckers/browser-client`

- `requestApi`
- `errorMessage`

`requestApi` always includes browser credentials and validates the common API success or error envelope. The administration frontend does not currently pass endpoint-specific Zod schemas into `requestApi`, so its handwritten TypeScript response types do not provide runtime payload validation.

### `@neon-wreckers/ui`

The entrypoint imports application-shell, navigation, form, modal, data-grid, notification, status, theme, toast, profile, icon, and showcase components. Importing the package root also loads the complete shared UI stylesheet stack through side-effect imports.

This shared package currently provides critical accessibility behavior, including modal focus management, keyboard navigation, skip navigation, reduced-motion support, low-effects handling, and forced-colors fallbacks. It must remain unchanged during the first administration extraction.

### Local presentation

- `./admin.css`
- `./admin-graphics.css`, transitively through `admin.css`

## 5. Current Application Composition

### Root providers

`Root` mounts:

1. `ThemeProvider` using `defaultTheme`
2. `ToastProvider`
3. `AdminApp`

### Authentication and authorization gate

`AdminApp` requests `/api/v1/me`, displays a loading screen during verification, presents an access-denied surface when no session is available, and requires either the `admin` or `streamer` role before rendering controls.

The browser gate is a presentation boundary only. Every sensitive endpoint also enforces server-side authorization and must continue to do so.

### Navigation and route composition

The administration console does not use a URL router. It stores one active tab identifier in React state and selects a page from a `Record<string, ReactNode>`.

Current destinations, in order:

1. `operations` - Operations
2. `expeditions` - Expedition Creator
3. `integrations` - Integrations
4. `commands` - Commands
5. `server` - Server
6. `timers` - Timers
7. `players` - Players
8. `transactions` - Refunds
9. `config` - Config
10. `interface` - UI Library

The tab identifiers, order, labels, icons, default destination, and state-based navigation behavior are compatibility contracts for Phase 1.

## 6. Remote State Ownership

`AdminApp` owns all remote response state:

- Current user
- Station summary
- StreamElements status and saved connections
- Chat commands
- Configuration versions
- Server overview
- Balance telemetry
- Live-operations dashboard
- Expedition creator catalog and versions
- Players
- Loyalty transactions

It also owns the spawn-wreck confirmation state.

A single `refresh` callback loads ten resources concurrently with `Promise.all`:

- `GET /api/v1/station`
- `GET /api/v1/integrations/streamelements/health`
- `GET /api/v1/admin/chat-commands`
- `GET /api/v1/admin/config`
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/players`
- `GET /api/v1/admin/transactions`
- `GET /api/v1/admin/balance-telemetry`
- `GET /api/v1/admin/live-ops`
- `GET /api/v1/admin/expedition-creator`

Every successful mutation calls the same full refresh. This coupling must remain intact during the first feature extraction. Splitting refresh ownership is a later, separately tested step because changing it could alter loading, error, or stale-data behavior.

## 7. Handwritten Response Models

`main.tsx` currently defines these browser-side models:

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

Several describe server responses that overlap with shared contracts or server-side schemas. Consolidating those models is Phase 1 workstream 3 and must not be mixed into the first page extraction. During early extraction, types should move only as required to preserve compilation and ownership, without changing their shapes.

## 8. Feature Responsibility and API Map

### Application shell and access control

Responsibilities:

- Provider composition
- Session verification
- Browser-side role gate
- Header, profile, resync, and sign-out controls
- Navigation state
- Page composition
- Spawn-wreck confirmation window

APIs and side effects:

- `GET /api/v1/me`
- `POST /api/v1/auth/logout`
- Redirect to `/`
- Shared ten-resource refresh

### Operations

Responsibilities:

- Station population, power, integrity, and StreamElements summary
- Hard-coded event controls for `reactor-instability`, `black-market-visit`, and `ghost-ship`
- Spawn-wreck command
- Twitch EventSub subscription command
- Event trigger and stop/reset controls

APIs:

- `POST /api/v1/admin/actions/spawn-wreck`
- `POST /api/v1/admin/events/:slug/trigger`
- `POST /api/v1/admin/events/:slug/reset`
- `POST /api/v1/integrations/twitch/subscribe`

### Expedition Creator

Responsibilities:

- Built-in template selection
- Draft creation and revision
- Stable slug, display name, briefing, risk, fuel, crew, loot-roll, duration, and loot-pool editing
- Draft, scheduled, and immediate-active release states
- Activation, retirement, and safe deletion
- Schedule and expiry timestamps
- Local launch preview

Local state:

- Editor-open state plus fourteen content and lifecycle fields

APIs:

- `GET /api/v1/admin/expedition-creator`
- `POST /api/v1/admin/expedition-creator`
- `POST /api/v1/admin/expedition-creator/:id/activate`
- `POST /api/v1/admin/expedition-creator/:id/retire`
- `DELETE /api/v1/admin/expedition-creator/:id`

### Integrations

Responsibilities:

- StreamElements health and active-account status
- OAuth connection redirect
- Legacy token import
- Account selection, verification, point-action toggle, and removal
- Streamer-account mismatch and server kill-switch warnings

APIs and side effects:

- `GET /api/v1/integrations/streamelements/health`
- `POST /api/v1/integrations/streamelements/import-legacy`
- `POST /api/v1/integrations/streamelements/connections/:id/select`
- `POST /api/v1/integrations/streamelements/connections/:id/verify`
- `POST /api/v1/integrations/streamelements/connections/:id/settings`
- `DELETE /api/v1/integrations/streamelements/connections/:id`
- Redirect to `/api/v1/auth/streamelements/start?returnTo=/admin/`
- Browser confirmation before removal

### Commands

Responsibilities:

- Command list and selection
- New-command defaults
- Trigger, description, enabled state, and allowlisted action editing
- Save and retire behavior
- Mapping between select values and the discriminated action union

Local state:

- Selected command identifier
- Editable command draft

APIs:

- `GET /api/v1/admin/chat-commands`
- `POST /api/v1/admin/chat-commands`
- `PUT /api/v1/admin/chat-commands/:id`
- `DELETE /api/v1/admin/chat-commands/:id`

### Server

Responsibilities:

- Request rate, latency, errors, sockets, players, and queue backlog
- Process memory, disk, load average, and uptime
- Database and queue workload table
- Thirty-day gameplay and fleet telemetry
- Google Cloud free-tier guardrail and cost estimates

This page is read-only. It receives data through props and performs no API request or mutation itself.

APIs loaded by the shell:

- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/balance-telemetry`

Private helpers:

- Byte formatting
- Duration formatting

### Timers

Responsibilities:

- Active expedition timer table
- Immediate server-calculated resolution for a selected expedition

API and side effect:

- `POST /api/v1/expeditions/:id/resolve-now`
- Browser confirmation before resolution

### Players

Responsibilities:

- Client-side player search
- Player selection
- Audited credits, XP, and reputation adjustments
- Individual and complete cooldown resets

Local state:

- Search query
- Selected player
- Three adjustment values
- Audit reason

APIs:

- `GET /api/v1/admin/players`
- `POST /api/v1/admin/players/:id/adjust`
- `POST /api/v1/admin/players/:id/cooldowns/reset`

### Refunds

Responsibilities:

- Point-transaction table
- Required operator reason
- Refund eligibility presentation
- StreamElements-first refund command

Local state and side effect:

- Refund reason
- Browser confirmation before refund

APIs:

- `GET /api/v1/admin/transactions`
- `POST /api/v1/admin/transactions/:id/refund`

### Config and Live Operations

Responsibilities:

- Generic versioned configuration draft form
- Client-side JSON parsing
- Configuration activation and rollback
- Economy summary, warnings, and release evidence

Local state:

- Configuration editor-open state

APIs:

- `GET /api/v1/admin/config`
- `POST /api/v1/admin/config`
- `POST /api/v1/admin/config/:id/activate`
- `POST /api/v1/admin/config/:id/rollback`
- `GET /api/v1/admin/live-ops`

### UI Library

Responsibilities:

- Renders the shared `ComponentShowcase` directly from `@neon-wreckers/ui`

No administration-specific API is used by this page.

## 9. API Route Ownership

The frontend currently spans several server route modules:

- `apps/api/src/routes/auth.ts` - current user, logout, and StreamElements OAuth entry
- `apps/api/src/routes/station.ts` - station summary
- `apps/api/src/routes/admin.ts` - overview, telemetry, players, refunds, event controls, configuration, live operations, expedition creator, and spawn action
- `apps/api/src/routes/chat-commands.ts` - chat-command administration
- `apps/api/src/routes/integrations.ts` - StreamElements control and Twitch subscription operations
- `apps/api/src/routes/expeditions.ts` - force-resolve expedition operation

The oversized administration API module is a later Phase 1 workstream. It must not be decomposed during administration frontend extraction.

## 10. Side-Effect Inventory

Behavior-sensitive side effects that extraction must preserve:

- Initial session request followed by the full refresh
- Error toast and access denial when session verification fails
- Toast title, message, tone, and duration behavior
- Full refresh after successful mutations
- Browser confirmations for destructive or immediate actions
- Browser redirects for logout, denied access, and StreamElements OAuth
- Command-draft synchronization after remote refresh
- Player-selection cleanup after remote refresh
- Date conversion to ISO strings for scheduled expedition releases
- Local date and time rendering through `toLocaleString`
- Client-side JSON parsing for generic configuration drafts
- Theme and toast provider order
- React root mounting
- Shared UI and administration CSS side effects

## 11. Existing Regression Protection

### Build and repository gates

- Root `pnpm build` includes the administration production build.
- `pnpm test:repository` runs source-level repository tests.
- `pnpm test:browser` runs Playwright tests.
- The admin and overlay visual-proof workflow builds the real administration surface and captures authenticated fixture screenshots.

### Existing administration-specific coverage

- API route inventory verifies all currently declared admin endpoints remain present and duplicate-free.
- Anonymous admin browser coverage verifies controls are not exposed without a session.
- Anonymous admin accessibility coverage checks keyboard focus, serious Axe violations, and a desktop screenshot.
- UI graphics tests verify administration graphics imports and low-effects and forced-colors fallbacks.
- StreamElements tests assert critical account-routing text and the chat-command allowlist boundary.
- Expedition creator tests assert the editor, scheduling input, loot selection, and launch preview remain present.
- Visual proof captures authenticated desktop views for Operations, Integrations, Commands, Server, Timers, Players, Refunds, Config, and UI Library; selected tablet and mobile views are also captured.

## 12. Missing Regression Protection

The current suite does not directly prove:

- Authenticated tab navigation preserves every destination and default tab.
- The ten-resource refresh calls the same endpoints and handles failure consistently.
- A successful mutation performs the same method, path, body, toast, and refresh.
- A rejected mutation preserves the same error toast and local editor state.
- Browser confirmations prevent requests when cancelled.
- StreamElements OAuth and logout redirects remain unchanged.
- Commands preserve action-value conversion and draft synchronization.
- Players preserve filtering, adjustment payloads, selected-player cleanup, and cooldown reset payloads.
- Refund controls preserve eligibility rules and reason handling.
- Expedition creation preserves all field defaults, date conversion, loot limits, lifecycle payloads, and editor close behavior.
- Configuration publishing preserves JSON parse failures and lifecycle payloads.
- Server diagnostic formatting remains stable for zero, missing disk, and normal values.
- Focus restoration and keyboard behavior are preserved in authenticated feature modals.
- All authenticated feature pages pass Axe checks.

Source-string tests and screenshot generation are useful tripwires, but they do not replace interaction-level regression tests. Each extraction task must add focused protection before or alongside moving the feature.

## 13. Target Module Boundaries

The intended dependency direction is:

```text
main.tsx bootstrap
  -> app/AdminApp shell and access control
    -> features/<feature>/page
      -> feature-local model and API adapter
        -> @neon-wreckers/browser-client
          -> @neon-wreckers/contracts

all presentation modules
  -> @neon-wreckers/ui
  -> unchanged admin CSS classes
```

Rules:

- Feature modules must not import other feature modules.
- The application shell owns authentication, navigation, page composition, and cross-feature orchestration.
- A feature owns its local editor state, feature-specific transformations, and feature-specific API commands.
- Shared models should be introduced only when two or more features genuinely share the same concept.
- Contract consolidation must be gradual and must not be hidden inside a component move.
- Endpoint-specific runtime schemas should be introduced in the dedicated contract workstream or in a separately authorized regression task.
- The first extractions must preserve the existing full-refresh callback.

## 14. Proposed Extraction Order

### 1. Server diagnostics

Move the read-only `ServerPage`, `AdminOverview`, `BalanceTelemetry`, `MetricWindow`, `formatBytes`, and `formatDuration` into a server feature module.

Reason: this page has no local mutation, confirmation, redirect, or editor state. It is the lowest-risk meaningful feature slice and establishes the folder and import pattern.

### 2. Timers

Move the timer table and force-resolve command while continuing to receive `overview`, `refresh`, and `pushToast` through props.

Reason: one narrow mutation and one confirmation make it a controlled second step.

### 3. Refunds

Move transaction presentation, refund-reason state, eligibility rules, confirmation, and refund command.

Reason: one feature-specific resource and one audited mutation.

### 4. Players

Move player filtering, selection, adjustment form, cooldown controls, and local state.

Reason: self-contained but stateful and mutation-heavy, requiring stronger interaction coverage.

### 5. Commands

Move command models, editor state, action conversion, save, and retirement behavior.

Reason: the discriminated action model and refresh synchronization require focused regression tests.

### 6. Integrations

Move StreamElements status, account controls, warnings, OAuth redirect, confirmation, and mutations.

Reason: external identity, point-action safety, redirects, and several endpoints make this higher risk.

### 7. Expedition Creator

Move expedition models, editor state, templates, scheduling, loot selection, lifecycle controls, and mutations.

Reason: it is the largest feature-local state machine and has immutable-snapshot safety implications.

### 8. Config and Live Operations

Move generic configuration publishing, JSON parsing, lifecycle commands, economy warnings, and release evidence.

Reason: the publish handler currently lives in `AdminApp`, so this extraction changes ownership across the shell boundary and needs explicit payload tests.

### 9. Operations

Move station telemetry, event controls, Twitch subscription control, StreamElements summary, and spawn command.

Reason: Operations crosses station, event, Twitch, StreamElements, and salvage responsibilities and currently consumes several shell-owned handlers.

### 10. Shell, models, and data orchestration

After all feature surfaces are isolated, split bootstrap, access control, navigation composition, response models, and remote-data loading. Decompose the full refresh only after request and failure behavior are covered.

Reason: changing orchestration first would make every feature extraction harder to verify and could silently change partial-failure behavior.

## 15. Shared Code That Must Remain Unchanged Initially

The first extraction must not modify:

- `@neon-wreckers/browser-client`
- `@neon-wreckers/contracts`
- `@neon-wreckers/ui`
- `apps/admin/src/admin.css`
- `apps/admin/src/admin-graphics.css`
- API route modules
- Authentication or authorization services
- Database schema or seed behavior
- Endpoint paths, methods, bodies, or response shapes
- Navigation identifiers, order, labels, icons, or default tab
- User-visible labels, messages, confirmation copy, or toast copy
- Theme provider and toast provider order
- Full-refresh semantics

## 16. Required Protection by Extraction

Before each feature move, add or identify coverage for:

- Page renders with representative fixture data.
- Page renders its loading or empty state.
- Each control calls the expected method, path, and body.
- Cancelled confirmations issue no request.
- Successful requests emit the expected toast and call refresh once.
- Failed requests emit the expected error toast and do not falsely report success.
- Keyboard and modal behavior remain accessible.
- Existing visual-proof captures still build and render.

For the Server page specifically, the first work unit should protect:

- Overview loading state
- Request, latency, error, socket, player, and queue values
- Memory, disk, load, and uptime formatting
- Missing disk behavior
- Optional balance-telemetry section
- Free-tier values and cost formatting
- No direct API request from the extracted page

## 17. First Implementation Work Unit

The next active task is `P1-T02`:

> Extract the read-only Server diagnostics feature from `apps/admin/src/main.tsx` into a focused feature module, add regression protection for its rendered telemetry and formatting, and preserve all runtime behavior, styling, navigation, data loading, and API ownership.

Expected source scope:

- `apps/admin/src/main.tsx`
- New files under `apps/admin/src/features/server/`
- The smallest relevant test file or new focused test under `tools/test/` or `tests/browser/`
- Required project-control documents at completion

Explicitly forbidden during `P1-T02`:

- Changing API calls or moving API ownership out of `AdminApp`
- Changing the full refresh
- Changing any other administration feature
- Contract consolidation
- Styling changes
- Route, database, gameplay, content, deployment, or Studio changes

## 18. Baseline Validation Evidence

The following validation commands were requested by `P1-T01` but were not run:

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

Reason: the execution environment could not obtain a local checkout. The exact clone attempt was:

```text
rm -rf /tmp/neon-wreckers-p1t01 && git clone --depth 1 --branch main https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay.git /tmp/neon-wreckers-p1t01
```

Result:

```text
fatal: unable to access 'https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay.git/': Could not resolve host: github.com
```

Repository inspection was completed through the authenticated GitHub connector instead. GitHub reported no workflow runs and no combined commit statuses for the inspected starting commit. Therefore this task establishes a source-inspection baseline, not a fresh passing application baseline.

The first implementation chat must begin from a clone-capable environment and run at minimum:

```text
pnpm install --frozen-lockfile
pnpm test:repository
pnpm --filter @neon-wreckers/admin run build
```

It must also run the focused regression test added for the Server extraction. The complete `pnpm verify` gate remains preferred when the environment supports it.

## 19. Completion Record

**Task:** `P1-T01`  
**Reason:** Lock the current administration behavior and safe extraction order before refactoring.  
**Files changed:** This baseline document and project-control records only.  
**Behavior changed:** None.  
**Behavior preserved:** All application, API, database, styling, accessibility, gameplay, content, and deployment behavior.  
**Tests and checks performed:** Repository source inspection, recent-commit inspection, relevant route and test inspection, and an attempted local clone.  
**Results:** Source baseline and extraction map completed; executable validation blocked by DNS resolution in the execution environment.  
**Known risks:** No fresh local build or test result; authenticated interactions have incomplete regression coverage; the monolithic refresh remains a cross-feature coupling.  
**Rollback method:** Revert the documentation commits created for `P1-T01`.  
**Deferred discoveries:** Contract consolidation, endpoint-specific runtime schemas, refresh decomposition, API route decomposition, CSS ownership cleanup, and Studio work remain later tasks.
