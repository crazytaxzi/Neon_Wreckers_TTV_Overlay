# Packages

## Purpose

`game-engine` contains deterministic server rules. `content` validates and exposes the canonical source-controlled game definitions. `integrations` contains external-provider and Redis configuration adapters. `browser-client` contains the typed same-origin API envelope helper used by all browser applications. `client-theme` contains the unchanged shared visual stylesheet consumed by the player and admin clients.

## Architecture

Packages must remain framework-light and reusable by the API, worker, seed, or tests. The game engine has no database, filesystem, content, or network dependency. The content package owns JSON loading and structural validation. Integrations own external protocol details and timeouts.

## Dependencies

The game engine uses only Node built-ins. Content uses `zod`. Integrations uses `undici`. Browser client and client theme have no third-party runtime dependencies. Package exports are explicit and versioned with the repository.

## Extension points

Add mechanics to the game engine with deterministic tests and inject definitions from content. Add validated source data through the content package. Add provider adapters to integrations behind stable interfaces. Keep browser API envelope handling in browser client rather than duplicating fetch code. Shared player/admin visual tokens belong in client theme; overlay-specific styling remains isolated in the overlay app. Do not create empty packages or packages with no consumers.
