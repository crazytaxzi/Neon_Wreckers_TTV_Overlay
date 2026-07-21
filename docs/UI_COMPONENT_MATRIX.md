# UI Component Matrix

## Ownership rule

`packages/ui` is the canonical shared React design system. Player, admin, and overlay surfaces compose shared primitives for their own audience instead of copying CSS or markup.

| Component | Player | Admin | Overlay | Important states |
| --- | --- | --- | --- | --- |
| `ThemeProvider` | Yes | Yes | Yes | default, high contrast, seasonal extension |
| `CommandHeader` | Yes | Yes | No | title, status, actions, profile |
| `CommandNavigation` | Yes | Yes | No | active, disabled, grouped desktop, five-item mobile, secondary sheet |
| `Panel` | Yes | Yes | Yes | low/medium/high depth, tone, scanline off |
| `Card` | Yes | Yes | Optional | neutral, semantic tone, interactive, selected |
| `SectionTitle` | Yes | Yes | Optional | eyebrow, icon, description, action |
| `ResourceStrip` | Yes | Yes | Compact | full, compact, semantic resource tones |
| `StatusDisplay` / `MetricTile` | Yes | Yes | Compact variant | neutral, success, info, warning, danger, purple |
| `ProgressBar` | Yes | Yes | Yes | determinate, indeterminate, semantic tone |
| `Meter` | Yes | Yes | Yes | segmented value, semantic tone |
| `EntityCard` | Yes | Yes | No | artwork/icon fallback, status, action |
| `ActionTile` | Yes | Yes | No | enabled, disabled, warning, destructive |
| `InventoryCard` | Yes | Optional | No | selected, interactive, rarity labels |
| `InventorySlot` / `InventoryGrid` | Yes | Optional | No | common through legendary, selected, disabled |
| `DispatchBanner` | Yes | Yes | Yes | informational, viewer, warning, critical |
| `Notification` | Yes | Yes | Optional | status and alert semantics, dismissible |
| `DataGrid` | Optional | Yes | No | populated, empty, narrow-screen labelled records |
| `RecordList` | Yes | Yes | No | compact record groups |
| `Tabs` / `SegmentedTabs` | Yes | Yes | No | active, disabled, arrow/Home/End keyboard operation |
| `Modal` / `ConfirmWindow` | Yes | Yes | No | focus trap, Escape, destructive confirmation |
| `EmptyState` | Yes | Yes | No | icon, explanation, optional action |
| `LoadingState` / `LoadingScreen` | Yes | Yes | No | compact and full-screen status |
| `OverlayTelemetryPanel` | No | UI Library | Yes | metric, unit, tone, optional meter |
| `OverlayEventPopup` | No | UI Library | Yes | normal, viewer, warning, breaking |

## Semantic treatments

Warnings, danger, success, and rarity are never communicated by color alone. Components combine:

- visible text labels
- semantic icons
- border and frame treatment
- optional pattern or segmented meter treatment
- color as supporting information

## Navigation contract

### Mobile player primary destinations

- Home
- Salvage
- Station
- Market
- Profile

### Station sheet

- Hold
- Craft
- Build
- Crew
- Ships
- Expeditions
- Museum

### Profile sheet

- Profile
- Quarters
- Alerts
- History
- How to Play
- Settings

### Desktop player groups

- Command
- Logistics
- Station Systems
- Personal

## UI Library requirement

The `ComponentShowcase` inside the admin application is the implementation contract. New shared components must be demonstrated there with:

- default state
- semantic states
- disabled or unavailable state when applicable
- narrow-screen behavior
- keyboard behavior
- high-contrast behavior
- reduced-motion and low-effects behavior
- real icon treatment
- loading and empty states
