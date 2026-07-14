# Content

## Purpose

`base` contains canonical JSON definitions for items, wrecks, modules, the initial station, events, seasons, balance, and themes.

## Architecture

Content describes data. The server implements allowed behavior. Content cannot execute arbitrary JavaScript. `@neon-wreckers/content` validates and exposes these files to the API, worker, seed, and tests. Database `ContentVersion` rows may store reviewed versions, while these files remain the source-controlled baseline.

## Dependencies

Visual references depend on `assets/manifest.json`. Every manifest key must be referenced by canonical content or an explicitly owned runtime visual. Module prerequisites, initial-station modules, and resource names must resolve. Seasons depend on theme slugs. Validation is performed by `pnpm run test:content`.

## Extension points

Use unique kebab-case slugs, preserve retired identifiers needed by existing player data, add visual keys before referencing them, and add server handlers for any genuinely new condition or action type.
