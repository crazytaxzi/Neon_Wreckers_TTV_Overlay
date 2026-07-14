# Neon Wreckers UI design system

Phase 2 is implemented directly on the stabilized Version 2.0 source. The shared interface package lives at `packages/ui` and is the required foundation for player, administrator, and future browser screens. It changes presentation only. The current same-origin API client, Vite proxies, route paths, authentication, database, game rules, content, worker, deployment, and balance remain authoritative.

## Package layout

```text
packages/ui/
├── src/components.tsx   Reusable React components and layout primitives
├── src/icons.tsx        Typed domain icon registry
├── src/showcase.tsx     Live component catalog rendered by the admin app
├── src/styles.css       Shared component, responsive, motion, and accessibility CSS
├── src/theme.ts         Canonical themes, tokens, and runtime application
└── src/index.ts         Public exports and shared stylesheet entry
```

Application composition remains local:

- `apps/web/src/main.tsx` builds the player command interface using current API DTOs and endpoints.
- `apps/web/src/styles.css` contains only player-specific schematics and page composition.
- `apps/admin/src/main.tsx` builds the Streamer Control Center and exposes the live UI Library.
- `apps/admin/src/admin.css` contains only admin-specific composition.
- `apps/overlay` keeps its current feed, timing, placement, and WebSocket behavior while inheriting the central default theme.
- `packages/client-theme` remains a compatibility stylesheet entry that forwards to `@neon-wreckers/ui/styles.css`.

## Using the package

```tsx
import {
  AppShell,
  Button,
  CommandHeader,
  Panel,
  SectionTitle,
  StatusDisplay,
  ThemeProvider,
  defaultTheme
} from '@neon-wreckers/ui';

export function Screen() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <Panel>
        <SectionTitle title="Reactor Control" icon="reactor" />
        <StatusDisplay label="Output" value={84} unit="%" tone="purple" />
        <Button variant="primary">Synchronize</Button>
      </Panel>
    </ThemeProvider>
  );
}
```

Import the package entry once at the application boundary. Do not copy its CSS into an app or recreate shared primitives locally.

## Component inventory

### Shell and navigation

`AppShell`, `CommandHeader`, `CommandNavigation`, `ResponsiveGrid`, `SplitLayout`, `SectionTitle`, and `ProfileChip`.

### Surfaces and data

`Card`, `Panel`, `ScrollableList`, `Table`, `DataGrid`, `ModuleCard`, and `InventoryCard`.

### Actions and controls

`Button`, `IconButton`, `Tabs`, `Field`, `Input`, `Textarea`, `Select`, `ToggleSwitch`, `SliderControl`, `ContextMenu`, and `Tooltip`.

### Telemetry

`StatusDisplay`, `ProgressBar`, `Meter`, `HealthBar`, `PowerBar`, `PopulationDisplay`, `Badge`, and `Pill`.

### Feedback and transient state

`Notification`, `Modal`, `Dialog`, `ConfirmWindow`, `ToastProvider`, `useToast`, `ToastViewport`, `LoadingScreen`, and `Skeleton`.

The admin application's **UI Library** page renders every family with interactive states. It is the visual contract for future work, not a disposable demo.

## Theme architecture

`packages/ui/src/theme.ts` is the canonical visual configuration. A `ThemeDefinition` controls:

- palette and generated RGB channels
- display, body, and numeric font stacks
- spacing scale
- corner geometry
- border weights
- blur and transparency
- glow intensity
- panel depth
- animation speed and easing

`applyTheme()` writes the theme to `--nw-*` custom properties. Shared and app-specific CSS consume those properties. App CSS must not contain independent palette literals.

Create a seasonal theme by extending the default:

```ts
import { createTheme } from '@neon-wreckers/ui/theme';

export const winterSignalTheme = createTheme('winter-signal', {
  colors: {
    green: '#d8ff73',
    purple: '#7e6cff',
    cyan: '#8ff4ff',
    canvas: '#050910'
  },
  glow: {
    active: '0 0 26px rgba(var(--nw-color-cyan-rgb), 0.24)'
  }
});
```

Changing the active theme changes component surfaces, player-specific diagrams, and overlay defaults together. Overlay placement and optional broadcaster overrides remain in overlay configuration because they are operational controls rather than seasonal design tokens.

## Typography

The shared stylesheet provides display, title, section, panel-header, body, small, caption, status, and numeric-readout scales. Viewport-aware `clamp()` values preserve hierarchy from mobile through 2560×1440.

- `--nw-font-display` is used for command headings and labels.
- `--nw-font-body` is used for readable interface copy.
- `--nw-font-mono` and `.nw-numeric` are used for telemetry, identifiers, and tabular numbers.

No font binaries are bundled. The stacks use local and system fonts so the clients remain deployable without an external font dependency.

## Icon system

Use `NWIcon` with the typed `IconName` registry:

```tsx
<NWIcon name="reactor" size={18} />
```

The registry covers station, crew, power, reactor, storage, wreck, mining, danger, expedition, trade, construction, research, events, broadcast, Twitch, StreamElements, inventory, resources, credits, salvage, notifications, and supporting system actions.

Do not add emoji, inline one-off SVGs, or direct icon imports in product screens. Add a semantic name to `packages/ui/src/icons.tsx` so every app speaks the same visual language.

## Responsive contract

The shell is fluid and does not assume a single canvas size.

- 2560×1440 and 1920×1080 use the full command rail and dense telemetry layouts.
- 1366×768 compacts spacing and keeps data surfaces independently scrollable.
- tablet widths collapse secondary columns and reduce rail density.
- mobile converts navigation into a reachable bottom command bar and stacks content without overlap.

Use `ResponsiveGrid` for repeated cards and `SplitLayout` for primary and secondary work areas. Fixed positioning is reserved for contained visualizations such as the station schematic, never for page structure.

## Motion and accessibility

Motion is limited to hover illumination, panel entrance, status pulses, warning pulses, notification travel, shimmer, and low-amplitude holographic flicker. All durations come from theme variables.

The system maintains:

- visible keyboard focus
- semantic controls and labels
- arrow, Home, and End behavior for tabs
- focus containment and restoration for dialogs
- Escape dismissal for modal surfaces
- touch-safe targets
- live regions for status feedback
- scalable text
- `prefers-reduced-motion` and `prefers-contrast` support

Never remove focus indicators or replace a native control with an inert element carrying click handlers.

## Adding a component

1. Add the reusable React primitive to `packages/ui/src/components.tsx`.
2. Style it only with `--nw-*` variables in `packages/ui/src/styles.css`.
3. Export it through `packages/ui/src/index.ts`.
4. Add representative states to `ComponentShowcase`.
5. Verify keyboard use, focus, reduced motion, high contrast, narrow layouts, and empty states.
6. Run the UI and client builds.

```bash
pnpm --filter @neon-wreckers/ui run build
pnpm --filter @neon-wreckers/web run build
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
```

A component belongs in an app only when it is genuinely specific to that surface. Reusable visual behavior belongs in `@neon-wreckers/ui`.
