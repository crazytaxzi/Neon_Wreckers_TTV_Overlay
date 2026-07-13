# Frontend component and visual guide

Sprint 1 preserves the existing visual identity and layout: dark salvage metal, scratched console panels, neon green accents, electric purple lighting, cyan readouts, cargo labels, hazard states, and a station that visibly reflects persisted state. No visual redesign or artwork replacement is part of this release.

## Player surfaces

The mobile-first player application contains ten reachable tabs:

- Station: animated station view, shared statistics, active wreck, inventory preview, and station feed.
- Salvage: scan, cutters, cargo recovery, and safety override controls.
- Hold: player inventory stacks.
- Build: station module cards and material contribution.
- Crew: owned crew roster.
- Ships: owned ship roster and condition data.
- Museum: plaques attached to station modules.
- Market: the existing closed marketplace surface gated by station progression.
- Quarters: the existing personal-quarters surface.
- Profile: Twitch identity and player progression.

The app uses same-origin `/api` requests and subscribes to `/api/v1/ws` for station, wreck, and history updates.

## Admin and overlay

The admin application retains the existing control-center layout and operations. The overlay retains its transparent OBS composition, configurable panels, scanlines, glass treatment, feed timing, and breaking-news behavior.

## Accessibility and responsiveness

Existing CSS respects reduced-motion and high-contrast preferences. Touch targets remain sized for mobile interaction, the bottom navigation remains thumb-oriented, and layouts collapse for portrait screens. Shared player/admin CSS is owned by `packages/client-theme/styles.css`; application-specific CSS remains with its application.
