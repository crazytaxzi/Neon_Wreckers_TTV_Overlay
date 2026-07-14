# Developer guide

## Requirements

Use Node.js 22.16 or newer and pnpm 10.32 or newer. `pnpm-lock.yaml` is canonical; do not add npm or Yarn lockfiles.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run test
pnpm run build
```

## Development services

Production always uses `compose.yaml`. During source development, applications may run directly against disposable PostgreSQL and Redis instances through a local `.env`.

```bash
pnpm --filter @neon-wreckers/api run dev
pnpm --filter @neon-wreckers/worker run dev
pnpm --filter @neon-wreckers/web run dev
pnpm --filter @neon-wreckers/admin run dev
pnpm --filter @neon-wreckers/overlay run dev
```

Every Vite client uses same-origin `/api` requests. Its checked-in proxy forwards that path to `http://127.0.0.1:8787`; no client-specific API URL variable exists. Local sign-in uses a real Twitch development application and callback.

## Repository boundaries

- `apps/` owns deployable processes and browser composition.
- `packages/game-engine/` owns deterministic mechanics and accepts canonical content as explicit inputs.
- `packages/content/` owns source-controlled JSON loading, validation, and typed exports.
- `packages/integrations/` owns provider HTTP behavior and Redis URL parsing.
- `packages/browser-client/` owns browser API envelopes and error handling.
- `packages/ui/` owns reusable components, icons, themes, tokens, responsive behavior, motion, and accessibility.
- `packages/client-theme/` is a compatibility stylesheet entry and must not become a second theme system.
- `content/` and `assets/manifest.json` are the canonical data and visual-key sources.
- `infrastructure/` owns schema, migrations, and gateway configuration.

Applications may depend on packages. Packages must not import application source. Browser applications must not become authoritative for costs, rewards, probability, cooldowns, inventory mutation, or station mutation.

## UI development

Compose new screens from `@neon-wreckers/ui`. Reusable visual behavior belongs in the shared package and must be demonstrated in `ComponentShowcase`. App-local CSS is limited to layouts and diagrams that are genuinely specific to that surface.

Do not introduce another component framework, direct icon imports, emoji graphics, independent palette literals, or fixed-canvas page structure. Use `ThemeDefinition` and `--nw-*` variables for all visual values. Verify keyboard operation, focus, empty states, reduced motion, high contrast, 1366×768, tablet, and mobile layouts.

See `docs/UI_DESIGN_SYSTEM.md` and `docs/THEME_TOKEN_GUIDE.md`.

## Database changes

1. Edit `infrastructure/database/prisma/schema.prisma`.
2. Create a named SQL migration under `infrastructure/database/prisma/migrations`.
3. Keep schema and migration enums, models, relations, defaults, and indexes aligned.
4. Verify the migration against an empty database and an upgraded database.
5. Keep seed behavior idempotent and safe for existing production data.
6. Run all quality gates.

Never replace migration history with a comment, use `db push` for production, or commit generated client files. State changes that can race must serialize at the database boundary using the existing locking and conditional-transition patterns.

## API changes

Routes are grouped by domain in `apps/api/src/routes`. Shared behavior belongs in services or libraries. A route must not call another route through HTTP; both routes should call the same service.

Successful API responses use `{ data, requestId }`, except health endpoints. Errors use `{ error: { code, message }, requestId }`. Validate environment, path, query, header, and body input before use. Preserve signed OAuth state and session cookies backed by hashed session tokens.

## Game rules and content

Rule changes belong in `packages/game-engine/src/core.mjs` and require deterministic tests. Runtime tuning represented in content must be read from canonical content rather than duplicated in application code.

For content changes, edit `content/base`, update `assets/manifest.json` for each visual key, keep `packages/content/src/index.mjs` aligned, and run:

```bash
pnpm run test:content
```

## Dependency changes

Use exact versions. Add a package only to the workspace that imports it. Use `pnpm add --save-exact` or `pnpm add --save-dev --save-exact`, inspect the lockfile, run the full verification suite and a registry-backed vulnerability audit, then update `docs/DEPENDENCY_AUDIT.md`.

## Quality gates

```bash
pnpm run test:engine
pnpm run test:api
pnpm run test:content
pnpm run test:dependencies
pnpm run test:repository
pnpm run build
bash -n scripts/*.sh
bash scripts/verify.sh
```

Repository tests protect the single deployment pipeline and reject recovery copies, generated output, committed secrets, extra lockfiles, unfinished markers, undocumented variables, route drift, schema/migration drift, dependency ownership errors, and removed mock or token-retention code.
