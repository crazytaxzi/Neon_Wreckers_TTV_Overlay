# Applications

## Runtime surfaces

This folder contains five deployable applications:

- `web`: player-facing React command interface
- `admin`: Streamer Control Center and live UI component catalog
- `overlay`: transparent OBS browser source
- `api`: authoritative Fastify service
- `worker`: BullMQ expedition resolver

The three browser applications are static Vite builds. They use the current same-origin `/api` contract and the checked-in Vite proxy during development. The API remains authoritative for identity, game state, outcomes, costs, cooldowns, rewards, and persistence.

## UI ownership

`web` and `admin` compose screens from `@neon-wreckers/ui`. Their local CSS is limited to surface-specific layouts and diagrams. `overlay` keeps its specialized broadcast layout while consuming central theme defaults. New deployable browser applications must use the shared UI package rather than introducing another visual framework.

## Extension points

Add HTTP domains as focused API route and service modules, delayed work as named worker jobs, and new screens within the existing browser apps. A new deployable application or a change to routing, API contracts, persistence, or production topology requires an architecture review.
