# Sprint 1 change summary

## Removed

The cleanup deleted seven dated overlay or gateway backup trees, public-IP recovery installers, server convenience wrappers, duplicate Compose files, six gateway Dockerfile/config variants, committed environment files, pnpm metadata, generated TypeScript build artifacts, unused packages, the unused MinIO service, synthetic authentication, the process-local loyalty provider, dead provider-token storage, abandoned database models, and the unused worker job.

No historical executable artifacts were retained in `/archive` because every removed item was a superseded copy, unsafe secret-bearing file, unused implementation, or recovery mechanism that contradicted the single supported deployment. `CHANGELOG.md` and this report preserve the relevant history without retaining runnable debris.

## Reorganized

Deployable applications remain under `apps/`. Reusable runtime code is under `packages/`. Content, assets, infrastructure, operational scripts, tests, and documentation each have one canonical location. The asset manifest moved from an unused package to `assets/manifest.json`. Shared browser request handling and unchanged shared styling now have explicit package owners.

## Stabilized

The API was split from one large file into domain routes and services. Internal route-to-route HTTP calls were replaced with shared services. Redis parsing and browser API envelopes are shared. Items, wreck ranges, module metadata, the initial station, and balance rules are validated once by `@neon-wreckers/content` and injected into the engine, API, worker, seed, and tests instead of being copied into code.

The original migration comment was replaced with complete PostgreSQL DDL. The schema was reduced to actively owned models, remaining query paths received explicit indexes, and schema/migration parity is tested. Seed behavior is idempotent and exits nonzero on failure.

Content validation now checks uniqueness, cross-file references, visual keys, lifecycle, date windows, and balance sanity. Database-backed loyalty idempotency replaces the process-local ledger. A failed StreamElements debit can no longer enter refund compensation, eliminating an unearned-credit path.

Concurrent state mutations now use advisory transaction locks, conditional inventory updates, and atomic status transitions. Wreck generation and salvage, construction contributions, OAuth onboarding, content versioning, expedition resolution, and reward claims are protected against duplicate execution.

OAuth state and sessions use signed cookies. Request IDs are constrained before entering logs. The worker rejects unknown job types and retries known jobs with bounded exponential backoff.

## Deployment result

There is one root Dockerfile, one root Compose file, one Nginx template, and one install/update/backup/restore/verify sequence. Images are immutable multi-stage builds. Runtime containers do not mount source or install dependencies at startup. Restore validates checksums and archive paths. Certificate renewal stops the gateway only for an actual renewal attempt.

## Compatibility

Player UI, admin UI, overlay appearance, artwork, effective mechanics, costs, cooldowns, rewards, station values, and retained route paths were intentionally preserved. The synthetic development-auth route was removed because it was not a production game surface.
