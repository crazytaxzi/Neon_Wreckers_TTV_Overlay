# Verification boundaries

Verification claims are divided into three evidence classes.

## Source-level verification

Source-level evidence is produced against an exact commit SHA. It can include frozen dependency installation, linting, type checking, unit and integration tests, browser tests with deterministic fixtures, content validation, Compose parsing, image builds, and static security scanning. It proves only the commands and assertions recorded by the run.

## Deployment verification

Deployment evidence is produced on a named target environment and records the deployed commit, Compose configuration, migration result, service health, dependency readiness, gateway routing, TLS behavior, backup and restore checks, and rollback readiness. A successful source build is not proof that a deployment succeeded.

## External-integration verification

Twitch OAuth, StreamElements operations, public DNS, public certificate issuance, OBS Browser Source rendering, and production WebSocket delivery require real configured services. Simulated or intercepted browser traffic must not be described as successful external integration verification.

## Evidence freshness

Every evidence record must contain a date, exact commit SHA, environment identifier, commands, results, failures or waivers, and artifact locations. Old reports remain historical records and do not automatically apply to later commits.
