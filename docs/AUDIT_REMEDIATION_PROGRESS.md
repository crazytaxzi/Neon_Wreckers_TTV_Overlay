# Audit Remediation Progress

## Step 01: Enable and Enforce Content Security Policy

- Status: complete
- Branch: `audit/01-enable-content-security-policy`
- Pull request: [#5](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/5)
- Merge commit: `d70bb8c7cb680fd66bb8d4e29f724918c5f5a724`
- Completed date: 2026-07-22
- Verification: GitHub Actions run 29933974722 passed CSP contract tests, repository guardrails, all builds, the complete test suite, and `pnpm verify`.
- Notes: Nginx is the canonical policy layer for browser documents. Fastify Helmet applies a deny-by-default policy to API responses. Player and overlay allow same-origin resources plus explicit realtime schemes; admin framing is denied.
- Remaining risks: Production browser-console verification in the deployed TLS environment is still required. External integrations were not claimed as verified.

## Step 02: Replace In-Memory Cooldowns with Atomic Persistent Enforcement

- Status: complete
- Branch: `audit/02-persist-cooldowns`
- Pull request: implementation landed on `main` before a dedicated PR was opened
- Merge commit: `cb49939cb919f3b149d877116fc0a519360dc0b7`
- Completed date: 2026-07-22
- Verification: Self-hosted verification run 29943419802 passed the frozen-lockfile install, complete test suite, all builds, and `pnpm verify`.
- Notes: Removed the process-local cooldown map from API construction and context. Correctness-sensitive actions use the existing `ActionCooldown` model and player/action PostgreSQL advisory transaction lock. Added retry metadata and focused first/repeat/restart/concurrency/expiry/player-isolation tests.
- Remaining risks: The existing combined mechanics migration already introduced `ActionCooldown`; no new schema migration was required. Production PostgreSQL lock contention should be observed under real traffic.

## Step 03: Create Shared Runtime API and Realtime Contracts

- Status: complete
- Branch: `audit/03-shared-runtime-contracts`
- Pull request: [#9](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/9)
- Merge commit: `ce5c47febb3a045ec0168a727f6c8e592d497be7`
- Completed date: 2026-07-22
- Verification: Self-hosted verification run 29946727855, UI Revamp Verify run 29946726974, Admin and Overlay Visual Proof run 29946725656, and UI Visual Proof run 29946725768 all passed.
- Notes: Added `@neon-wreckers/contracts` with Zod API-envelope, public DTO, and discriminated realtime-event schemas. The shared browser client validates envelopes, core player and overlay calls validate endpoint data, and public outbound/inbound realtime messages are rejected before invalid state reaches clients.
- Remaining risks: Lower-risk catalog, marketplace, crafting, auction, quarters, cooldown, notification, integration-admin, and action-result payloads receive envelope validation but retain existing local domain types. Compatibility rules and the intentional migration boundary are documented in `docs/RUNTIME_CONTRACTS.md`.

## Step 04: Make Overlay Networking Realtime-First with Fallback Polling

- Status: complete
- Branch: `audit/04-adaptive-overlay-realtime`
- Pull request: [#10](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/10)
- Merge commit: `70ee7336d68368c0638ca7787a6c51fbd4aa2fa5`
- Completed date: 2026-07-22
- Verification: Self-hosted verification run 29960310707, UI Revamp Verify run 29960310747, Admin and Overlay Visual Proof run 29960310708, and UI Visual Proof run 29960310717 all passed.
- Notes: Replaced continuous three-request polling every 2.5 seconds with one initial snapshot, WebSocket-first updates, 90-second connected reconciliation, a 5-second disconnect grace period, 10-second fallback polling, immediate reconnect reconciliation, explicit connection states, jittered exponential backoff, timestamp tracking, and deterministic cleanup.
- Remaining risks: Production OBS sessions should be observed for real-world proxy idle timeouts and network flapping after merge.

## Step 05: Add Required CI, Secret Scanning, and Security Gates

- Status: complete
- Branch: `audit/05-ci-security-gates`
- Pull request: [#11](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/11)
- Merge commit: `39a8cdaa6621aeb5ab48f9ee0b89e9ce571a2a6a`
- Completed date: 2026-07-22
- Verification: CI run 29962109230, CI and security gates run 29962109281, and CodeQL run 29962109268 all passed.
- Notes: Pull-request verification now runs on GitHub-hosted runners. Added exact Node and pnpm verification, frozen-lockfile installation, `pnpm verify`, Compose validation and image builds, checksum-verified Gitleaks scanning for newly introduced commits, dependency review integration, pinned CodeQL analysis, least-privilege permissions, concurrency cancellation, and branch-protection guidance.
- Remaining risks: GitHub dependency review requires the repository dependency graph setting to be enabled. Historical secret findings remain an incident-response concern and are intentionally separated from the blocking new-commit scan.

## Step 06: Harden Secrets and Containers

- Status: complete
- Branch: `audit/06-container-secret-hardening`
- Pull request: [#12](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/12)
- Merge commit: `7e05e6ba3c5444951c077efa4f606b3b38d556c5`
- Completed date: 2026-07-22
- Verification: CI run 29966732527, CI and security gates run 29966732496, and CodeQL run 29966732502 all passed, including `pnpm verify`, Compose validation, and production image builds.
- Notes: Redis credentials now enter through a Compose secret and restricted runtime config instead of process arguments. Application and Redis containers run non-root, root filesystems are read-only where compatible, writable paths are explicit, capabilities are minimized, no-new-privileges is enabled, logs and resources are bounded, graceful stop periods are declared, and setup uses pnpm.
- Remaining risks: Operators must provide a non-empty `REDIS_PASSWORD` during deployment. PostgreSQL and gateway retain narrowly documented startup privileges required by their upstream images. Production rollout should verify host resource limits and backup/restore procedures.

## Step 07: Add Production-Grade Metrics, Tracing, and Health Signals

- Status: complete
- Branch: `audit/07-observability`
- Pull request: [#13](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/13)
- Merge commit: `6dab5a04ceef45a766461e9d160540e19d4ad82f`
- Completed date: 2026-07-23
- Verification: CI run 29970498274, CI and security gates run 29970498281, CodeQL run 29970498291, and UI Revamp Verify run 29970498257 all passed.
- Notes: Added Prometheus-compatible HTTP, WebSocket, queue, database, and domain metric foundations with normalized bounded labels; separated liveness from PostgreSQL and Redis readiness; retained the admin snapshot; added structured request correlation; and kept the internal scrape endpoint off the public gateway.
- Remaining risks: Real Twitch and StreamElements latency/error instrumentation still requires configured external services. Production dashboards and thresholds must be tuned against observed traffic baselines.

## Step 08: Decompose and Stabilize the Overlay Application

- Status: complete
- Branch: `audit/08-overlay-decomposition`
- Pull request: [#14](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/14)
- Merge commit: `004e654b0db5ca29ee0a3b4054c172ef72741a8b`
- Completed date: 2026-07-23
- Verification: CI run 29978206073, CI and security gates run 29978206084, CodeQL run 29978206070, UI Revamp Verify run 29978206074, Admin and Overlay Visual Proof run 29978206072, and UI Visual Proof run 29978206075 all passed.
- Notes: Reduced the overlay entry file to a composition root; extracted bounded headline deduplication, classification, reconciliation, queue and visibility hooks, and focused station, wreck, dispatch, viewer-popup, and feed-indicator components. Timer and socket cleanup remain deterministic, shared runtime contracts are preserved, and no deliberate visual change was introduced.
- Remaining risks: Long-running production OBS sessions should still be observed for environment-specific memory behavior and browser-source lifecycle quirks.

## Step 09: Move Event Severity and Presentation Metadata to the Server

- Status: complete
- Branch: `audit/09-server-event-presentation`
- Pull request: [#15](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/15)
- Merge commit: `18c3c7c53f0549c4cb1b92e3e81324c2c12e733d`
- Completed date: 2026-07-23
- Verification: CI run 29983578761, CI and security gates run 29983578781, CodeQL run 29983578765, UI Revamp Verify run 29983578827, and Admin and Overlay Visual Proof run 29983578763 all passed.
- Notes: Added a strict shared presentation contract, deterministic API-owned classification, history and station-alert enrichment, localization-ready fallback text, and overlay precedence for explicit server metadata. Legacy records remain displayable through API-boundary enrichment and a conservative client fallback.
- Remaining risks: Presentation metadata is not persisted on every historical row. The API enrichment layer remains canonical until a future schema migration is justified.

## Step 10: Add Browser, Accessibility, and Visual Regression Tests

- Status: in progress
- Branch: `audit/10-browser-integration-tests`
- Pull request: pending
- Merge commit: pending
- Completed date: pending
- Verification: pending
- Notes: Establishing an exact-version Playwright test workspace, deterministic public/auth-boundary fixtures, accessibility checks, and visual baselines without adding production-auth bypasses.
- Remaining risks: Real Twitch OAuth completion remains outside the deterministic browser-test boundary; only redirect and unauthenticated contracts will be exercised.

## Step 11: Harden Asset Manifest and Responsive Image Validation

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

## Step 12: Resolve Documentation, Licensing, and Release-Evidence Contradictions

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:
