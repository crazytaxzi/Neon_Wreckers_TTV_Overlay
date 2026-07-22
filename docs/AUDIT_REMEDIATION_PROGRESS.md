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

- Status: in progress
- Branch: `audit/04-adaptive-overlay-realtime`
- Pull request: [#10](https://github.com/crazytaxzi/Neon_Wreckers_TTV_Overlay/pull/10)
- Merge commit: pending
- Completed date: pending
- Verification: Final connector-authored verification trigger submitted after the WebSocket event-handler type alignment; full self-hosted and UI/visual lanes are rerunning.
- Notes: Replaced continuous three-request polling every 2.5 seconds with one initial snapshot, WebSocket-first updates, 90-second connected reconciliation, a 5-second disconnect grace period, 10-second fallback polling, immediate reconnect reconciliation, explicit connection states, jittered exponential backoff, timestamp tracking, and deterministic cleanup.
- Remaining risks: Production OBS sessions should be observed for real-world proxy idle timeouts and network flapping after merge.

## Step 05: Add Required CI, Secret Scanning, and Security Gates

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

## Step 06: Harden Secrets and Containers

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

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
