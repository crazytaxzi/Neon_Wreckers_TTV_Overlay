# UI Asset Audit

## Policy

The supplied Neon Wreckers concept images define composition, hierarchy, framing, tactile controls, neon accents, and broadcast language. They are not committed as flattened interface screenshots or required page backgrounds.

Production game imagery continues to come from the repository's existing station, wreck, module, and ship artwork. UI copy remains live HTML and shared CSS/SVG/icon primitives provide the surrounding frame.

## Canonical artwork inventory

All 31 canonical sources are WebP files with intrinsic dimensions of 1200 by 675 pixels.

| Category | Canonical sources | Original transfer size | Production use |
| --- | ---: | ---: | --- |
| Station command center | 1 | 139,520 bytes | Home/Command Center hero |
| Station modules | 9 | 1,133,862 bytes | Station overview and module nodes |
| Wrecks | 12 | 1,099,004 bytes | Current salvage target imagery |
| Base ships | 3 | 162,928 bytes | Owned-ship fallback presentation |
| Premium ship skins | 6 | 625,558 bytes | Ship cards, management previews, and skin selection |
| **Total** | **31** | **3,160,872 bytes (3.01 MiB)** | Player application artwork library |

## Responsive variants

Every canonical source now has:

- a `-360w.webp` mobile variant
- a `-600w.webp` tablet and compact-laptop variant
- the original 1200-pixel-wide source as the desktop/high-density fallback

The `GameArtwork` component supplies `srcset`, `sizes`, intrinsic width and height, async decoding, and lazy loading. The station command-center hero and current wreck hero may load eagerly because they are primary visible content. Secondary modules, ships, and skin previews load lazily.

Measured totals for all 30 assets:

| Variant set | Total transfer size | Reduction from originals |
| --- | ---: | ---: |
| 1200px canonical sources | 3,160,872 bytes (3.01 MiB) | Baseline |
| 600px variants | 622,102 bytes (607.5 KiB) | 80.3% smaller |
| 360px variants | 258,412 bytes (252.4 KiB) | 91.8% smaller |

Representative measured files:

| Asset | Original | 600px | 360px |
| --- | ---: | ---: | ---: |
| Station Zero | 139,520 bytes | 25,760 bytes | 10,062 bytes |
| Orpheus Barge | 116,012 bytes | 21,574 bytes | 8,418 bytes |
| Cargo Hauler Leviathan | 139,806 bytes | 27,662 bytes | 10,786 bytes |
| Rustlight Tug | 12,000 bytes | 12,000 bytes | 12,000 bytes |

Actual browser transfer depends on viewport, device pixel ratio, cache state, and the rendered `sizes` value. The smaller variants prevent ordinary phones from downloading the 1200-pixel originals for compact cards.

## Naming convention

Canonical source:

```text
<visual-key>.webp
```

Responsive variants:

```text
<visual-key>-360w.webp
<visual-key>-600w.webp
```

Existing visual keys and API/content identifiers remain unchanged.

## Accessibility and alternative text

- Meaningful hero and entity images retain descriptive alternative text.
- Decorative module-node images use empty alternative text because the adjacent live heading already names the module.
- UI labels are never embedded into artwork.
- Rarity, status, risk, and warning information remains live text and is not encoded only in an image or color.

## Layout rules

- Artwork does not determine layout dimensions.
- Images reserve space through intrinsic dimensions to reduce layout shift.
- `object-fit` and container styling control presentation.
- CSS and shared icons provide framing, telemetry, badges, and controls.
- No concept screenshot is loaded by a production route.

## Validation contract

`tools/test/ui-revamp.test.mjs` verifies:

- 31 canonical project sources exist
- 31 mobile variants exist
- 31 tablet variants exist
- the player imports and uses `GameArtwork`
- project station, wreck, and ship artwork is not rendered through unresponsive direct image tags
- lazy/eager behavior, async decoding, and intrinsic dimensions remain defined
