# UI Performance

## Measurement policy

Performance numbers must come from production builds and generated assets, not estimates or development-server output.

Record for each frontend:

- generated JavaScript size, raw and compressed
- generated CSS size, raw and compressed
- initial route transfer
- largest image assets
- number of eager image requests
- first render and interaction timing on a representative older phone and laptop
- OBS browser-source CPU and memory behavior at 720p, 1080p, 1440p, and 4K

## Production build results

The branch production builds completed in GitHub Actions. The figures below are raw generated file sizes before HTTP compression. A pre-change `main` build was not captured in the same environment, so this document does not invent a before-and-after JavaScript comparison.

| Surface | Branch JavaScript | Branch CSS | Complete output | Notes |
| --- | ---: | ---: | ---: | --- |
| Player | 313,571 bytes | 84,519 bytes | 4.5 MiB | Complete output includes the canonical and responsive game artwork library |
| Admin | 278,126 bytes | 65,899 bytes | 352 KiB | Includes the live UI Library contract |
| Overlay | 240,043 bytes | 73,387 bytes | 324 KiB | Includes overlay configuration; no large raster frame dependency |
| Shared UI package | 34,088-byte component JS plus build maps/declarations | Bundled through consumers | 196 KiB | Package build output is not browser transfer size |

Compressed JavaScript/CSS transfer, route-level timing, and CPU/memory measurements remain pending browser and OBS validation.

## Measured artwork results

The repository contains 30 canonical 1200 by 675 WebP game illustrations. The branch adds a 360-pixel and 600-pixel WebP variant for every source and selects them through `srcset` and `sizes`.

| Artwork set | Total size | Reduction from canonical set |
| --- | ---: | ---: |
| 1200px canonical sources | 3,148,872 bytes (3.00 MiB) | Baseline |
| 600px responsive variants | 610,102 bytes (595.8 KiB) | 80.6% smaller |
| 360px responsive variants | 246,412 bytes (240.6 KiB) | 92.2% smaller |

This is a library-total comparison, not a claim that every route loads every image. Secondary images are lazy-loaded, while only the visible command-center and current-wreck hero can request eager loading.

## Effects tiers

### Full

Intended for capable desktop systems and optional high-fidelity presentation.

- restrained backdrop blur
- neon bloom
- grid and scan detail
- normal transition durations
- layered panel depth

### Standard

Default phone, tablet, laptop, and OBS experience.

- mobile blur reduced to 5 pixels
- fewer decorative layers
- modest glow
- transform and opacity transitions only
- no JavaScript-driven layout animation introduced

### Low

Activated by the existing low-effects preference, reduced-motion preference, reduced-data preference, or manual user choice.

- effective backdrop blur disabled
- scanline opacity removed
- grid opacity reduced
- glow heavily reduced
- transitions reduced to near-instant under reduced motion
- no continuous decorative orbital animation added
- core borders, labels, and status communication remain present

## Implemented safeguards

- No canvas or WebGL dependency.
- No downloaded font binaries or external font requests.
- No large concept screenshots used as interface surfaces.
- Existing WebP game artwork remains the image source.
- Every canonical game illustration has responsive mobile and tablet variants.
- Responsive images reserve intrinsic dimensions to reduce layout shift.
- Secondary artwork uses lazy loading and async decoding.
- CSS/SVG/icon framing is used for panels and controls.
- Full-screen blur is avoided.
- Continuous JavaScript layout measurement is not introduced.
- Existing player refresh-in-flight protection remains unchanged.
- Existing player polling and WebSocket behavior remains unchanged.
- Existing overlay polling and reconnect behavior remains unchanged.
- Malformed overlay packets remain isolated by the existing parser guard.
- Narrow-screen tables become records without duplicated data fetching.

## Remaining optimization work

The player application still has one large entry module. The next structural milestone should split page modules and page-specific data access while preserving public URLs and server authority.

Recommended sequence:

1. Extract shared DTOs and typed browser view models.
2. Move page components into feature modules without altering behavior.
3. Lazy-load secondary destinations such as museum, quarters, history, settings, and the guide.
4. Replace global refresh-after-action behavior with scoped refreshes where the API response contains sufficient authoritative state.
5. Measure each split before and after rather than assuming smaller chunks improve interaction.
6. Add browser smoke tests that record overflow and console errors for the required viewport matrix.

## Required commands

```text
pnpm --filter @neon-wreckers/ui run build
pnpm --filter @neon-wreckers/web run build
pnpm --filter @neon-wreckers/admin run build
pnpm --filter @neon-wreckers/overlay run build
pnpm test
pnpm verify
```

The pull request remains draft until the final CI run passes and the manual browser and OBS validation matrix is completed.
