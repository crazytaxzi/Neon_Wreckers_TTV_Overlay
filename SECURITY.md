# Security policy

## Reporting a vulnerability

Do not post credentials, exploit details, private logs, database contents, backups, certificates, or user data in a public issue. Contact the repository owner through a private channel and include the affected commit, component, reproduction steps, impact, and any temporary mitigation.

## Historical credential incident

Source packages imported before Version 2.0 reportedly contained committed environment files with live-looking credentials. Treat every value from those packages as compromised even when it appears inactive. Removing a file from the current tree does not revoke a credential or erase it from history.

## Required rotation checklist

Before any production deployment derived from an earlier package:

- rotate PostgreSQL users and passwords
- rotate Redis credentials
- replace session and cookie signing secrets
- rotate Twitch client secrets and review callback URLs
- rotate StreamElements JWTs or provider credentials
- replace TLS private keys or certificates if they were ever included
- rotate deployment, SSH, registry, webhook, CI, and backup credentials that may have been exposed
- invalidate active sessions and provider tokens where supported
- search Git history, release archives, backups, logs, support bundles, and VM home directories for retained copies
- confirm old credentials fail before declaring rotation complete
- record who rotated each credential, when it was rotated, and the evidence location without recording the secret itself

## Evidence boundaries

Passing repository tests proves only the source-level checks named by that run. It does not prove successful Twitch OAuth completion, StreamElements transactions, public TLS issuance, DNS routing, production container health, OBS Browser Source behavior, or a deployed WebSocket path. Those claims require dated target-environment evidence using `docs/RELEASE_EVIDENCE_TEMPLATE.md`.

## Sensitive artifacts

Backups, `.env` files, database dumps, TLS material, generated credentials, provider tokens, and support bundles must never be committed. Store backups encrypted with restricted access and a documented retention policy.
