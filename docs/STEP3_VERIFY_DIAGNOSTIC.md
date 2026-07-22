# Step 3 focused diagnostic

Exit status: 1

## Error matches
```text
262:not ok 12 - workspace lock contains every active package and no retired dependencies
285:  code: 'ERR_ASSERTION'
286:  name: 'AssertionError'
505: ELIFECYCLE  Command failed with exit code 1.
506: ELIFECYCLE  Test failed. See above for more details.
507: ELIFECYCLE  Command failed with exit code 1.
```

## Tail
```text
  type: 'test'
  ...
# Subtest: raw Twitch payloads stay in structured logs instead of operator toasts
ok 21 - raw Twitch payloads stay in structured logs instead of operator toasts
  ---
  duration_ms: 0.9988
  type: 'test'
  ...
# Subtest: player admin and overlay load one synchronized graphics system
ok 22 - player admin and overlay load one synchronized graphics system
  ---
  duration_ms: 200.061939
  type: 'test'
  ...
# Subtest: core game vocabulary uses native Neon Wreckers SVG glyphs
ok 23 - core game vocabulary uses native Neon Wreckers SVG glyphs
  ---
  duration_ms: 153.26816
  type: 'test'
  ...
# Subtest: illustrated layers retain accessibility and low-effects fallbacks
ok 24 - illustrated layers retain accessibility and low-effects fallbacks
  ---
  duration_ms: 10.855707
  type: 'test'
  ...
# Subtest: admin UI Library documents graphic language and rarity hardware
ok 25 - admin UI Library documents graphic language and rarity hardware
  ---
  duration_ms: 4.145199
  type: 'test'
  ...
# Subtest: viewer event popups use real classified overlay history
ok 26 - viewer event popups use real classified overlay history
  ---
  duration_ms: 6.625747
  type: 'test'
  ...
# Subtest: visual proof responsibilities are separated without fake production APIs
ok 27 - visual proof responsibilities are separated without fake production APIs
  ---
  duration_ms: 4.508195
  type: 'test'
  ...
# Subtest: shared package imports the painted raster skin
ok 28 - shared package imports the painted raster skin
  ---
  duration_ms: 17.679365
  type: 'test'
  ...
# Subtest: manifest covers every surface and required source board
ok 29 - manifest covers every surface and required source board
  ---
  duration_ms: 10.265215
  type: 'test'
  ...
# Subtest: raster directory contains only WebP artwork
ok 30 - raster directory contains only WebP artwork
  ---
  duration_ms: 6.273381
  type: 'test'
  ...
# Subtest: skin maps player admin mobile and OBS classes
ok 31 - skin maps player admin mobile and OBS classes
  ---
  duration_ms: 7.344695
  type: 'test'
  ...
# Subtest: shared UI loads the canonical revamp stylesheet and stream theme
ok 32 - shared UI loads the canonical revamp stylesheet and stream theme
  ---
  duration_ms: 18.558305
  type: 'test'
  ...
# Subtest: player navigation exposes exactly five primary mobile destinations
ok 33 - player navigation exposes exactly five primary mobile destinations
  ---
  duration_ms: 10.168699
  type: 'test'
  ...
# Subtest: responsive and effects contracts include safe areas and low-effects fallbacks
ok 34 - responsive and effects contracts include safe areas and low-effects fallbacks
  ---
  duration_ms: 3.94465
  type: 'test'
  ...
# Subtest: shared component contract includes player, admin, and overlay primitives
ok 35 - shared component contract includes player, admin, and overlay primitives
  ---
  duration_ms: 3.392163
  type: 'test'
  ...
# Subtest: player artwork uses responsive project assets instead of concept screenshots
ok 36 - player artwork uses responsive project assets instead of concept screenshots
  ---
  duration_ms: 28.42365
  type: 'test'
  ...
# Subtest: overlay safety behavior remains present
ok 37 - overlay safety behavior remains present
  ---
  duration_ms: 5.519813
  type: 'test'
  ...
# Subtest: player entry is split into behavior-preserving feature modules
ok 38 - player entry is split into behavior-preserving feature modules
  ---
  duration_ms: 12.942896
  type: 'test'
  ...
# Subtest: player HTML entry points declare real device viewports
ok 39 - player HTML entry points declare real device viewports
  ---
  duration_ms: 6.35318
  type: 'test'
  ...
# Subtest: concept-faithful player surfaces are implemented in live React pages
ok 40 - concept-faithful player surfaces are implemented in live React pages
  ---
  duration_ms: 23.728388
  type: 'test'
  ...
# Subtest: visual proof fixture is build-gated and cannot replace production data accidentally
ok 41 - visual proof fixture is build-gated and cannot replace production data accidentally
  ---
  duration_ms: 132.471929
  type: 'test'
  ...
1..41
# tests 41
# suites 0
# pass 40
# fail 1
# cancelled 0
# skipped 0
# todo 0
# duration_ms 3205.146536
 ELIFECYCLE  Command failed with exit code 1.
 ELIFECYCLE  Test failed. See above for more details.
 ELIFECYCLE  Command failed with exit code 1.
```
