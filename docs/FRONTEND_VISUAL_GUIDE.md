# Frontend visual guide

The browser surfaces use one command-interface language owned by `@neon-wreckers/ui`. The visual target is a station operating system: sharp layered glass, restrained holographic energy, dense but readable telemetry, and strong hierarchy without dashboard-template or rounded mobile-app styling.

## Palette and hierarchy

Neon green is the primary operational color. Electric purple marks advanced or secondary systems. Cyan carries information and focus. Orange and red are reserved for warning and danger. Dark charcoal, gunmetal, black glass, fine borders, inner illumination, and shallow depth form the neutral structure.

All colors, opacity, blur, depth, spacing, radii, typography, and motion values originate in `packages/ui/src/theme.ts`. App-local CSS must use generated `--nw-*` variables.

## Surfaces

Panels use fine borders, subtle gradients, inner glow, limited blur, clipped or sharp geometry, and small corner radii. Giant drop shadows, pill-shaped containers, generic white cards, Bootstrap patterns, and Material-style elevation are not part of the system.

## Typography and telemetry

Display and section headings use the command font stack. Body content uses the readable UI stack. Identifiers, percentages, timestamps, inventory quantities, and status values use the numeric stack with tabular figures. Hierarchy must survive both a 2560×1440 display and a portrait mobile viewport.

## Icons and artwork

Product UI uses the semantic `NWIcon` registry. Emoji and one-off placeholder graphics are not allowed. Content image keys remain governed by `assets/manifest.json`. Phase 2 does not introduce temporary or generated artwork.

## Responsive behavior

Desktop uses a command rail and multi-column work areas. Tablet collapses utility regions and secondary columns. Mobile uses a bottom command bar, stacked content, horizontal-safe data grids, and touch-sized controls. No page may depend on a fixed 1920×1080 canvas.

## Accessibility and motion

Focus indicators, semantic controls, readable contrast, scalable text, reduced motion, contrast preference handling, and keyboard-accessible dialogs are part of the visual contract. Animation should communicate state or continuity, not decorate every pixel simply because the GPU looked bored.

See `docs/UI_DESIGN_SYSTEM.md` and `docs/THEME_TOKEN_GUIDE.md` for implementation rules.
