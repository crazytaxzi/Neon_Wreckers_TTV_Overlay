# Assets

## Purpose

`manifest.json` is the canonical registry of visual keys referenced by content and server-created entities. Sprint 1 does not change artwork; the manifest records existing replaceable visual identities.

## Architecture

Game records refer to stable keys rather than deployment paths. Current visuals are implemented by the existing clients and CSS. The manifest provides type, tags, and accessible alt text.

## Dependencies

Items, wrecks, modules, ships, and currency visuals depend on manifest keys. `npm run test:content` rejects missing, duplicate, or unused keys.

## Extension points

Add a unique kebab-case key and alt text before using a visual in content or code. Preserve old keys when existing durable records may still reference them.
