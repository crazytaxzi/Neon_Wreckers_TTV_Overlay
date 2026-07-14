# Assets

## Purpose

`manifest.json` is the canonical registry of visual keys referenced by content and server-created entities. Phase 2 does not add placeholder art or temporary generated imagery. The UI component and icon systems are code-owned, while content artwork remains identified through stable manifest keys.

## Architecture

Game records refer to stable keys rather than deployment paths. The manifest provides type, tags, and accessible alt text. Interface icons are separately owned by the semantic `NWIcon` registry in `packages/ui/src/icons.tsx`; those icons must not be used as substitutes for content artwork keys.

## Dependencies

Items, wrecks, modules, ships, and currency visuals depend on manifest keys. `pnpm run test:content` rejects missing, duplicate, or unused keys.

## Extension points

Add a unique kebab-case key and useful alt text before referencing a new content visual. Preserve old keys when durable records may still contain them. Add reusable interface symbols to the UI icon registry rather than inventing one-off SVGs or emoji in product screens.
