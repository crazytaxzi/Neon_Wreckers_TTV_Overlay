# UI Responsive Matrix

## Layout contracts

The shared layout uses fluid grid/flex behavior, `clamp()`, safe-area environment variables, container queries, and intentional narrow-screen table conversion. It does not create separate iPhone and Android implementations.

### Global requirements

- No page-level horizontal scrolling.
- Controls remain at least 44 by 44 CSS pixels where interactive.
- No hover-only actions.
- Bottom navigation respects the home indicator safe area.
- The header respects the top safe area.
- Dialogs remain within the viewport and retain keyboard focus.
- Data grids convert to labelled records below 760 CSS pixels.
- Landscape phones receive a shorter navigation/header treatment.
- Large text remains compatible with mobile navigation and sheets.
- Decorative artwork does not control page dimensions.

## Required viewport matrix

The following matrix is the manual and automated smoke-test contract. A checked box must only be added after a browser run confirms the result.

| Viewport | Player shell | Five-item nav | Secondary sheets | Admin tables | Dialogs | No horizontal overflow | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 320x568 | Required | Required | Required | Required | Required | Required | Source contract added, visual run pending |
| 360x640 | Required | Required | Required | Required | Required | Required | Source contract added, visual run pending |
| 375x667 | Required | Required | Required | Required | Required | Required | Source contract added, visual run pending |
| 390x844 | Required | Required | Required | Required | Required | Required | Source contract added, visual run pending |
| 412x915 | Required | Required | Required | Required | Required | Required | Source contract added, visual run pending |
| 430x932 | Required | Required | Required | Required | Required | Required | Source contract added, visual run pending |
| 600x960 | Required | Required | Required | Required | Required | Required | Source contract added, visual run pending |
| 768x1024 | Required | Desktop rail | N/A | Required | Required | Required | Source contract added, visual run pending |
| 820x1180 | Required | Desktop rail | N/A | Required | Required | Required | Source contract added, visual run pending |
| 1024x768 | Required | Compact rail | N/A | Required | Required | Required | Source contract added, visual run pending |
| 1280x720 | Required | Desktop rail | N/A | Required | Required | Required | Source contract added, visual run pending |
| 1366x768 | Required | Desktop rail | N/A | Required | Required | Required | Source contract added, visual run pending |
| 1440x900 | Required | Desktop rail | N/A | Required | Required | Required | Source contract added, visual run pending |
| 1920x1080 | Required | Desktop rail | N/A | Required | Required | Required | Source contract added, visual run pending |
| 2560x1440 | Required | Desktop rail | N/A | Required | Required | Required | Source contract added, visual run pending |

## OBS canvas matrix

| Canvas | Station telemetry | Wreck telemetry | Dispatch rail | Safe zones | Status |
| --- | --- | --- | --- | --- | --- |
| 1280x720 | Required | Required | Required | Required | Existing responsive overlay retained, visual run pending |
| 1920x1080 | Required | Required | Required | Required | Existing responsive overlay retained, visual run pending |
| 2560x1440 | Required | Required | Required | Required | Existing responsive overlay retained, visual run pending |
| 3840x2160 | Required | Required | Required | Required | Existing responsive overlay retained, visual run pending |

## Breakpoint behavior

### Up to 430 pixels

- Compact padding and panel cuts.
- Two-column resource and inventory treatments where content permits.
- Five primary bottom-navigation buttons.
- Station and Profile systems open as bottom sheets.
- Header hides nonessential subtitle/status/profile content.

### Up to 760 pixels

- Player bottom navigation replaces the desktop rail.
- Admin navigation remains available without page-level overflow.
- Data grids become labelled record cards.
- Split layouts collapse to one column.
- Section actions become full-width where needed.

### 761 to 1100 pixels

- Desktop command rail becomes icon-forward and narrow.
- Main content retains full width without a phone-style bottom bar.

### Landscape phones below 520 pixels high

- Header and navigation heights are reduced.
- Navigation labels and icons sit in a compact row.
- Secondary sheets may use up to 82 percent of the dynamic viewport height.

## Accessibility/device preference checks

Validate each representative viewport with:

- browser zoom at 100, 150, and 200 percent
- large text on and off
- reduced motion on and off
- low effects on and off
- high contrast on and off
- keyboard-only input
- touch emulation
- forced colors where available
- iPhone Safari safe areas
- Android Chrome dynamic viewport behavior
