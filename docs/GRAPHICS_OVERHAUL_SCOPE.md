# Neon Wreckers Graphics Overhaul Scope

This milestone keeps the current information architecture and application behavior while replacing the visual skin across all three browser frontends.

## Locked behavior

- API routes and DTOs
- authentication
- database schema and migrations
- gameplay rules, balance, rewards, cooldowns, and random outcomes
- Twitch and StreamElements integrations
- WebSocket and polling behavior
- OBS transparency and pointer-event behavior

## Visual target

The attached Neon Wreckers concept boards are the canonical art-direction target for:

- angular black-metal panel chrome
- neon green and electric purple accents
- branded typography treatment
- illustrated rarity frames
- resource and telemetry widgets
- tactile buttons and segmented tabs
- item, wreck, ship, station, and crew presentation
- broadcast lower thirds, tickers, alerts, and event frames

The concept images are reference only. Production UI remains live HTML, CSS, SVG, and optimized artwork rather than flattened screenshots.

## Required synchronization

Player, admin, and overlay must share:

- canonical theme tokens
- panel and control chrome
- rarity, risk, status, and alert language
- resource formatting
- icon treatment
- typography hierarchy
- effects tiers and accessibility behavior

Each surface keeps its own information density and role:

- Player: immersive and touch-friendly
- Admin: dense and operational
- Overlay: lightweight, transparent, and broadcast-safe

## Acceptance gate

No merge until real built screenshots prove the graphics overhaul across:

- player mobile, tablet, and desktop
- admin tablet and desktop, plus phone-safe operations
- overlay at 720p, 1080p, 1440p, and 4K

The branch must pass all repository builds, tests, and `pnpm verify` before review.
