# Audit Remediation Progress

## Step 01: Enable and Enforce Content Security Policy

- Status: in progress
- Branch: `audit/01-enable-content-security-policy`
- Pull request: pending
- Merge commit:
- Completed date:
- Verification: CSP contract tests added; full `pnpm verify` pending GitHub Actions.
- Notes: Nginx is the canonical policy layer for browser documents. Fastify Helmet applies a deny-by-default policy to API responses. Player and overlay allow same-origin resources plus explicit realtime schemes; admin framing is denied.
- Remaining risks: Production browser-console verification in the deployed TLS environment is still required. External integrations were not claimed as verified.

## Step 02: Replace In-Memory Cooldowns with Atomic Persistent Enforcement

- Status: not started
- Branch:
- Pull request:
- Merge commit:
- Completed date:
- Verification:
- Notes:
- Remaining risks:

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
