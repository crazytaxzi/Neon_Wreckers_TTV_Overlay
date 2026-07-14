# Packages

## Purpose

- `game-engine` contains deterministic server rules.
- `content` validates and exposes canonical source-controlled game definitions.
- `integrations` owns Twitch, StreamElements, and Redis adapters.
- `browser-client` owns same-origin browser request envelopes and errors.
- `ui` owns the reusable React component library, icons, tokens, themes, responsive behavior, motion, and accessibility rules.
- `client-theme` is a compatibility stylesheet entry that forwards older imports to the UI package.

## Boundaries

Packages must remain reusable and may not import application source. The game engine has no database, filesystem, content, or network dependency. Content owns JSON loading and structural validation. Integrations own external protocols and timeouts. Browser clients remain non-authoritative for rewards, costs, cooldowns, inventory mutation, and station mutation.

The UI package may consume React, React DOM, and Lucide, but it must not import API routes, game rules, database types, or application state. Application DTOs are composed in the relevant app.

## Extension points

Add deterministic mechanics to the engine with tests. Add source data through content and `assets/manifest.json`. Add external provider adapters to integrations. Keep request-envelope behavior in browser client. Add reusable interface primitives, icons, themes, and examples to UI rather than duplicating them across apps.
