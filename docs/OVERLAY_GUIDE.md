# Overlay guide

The production overlay is served at:

```text
https://PUBLIC_HOST/overlay/
```

Add it to OBS as a Browser Source. Use the stream canvas dimensions, normally 2560 by 1440 or 1920 by 1080. Enable browser refresh when the scene becomes active when that matches the stream workflow.

The overlay remains transparent for OBS composition. A normal browser may display the transparent page against its own default background.

## Configuration

The canonical configuration file is `apps/overlay/public/overlay-config.json`. It controls existing panel placement, sizing, timing, colors, scanlines, glass, feed state, and breaking-news behavior. Editing it requires rebuilding the gateway through the supported update process:

```bash
sudo bash scripts/update.sh
```

Ephemeral query-string overrides remain available for scene preview and testing. They do not replace the canonical configuration and are not persisted as another configuration source.

## Data flow

The overlay loads public station and history data from `/api/v1` and subscribes to `/api/v1/ws`. Nginx proxies the WebSocket with HTTP/1.1 upgrade and long read/write timeouts. Reconnect behavior is handled by the overlay client.

## Troubleshooting

- A blank overlay usually indicates a browser-source URL or certificate problem.
- A frozen overlay with a working page usually indicates WebSocket proxy or API reachability trouble.
- A white background in a normal browser does not prove OBS transparency is broken.
- Use `https://PUBLIC_HOST/health`, gateway logs, API logs, and the browser-source developer console to isolate failures.

No alternate overlay Dockerfile, static fallback image, recovery route, or overlay-specific gateway exists in 2.0.
