# Event presentation metadata

The API owns canonical event presentation. Browser clients must use `presentation.severity`, `presentation.category`, `presentation.priority`, and `presentation.breaking` when present rather than classifying current events from English title or body text.

## Contract

`EventPresentation` contains:

- `severity`: `positive`, `info`, `viewer`, `warning`, or `critical`
- `category`: stable domain category
- `priority`: integer from 0 through 100
- `breaking`: deterministic breaking-news decision
- optional `iconKey` and `visualKey`
- optional `localizationKey`
- optional `fallbackText`

The schema is strict so identity-bearing or arbitrary fields cannot leak into presentation metadata.

## Ownership and compatibility

`apps/api/src/services/event-presentation.ts` is the canonical server classifier. History responses and station alerts are enriched at the API boundary, including records created by older producers. This avoids a destructive database migration while making all newly delivered events explicit and deterministic.

Persisted legacy rows do not contain presentation metadata. The overlay retains a conservative keyword fallback only when `presentation` is absent. New clients must prefer server metadata. Future producers should use stable domain categories and explicit alert severities; they must not depend on client-side English keyword matching.

## Localization

`localizationKey` is stable and optional during the compatibility window. `fallbackText` keeps current clients readable before localized catalogs exist.

## Producer inventory

History producers currently exist in salvage, EventSub, fleet, worker runtime events, station maintenance, admin operations, construction, player progression, and expeditions. Station alerts originate from runtime-event actions. Central enrichment covers these producers consistently while they are incrementally converted to write metadata directly when persistence is extended.
