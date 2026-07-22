# CI and Security Gates

## Workflow inventory

- `CI and security gates` runs on pull requests to `main`, pushes to `main`, and manual dispatch. It uses a GitHub-hosted Ubuntu runner, Node 22.16.0, pnpm 10.32.0, frozen dependency installation, `pnpm verify`, Compose model validation, production image builds, dependency review, and Gitleaks history scanning.
- `CodeQL` runs JavaScript and TypeScript security analysis on pull requests, pushes to `main`, a weekly schedule, and manual dispatch.
- `Trusted self-hosted verification` runs only after trusted pushes to `main` or manual dispatch. Pull-request code never runs on the private self-hosted runner.
- Existing visual-proof workflows remain separate because they produce review artifacts beyond the primary verification gate.

All third-party actions are pinned to full commit SHAs. Workflow permissions are declared explicitly and checkout credentials are not persisted.

## Fork security boundary

Untrusted pull requests run only on GitHub-hosted runners. They receive the read-only pull-request token and no repository secrets. The self-hosted runner is reserved for trusted default-branch code and manual owner-triggered runs.

Dependency review uses only repository metadata. Gitleaks downloads a fixed release archive and verifies it against the checksum published with the same release before installation.

## Recommended branch protection for `main`

Require these status checks:

- `Repository verification`
- `Dependency review`
- `Secret scan`
- `CodeQL JavaScript TypeScript`
- `verify` from `UI Revamp Verify`
- `screenshots` from `UI Visual Proof`
- `screenshots` from `Admin and Overlay Visual Proof`

Recommended repository rules:

- Require one approving review.
- Dismiss stale approvals when new commits are pushed.
- Require conversation resolution.
- Require branches to be up to date before merging.
- Block force pushes and branch deletion.
- Require linear history and use squash merges for focused remediation branches.
- Do not require the trusted self-hosted workflow on pull requests because it intentionally does not execute untrusted PR code.

## Local validation

```sh
corepack enable
corepack prepare pnpm@10.32.0 --activate
pnpm install --frozen-lockfile
pnpm verify
docker compose -f compose.yaml config --quiet
docker compose -f compose.yaml build
```

External OAuth, StreamElements, Twitch, TLS, and production deployment behavior are outside the source-level CI claim unless tested against configured services.
