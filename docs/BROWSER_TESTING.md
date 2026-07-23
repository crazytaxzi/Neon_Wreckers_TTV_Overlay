# Browser, Accessibility, and Visual Regression Testing

The browser suite is owned by the repository and uses exact dependencies:

- `@playwright/test` 1.55.0
- `@axe-core/playwright` 4.10.2
- Chromium installed through Playwright

## Authentication boundary

The suite verifies the public and anonymous boundaries only. It does not add a production authentication bypass, forge Twitch sessions, or claim that real Twitch OAuth succeeds. The OAuth test navigates the server-owned Twitch start route and verifies its browser redirect contract without assuming that the anonymous landing page renders a sign-in link. The admin test verifies that anonymous browsers cannot see authenticated controls.

## Covered behavior

- unauthenticated player landing state
- Twitch OAuth-start route contract
- anonymous admin boundary
- public station, wreck, and history snapshot rendering
- validated WebSocket station updates
- disconnect, reconnect, and stale presentation
- reduced-motion media behavior
- keyboard behavior on the public and anonymous surfaces, including focus verification when controls exist
- automated serious/critical accessibility checks
- overlay screenshots at 1280x720, 1920x1080, and 2560x1440
- mobile player and desktop anonymous-admin screenshots

Network data is intercepted at the browser boundary with representative contract-valid payloads. This keeps time, content, and integrations deterministic without replacing production authentication.

## Local execution

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm --filter @neon-wreckers/ui run build
pnpm --filter @neon-wreckers/web run build
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

Start the three Vite previews on ports 4173, 4174, and 4175, then run:

```bash
pnpm test:browser
```

The GitHub workflow performs these steps automatically and uploads the HTML report, traces, screenshots, videos, and preview logs when useful.

## Snapshot updates

Only update snapshots after reviewing the rendered surfaces at every affected viewport:

```bash
pnpm test:browser:update
```

Snapshot changes must be committed with the code change that intentionally alters rendering. Do not update snapshots merely to silence an unexplained difference. Reduced motion, UTC time, a fixed locale, disabled screenshot animations, and deterministic route fixtures keep comparisons stable.

The committed Linux Chromium baselines live under `tests/browser/__snapshots__` and are reviewed repository artifacts, not transient CI output. Overlay screenshots install a fixed browser clock before rendering so the visible UTC dispatch timestamp cannot create pixel drift between otherwise identical runs.

## External verification boundary

Passing this suite proves source-level browser behavior in CI Chromium. It does not prove real Twitch OAuth, StreamElements, OBS Browser Source, TLS termination, or production deployment configuration. Those require separately recorded environment evidence.
