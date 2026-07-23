# Overlay decomposition

The OBS overlay is being split without changing its supported transparent rendering, reduced-motion behavior, or network recovery semantics.

## Target organization

- `main.tsx`: composition root and top-level state wiring only
- `network.ts`: adaptive snapshot and WebSocket lifecycle
- `bounded-id-cache.ts`: capacity- and age-bounded deduplication for long OBS sessions
- `headlines.ts`: deterministic headline conversion, classification, ordering, and compatibility fallback
- `use-headline-queue.ts`: queue rotation and bounded deduplication
- `use-overlay-visibility.ts`: ticker and telemetry wake/sleep timers
- focused telemetry, dispatch, popup, and feed-indicator components

## Behavior preservation

The extracted headline utilities retain the current keyword classifier until Step 9 moves canonical presentation metadata to the server. Tests lock down severity, breaking-news, ordering, duplicate handling, capacity eviction, and TTL expiry.

All extracted hooks must clean up intervals, timeouts, and sockets. Runtime ID caches remain bounded so a browser source can stay open indefinitely without accumulating every historical event identifier.

No production authentication bypass or opaque local DTO is introduced. Shared runtime contracts remain the network boundary.
