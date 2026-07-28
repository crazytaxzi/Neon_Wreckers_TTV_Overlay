# Neon Wreckers Project Status

**Status:** Active project ledger  
**Last updated:** 2026-07-27  
**Repository:** `crazytaxzi/Neon_Wreckers_TTV_Overlay`  
**Current phase:** Phase 1 preparation  
**Implementation state:** Phase 1 code work has not started

This file records the verified state of the project. Update it at the end of every completed work unit. Do not use it as a wish list.

## Current Objective

Prepare Neon Wreckers for a controlled conversion into a modular, data-driven game with a separate desktop management application, while preserving current gameplay, accessibility, visual identity, player data, security boundaries, and deployment stability.

The controlling objective and non-negotiable rules are defined in `docs/PRIME_DIRECTIVE.md`.

## Current Phase

Phase 1 is **Structural Cleanup and Stabilization**.

Its scope is defined in `docs/phases/PHASE_01.md`.

The immediate active task is defined in `docs/CURRENT_TASK.md`.

## Completed Project-Control Work

- Created `docs/PRIME_DIRECTIVE.md` as the authoritative project objective and rule set.
- Created `docs/CHAT_HANDOFF_PROTOCOL.md` to define chat boundaries and repository-backed handoffs.
- Created root `START_HERE.md` as the mandatory startup entry point.
- Established this project-status ledger.
- Established a current-task file, Phase 1 scope document, and latest-handoff record.
- Added a root README notice directing development work to `START_HERE.md`.

## Verified Current Architecture

The current repository is a pnpm monorepo containing:

- Player web application
- Browser-based administration console
- OBS browser overlay
- Fastify API
- BullMQ worker
- Shared packages for UI, contracts, browser access, integrations, content, and game rules
- PostgreSQL persistence
- Redis-backed queues
- Docker Compose production deployment

The API remains the authoritative runtime boundary for identity, inventory, rewards, progression, administration, and persistent game state.

## Verified Structural Problems

The current cleanup plan is based on these verified problems:

- The administration frontend is concentrated in an oversized `apps/admin/src/main.tsx` file.
- The administration API combines unrelated responsibilities in a large route module.
- Several browser-facing data types are handwritten even though shared contracts already exist.
- Shared UI styling is imported too broadly across application surfaces.
- Asset loading is split between multiple incompatible approaches.
- Crew portraits are stored inside the player application instead of a shared asset system.
- Most source-controlled game content is loaded at process startup and is not truly live-editable.
- Generic content-version activation exists, but most runtime systems still use statically imported content.
- Runtime event action execution is duplicated between the API and worker.
- Some documentation is duplicated or stale.
- The `client-theme` package appears to be a compatibility shim and remains a deletion candidate pending Phase 1 verification.

## Not Yet Implemented

The following remain planned work, not completed features:

- Live database-backed content revisions
- Runtime content cache invalidation
- Unified asset upload and asset registry
- Shared editable card templates
- Separate desktop Neon Wreckers Studio
- Scheduled content-pack activation
- Seasonal, holiday, subscriber, and one-time event packs
- Instant rollback of active content revisions
- Removal of the current browser administration console

Do not describe any item in this section as complete until repository evidence and validation support that claim.

## Known Risks

- Cleanup work can accidentally change game behavior if refactoring and feature work are mixed.
- Seed behavior may overwrite future live-edited content fields unless redesigned later.
- Static content imports currently prevent ordinary content activation from becoming live without restart.
- Running expeditions and delayed worker jobs must retain stable definitions during future content changes.
- Asset changes can break the game, admin preview, or overlay if logical keys are not validated across every client.
- Repository documentation contains stale counts and duplicated historical material that must be handled carefully rather than deleted blindly.

## Current Readiness

The project-control foundation is ready for Phase 1 kickoff.

Before code changes begin, the next work session must:

1. Follow `START_HERE.md`.
2. Verify the latest `main` branch state.
3. Run or document the baseline verification available in that environment.
4. Confirm the first Phase 1 work unit.
5. Update `docs/CURRENT_TASK.md` if the evidence requires a narrower or different scope.

## Deferred Work

Ideas discovered during Phase 1 that are not required for structural cleanup must be recorded here or in a dedicated backlog rather than implemented immediately.

Current deferred categories:

- Desktop Studio user interface design
- New game mechanics
- New ships, crew, events, rewards, or balance changes
- Holiday and seasonal content creation
- New overlay presentation features
- Native mobile applications

## Update Requirements

At the end of each completed work unit, update:

- Last-updated date
- Current phase
- Current implementation state
- Completed work
- Verified risks or blockers
- Next required work
- Deferred ideas discovered during implementation

Claims in this file must be supported by repository state, test output, deployment evidence, or explicit user decisions.
