# Neon Wreckers Shared Raster UI Asset Audit

## Status

Complete on branch `agent/image-first-graphics-overhaul` and documented in `docs/UI_RASTER_COMPLETION_REPORT.md`.

The Command Core, Mobile UI, Salvage Bay, and Broadcast Overlay boards, together with the generated player, mobile, admin, and overlay target screens, were inventoried and converted into one shared raster-backed interface system owned by `packages/ui`.

## Canonical implementation

```text
packages/ui/
  assets/
    raster/
      core/
      mobile/
      salvage/
      broadcast/
      generated/
  manifests/
    raster-assets.json
  src/
    raster-system.css
```

Applications consume this package rather than copying artwork or independently recreating controls.

## Completed requirements

- Source-board and generated-target hashes and dimensions are recorded in the manifest.
- Transparent WebP artwork is centralized in `packages/ui/assets/raster`.
- Painted panel, rail, button, navigation, action, rarity, alert, broadcast, event, and brand primitives are shared.
- Player, admin, and overlay consume the same implementation.
- Mobile layouts receive Mobile UI-specific treatments.
- OBS overlay presentation remains noninteractive and transparently composited.
- Existing gameplay, API, authentication, Twitch, StreamElements, WebSocket, polling, telemetry, and server-authority behavior is preserved.
- Contract tests and all production builds pass.
- Player, admin, overlay, viewer-event, resolution, and transparent OBS browser proofs pass.

## Deliberately excluded crops

Large example cards containing baked text, sample prices, usernames, timers, or telemetry values are not used as live backgrounds because they would duplicate or contradict authoritative live data. Reusable painted chrome was extracted instead, preserving the visual language without turning the application into an inaccessible screenshot mask.

See `packages/ui/manifests/raster-assets.json` for every extracted asset and `docs/UI_RASTER_COMPLETION_REPORT.md` for the application mapping, build results, and verification report.
