# Overlay guide

The production OBS surface is served at:

```text
https://PUBLIC_HOST/overlay/
```

Add it as an OBS Browser Source using the stream canvas dimensions, normally 2560×1440 or 1920×1080. The page is transparent for OBS composition. A normal browser may show the transparent canvas against its own default background.

## Theme and configuration

The overlay imports the default palette from `@neon-wreckers/ui`. This keeps nominal, information, viewer, warning, danger, panel, text, and muted colors aligned with the player and admin interfaces.

`apps/overlay/public/overlay-config.json` owns broadcaster behavior and layout:

- panel visibility, position, width, and scale
- ticker rotation and visibility timing
- scanlines and glass treatment
- feed indicator and breaking-news behavior
- preview behavior

Optional `theme` entries in that file and supported query-string color parameters may override the central defaults for a specific broadcast setup. They are operational overrides, not another product theme source.

After changing the checked-in configuration, rebuild through the supported update path:

```bash
sudo bash scripts/update.sh
```

## Data flow

The overlay loads public station, wreck, and history data from `/api/v1` through `@neon-wreckers/browser-client`, then subscribes to `/api/v1/ws`. Its existing reconnect, headline rotation, wake/fade timing, and breaking-news classification remain client-side presentation behavior. Nginx proxies the WebSocket with the required HTTP/1.1 upgrade settings.

## Preview query parameters

Existing parameters remain available for scene setup, including status and ticker placement, scale, visibility, rotation, scanlines, glass, preview background, feed indicator, and supported semantic color overrides. Query parameters are temporary and are not persisted.

## Troubleshooting

- A blank overlay usually indicates a browser-source URL, build, or certificate problem.
- A frozen overlay with a working page usually indicates API or WebSocket reachability trouble.
- A white background in a normal browser does not prove OBS transparency is broken.
- Check `https://PUBLIC_HOST/health`, gateway logs, API logs, and the Browser Source developer console.

There is no alternate overlay Dockerfile, static fallback image, recovery route, or overlay-specific gateway in Version 2.0.
