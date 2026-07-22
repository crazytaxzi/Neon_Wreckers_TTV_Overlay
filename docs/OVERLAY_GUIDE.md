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

## Data flow and recovery

The overlay performs one initial public station, wreck, and history snapshot from `/api/v1`, then treats `/api/v1/ws` as the primary update channel. A healthy connection performs one reconciliation snapshot every 90 seconds instead of three requests every 2.5 seconds. That reduces the steady request rate from roughly 1.2 requests per second to about 0.033 requests per second, a reduction of approximately 97.2%.

When the WebSocket disconnects, the overlay waits five seconds before beginning 10-second fallback snapshots. Reconnect attempts use exponential backoff capped at 30 seconds with jitter to avoid synchronized reconnect storms. A successful reconnect triggers an immediate reconciliation so missed events are recovered quickly. Snapshot requests are guarded against overlap and are cancelled during component cleanup.

The feed indicator exposes five states:

- `connecting`: initial socket and snapshot startup
- `live`: WebSocket healthy and events current
- `reconnecting`: socket unavailable but recent snapshot data is still usable
- `stale`: socket open but no event has arrived within the stale threshold
- `offline`: socket unavailable and the latest successful snapshot is too old

The overlay stores the last successful snapshot and realtime-event timestamps on the root element as `data-last-snapshot-at` and `data-last-event-at`. The feed indicator tooltip renders the corresponding ISO timestamps for troubleshooting.

Document visibility does not suspend networking because OBS browser sources may be hidden between scenes while still needing current state when shown again. Every socket, reconnect timer, polling timer, status timer, and in-flight request is cleaned up when the overlay unmounts.

## Preview query parameters

Existing parameters remain available for scene setup, including status and ticker placement, scale, visibility, rotation, scanlines, glass, preview background, feed indicator, and supported semantic color overrides. Query parameters are temporary and are not persisted.

## Troubleshooting

- A blank overlay usually indicates a browser-source URL, build, or certificate problem.
- A `reconnecting` indicator means the last snapshot remains recent while WebSocket recovery is underway.
- A `stale` indicator means the socket is open but events have stopped arriving; inspect proxy and API logs.
- An `offline` indicator means both realtime and snapshot freshness have expired.
- A white background in a normal browser does not prove OBS transparency is broken.
- Check `https://PUBLIC_HOST/health`, gateway logs, API logs, and the Browser Source developer console.

There is no alternate overlay Dockerfile, static fallback image, recovery route, or overlay-specific gateway in Version 2.0.
