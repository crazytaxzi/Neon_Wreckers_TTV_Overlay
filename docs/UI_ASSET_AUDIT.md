# Neon Wreckers Shared Raster UI Asset Audit

## Status

The shared raster UI correction is **not complete**.

The repository currently contains gameplay artwork for stations, modules, wrecks, ships, and skins, including the Rustlight Tug additions on this branch. It does **not** contain the four required painted UI source boards or extracted UI chrome from them:

1. Command Core Board
2. Mobile UI Board
3. Salvage Bay Board
4. Broadcast Overlay Board

No implementation may claim completion until those four source images are present, inventoried, extracted, and consumed through the shared UI package by the player, admin, and overlay applications.

## Invalid prior approach

The previous graphics pass treated the concept boards as visual direction and surrounded existing artwork with CSS and SVG framing. That conflicts with the corrected requirement that the painted raster artwork itself is the visual source of truth.

The following do not satisfy the corrected requirement:

- CSS-drawn panel chrome
- SVG replacement frames or controls
- generic bordered rectangles
- application-specific replicas
- a placeholder `raster-skin.css`
- an overlay-only treatment

The placeholder raster stylesheet and its temporary staging workflow were removed from this branch.

## Existing raster gameplay artwork that remains valid

Existing station, module, wreck, ship, and skin WebP files remain valid as entity artwork. They are not substitutes for the missing UI boards.

The current branch also retains:

- dedicated Rustlight Tug artwork and responsive variants
- player fleet use of the ship `visualKey`
- selected-ship artwork in the management console
- overlay preservation of the current wreck `visualKey`
- current salvage-target artwork in the OBS wreck telemetry

These changes solve entity-art gaps but do not establish the required shared raster UI system.

## Required canonical asset structure

After the source boards are available, extracted assets must live under the existing shared UI package rather than inside individual applications.

```text
packages/ui/
  assets/
    raster/
      command-core/
      mobile-ui/
      salvage-bay/
      broadcast-overlay/
  manifests/
    raster-assets.json
  components/
    raster/
  styles/
    raster/
  tokens/
```

The final structure may be adjusted to the package's established TypeScript and stylesheet organization, but asset files and component implementations must remain owned by `packages/ui`.

## Manifest requirements

Every extracted raster asset must record:

- stable asset identifier
- source board
- source crop coordinates or extraction note
- file path
- intrinsic width and height
- transparent-background status
- intended component mapping
- consuming application surfaces
- supported interaction states
- safe stretch region or nine-slice insets
- minimum and maximum intended render sizes
- responsive variant relationships
- preload priority
- accessibility role

## Required shared primitives

The shared package must provide raster-backed implementations for at least:

- panel
- button
- tab
- meter and progress display
- slot and inventory frame
- rarity frame
- resource display
- section header
- alert frame
- loot card
- salvage control
- telemetry widget
- broadcast ticker
- event popup

Player, admin, and overlay code must import these implementations from the same package. Application CSS may position and compose them, but it must not redraw their painted chrome.

## Completion gate

Do not mark this work complete until all of the following are verified:

- all four source boards are present and hash-recorded
- every usable board element is inventoried
- extracted assets preserve transparency and painted detail
- shared raster components exist and are exported from `packages/ui`
- player, admin, and overlay consume those shared components
- desktop and mobile variants use the appropriate board treatments
- the overlay remains transparent, pointer-events free, configurable, and OBS-safe
- no supplied painted control is replaced by SVG or generic CSS geometry
- production builds and repository tests pass
- real screenshots are captured for all three surfaces
- the final report lists assets, board sources, mappings, consumers, unused assets, changed files, builds, tests, and screenshots

## Current blocker

The actual Command Core, Mobile UI, Salvage Bay, and Broadcast Overlay board image files are not present in the repository or connected project storage available to this branch. Asset extraction, pixel-accurate slicing, nine-slice measurements, manifest dimensions, and visual integration cannot be performed honestly without those source pixels.
