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

- Status: in progress
- Branch: `audit/02-persist-cooldowns`
- Pull request: pending
- Merge commit:
- Completed date:
- Verification: Pending GitHub Actions execution of the repository test suite, builds, and `pnpm verify`.
- Notes: Removed the process-local cooldown map from API construction and context. Correctness-sensitive actions use the existing `ActionCooldown` model and player/action PostgreSQL advisory transaction lock. Added retry metadata and focused first/repeat/restart/concurrency/expiry/player-isolation tests.
- Remaining risks: CI must confirm TypeScript and test compatibility. The existing combined mechanics migration already introduced `ActionCooldown`; no new schema migration is required for this cleanup.

## Step 03: Create Shared Runtime API and Realtime Contracts

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

## Step 04: Make Overlay Networking Realtime-First with Fallback Polling

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

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
