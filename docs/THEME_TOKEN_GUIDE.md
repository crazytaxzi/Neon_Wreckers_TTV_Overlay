# Theme and token guide

The canonical visual source is `packages/ui/src/theme.ts`. `packages/ui/src/styles.css` provides the component implementation and a default CSS snapshot for first paint, but runtime theme values are generated from `ThemeDefinition`.

## Default palette

| Theme field | Default | Purpose |
| --- | --- | --- |
| `colors.void` | `#020408` | deepest background and dark foreground on bright controls |
| `colors.canvas` | `#070a0f` | application field |
| `colors.surface` | `#0d1218` | panel base |
| `colors.surfaceRaised` | `#131b24` | elevated or emphasized surface |
| `colors.text` | `#edf7f3` | primary text and neutral highlight channel |
| `colors.textMuted` | `#9aaba8` | secondary copy |
| `colors.textDim` | `#61716f` | disabled and tertiary data |
| `colors.green` | `#8dff5a` | primary action and nominal station state |
| `colors.purple` | `#ae5cff` | advanced systems and secondary energy |
| `colors.cyan` | `#58e6ff` | information and focus |
| `colors.orange` | `#ff9d43` | warning |
| `colors.red` | `#ff4d67` | danger and destructive action |

Every solid hex color also produces an RGB channel variable. For example:

```css
color: var(--nw-color-green);
border-color: rgba(var(--nw-color-green-rgb), 0.35);
```

This keeps glows, borders, gradients, scanlines, and diagrams synchronized when a theme changes.

## Token groups

`ThemeDefinition` includes:

- `colors`
- `fonts`
- `typography`
- `spacing`
- `radius`
- `border`
- `blur`
- `transparency`
- `glow`
- `depth`
- `animation`

`typography` defines the display, title, section, panel-header, body, small, caption, status, and numeric-readout scales. `themeToCssVariables()` publishes all values under the `--nw-*` namespace. `createTheme(id, overrides)` creates a complete theme from partial overrides. `ThemeProvider` applies a theme to an application tree, while `applyTheme()` supports non-provider surfaces such as the OBS overlay.

## Application rules

- Shared components may use only `--nw-*` values.
- App CSS may introduce layout variables but not a second color palette.
- Neutral white and black effects use the theme text and void RGB channels.
- Warning and danger colors remain sparse and semantic.
- Glow strength must remain subtle enough that text boundaries stay crisp.
- The canonical asset-key registry remains `assets/manifest.json`; theme files do not invent content visual keys.

## Overlay behavior

The overlay imports `defaultTheme` for its default colors. `apps/overlay/public/overlay-config.json` controls placement, scale, timing, scanlines, visibility, and glass behavior. Broadcaster-supplied file or URL color overrides remain supported, but they are optional operational overrides rather than a second default theme.

## Content themes

Records in `content/base/themes.json` remain validated game content. They may identify a season or theme slug. The production interface values associated with that slug belong in UI theme code so a visual reskin does not alter game content, database records, APIs, or balance.
