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

- Status: in progress
- Branch: `audit/06-container-secret-hardening`
- Pull request: pending
- Merge commit: pending
- Completed date: pending
- Verification: pending
- Notes: Auditing Redis credential handling, container privileges, writable paths, capabilities, image pinning, health checks, resource constraints, logging, and backup/migration compatibility.
- Remaining risks: Production secret-file rollout and image-digest updates must preserve existing deployment and recovery procedures.

## Step 07: Add Production-Grade Metrics, Tracing, and Health Signals

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

## Step 08: Decompose and Stabilize the Overlay Application

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

## Step 09: Move Event Severity and Presentation Metadata to the Server

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

## Step 10: Add Browser, Accessibility, and Visual Regression Tests

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

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
