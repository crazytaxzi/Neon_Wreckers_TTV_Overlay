# Graphics Component Matrix

This document tracks the synchronized graphics overhaul across the shared design system, player application, admin console, and OBS overlay.

| Visual family | Shared primitive | Player | Admin | Overlay |
| --- | --- | --- | --- | --- |
| Brand lockup | `CommandHeader` / `.nw-brand-lockup` | immersive header | compact operations header | event identity only |
| Panel chrome | `Panel`, `Card` | heavy tactical framing | restrained dense framing | lightweight transparent framing |
| Buttons and tabs | `Button`, `IconButton`, tabs | touch-first | keyboard and table actions | configuration only |
| Resource telemetry | `ResourceStrip`, `StatusDisplay` | full game telemetry | operational summaries | compact broadcast widgets |
| Alerts | `Notification`, `DispatchBanner` | hazard and personal alerts | system and destructive warnings | breaking alert and event popup |
| Progress and meters | `ProgressBar`, `Meter` | station, wreck, ship, project | health and timer telemetry | station and wreck readouts |
| Rarity and risk | shared tone language | item and wreck cards | content and economy records | event severity only |
| Navigation | command rail / bottom navigation | five primary destinations | grouped operations navigation | not applicable |

## Acceptance rule

The same semantic tone must produce recognizable matching chrome across all surfaces without forcing the player shell into the admin or overlay bundles.
