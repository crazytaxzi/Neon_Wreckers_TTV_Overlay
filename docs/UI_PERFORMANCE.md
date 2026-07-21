# UI Performance

## Measurement policy

Performance numbers must come from a production build, not from estimates or development-server output.

Record for each frontend:

- generated JavaScript size, raw and compressed
- generated CSS size, raw and compressed
- initial route transfer
- largest image assets
- number of eager image requests
- first render and interaction timing on a representative older phone and laptop
- OBS browser-source CPU and memory behavior at 720p, 1080p, 1440p, and 4K

## Baseline status

The connector-only implementation environment could inspect repository source but could not execute the repository checkout. Therefore this branch does not invent baseline or final bundle numbers.

Before merge, run the production builds and add the generated values to the table below.

| Surface | Baseline JS | Final JS | Baseline CSS | Final CSS | Initial image transfer | Notes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Player | Pending measured build | Pending measured build | Pending measured build | Pending measured build | Pending | Existing monolithic entry remains the main code-splitting risk |
| Admin | Pending measured build | Pending measured build | Pending measured build | Pending measured build | Pending | Shared UI Library adds test-only component examples to the admin bundle |
| Overlay | Pending measured build | Pending measured build | Pending measured build | Pending measured build | Pending | No large raster frame dependency added |

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

After the commands pass, capture `dist` file sizes and update this document with the actual baseline/final comparison.
