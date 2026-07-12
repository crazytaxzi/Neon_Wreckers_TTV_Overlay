# Test report

Verification date: 2026-07-12.

## Automated result

`npm test` passed 27 Node subtests with no failures, plus the content and dependency command gates.

- Game engine: 5 deterministic tests covering salvage, construction completion, inventory merging, cooldown enforcement, and expedition timing/resolution.
- API, service, and configuration: 7 tests covering production environment validation, signed cookie handling, point-action compensation boundaries, and runtime balance parity.
- Content: validated 8 items, 5 wrecks, 9 modules, 1 initial station, 3 events, 2 seasons, 2 themes, and 23 asset keys, including cross-file references, wreck ranges, balance constraints, and absence of unused manifest entries.
- Dependency audit: validated 10 workspaces and 44 direct dependency declarations.
- Repository, database, route, content-ownership, operational-script, and deployment safeguards: 15 tests covering the single deployment pipeline, gateway routes and WebSockets, secret/build debris, environment documentation, schema/migration parity, active indexes, route inventory, concurrency safeguards, and absence of synthetic authentication, mock loyalty, and provider-token retention.

The 27 Node subtests are 5 engine tests, 7 TypeScript API/service/configuration tests, and 15 repository/database/route tests. Content and dependency validators run as separate command gates inside the same top-level workflow and report their own totals.

## Build result

`npm run build` completed successfully for:

- `@neon-wreckers/integrations`
- the compiled database seed
- `@neon-wreckers/api`
- `@neon-wreckers/worker`
- `@neon-wreckers/web`
- `@neon-wreckers/admin`
- `@neon-wreckers/overlay`

Build begins with repository cleanup, so success does not depend on committed `dist` directories or TypeScript build-info files.

## Additional checks

- Clean-room `npm ci --no-audit --no-fund` after deleting `node_modules`: passed.
- `bash -n scripts/*.sh`: passed.
- YAML parse of `compose.yaml`: passed with the six expected services.
- `npm audit --omit=dev`: 0 known vulnerabilities at all severities.
- Search for unfinished markers, generated output, recovery copies, extra lockfiles, committed environment files, obsolete schema models, synthetic auth, mock loyalty, and retained provider tokens: passed through repository tests and final source scan.

## Environment limitations

Docker was unavailable in the cleanup environment. Docker Compose configuration, image builds, container startup, health checks, and live gateway routing were therefore not executed locally. `scripts/verify.sh` performs the Compose and image checks when run on a Docker-capable host.

Prisma native schema-engine validation could not download its platform engine because the environment could not resolve `binaries.prisma.sh`. TypeScript builds succeeded, and custom tests verified the committed schema against the SQL migration, including active models, enums, and indexes. A clean Docker build will run `prisma generate` and remains a target-host release gate.

Live Twitch OAuth, StreamElements transactions, public certificate issuance, and OBS browser-source rendering were not executed because they require external credentials, DNS, and services. These limitations are recorded rather than presented as simulated success.
