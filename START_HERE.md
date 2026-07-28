# Neon Wreckers: Start Here

**Status:** Mandatory repository entry point  
**Applies to:** Every human, AI assistant, coding agent, reviewer, and automation that plans or changes this repository

Do not plan, edit, generate, refactor, commit, deploy, or recommend implementation work until this startup sequence is complete.

## Mandatory Startup Sequence

Read these sources in order:

1. `docs/PRIME_DIRECTIVE.md`
2. `docs/CHAT_HANDOFF_PROTOCOL.md`
3. `docs/PROJECT_STATUS.md`
4. `docs/CURRENT_TASK.md`
5. The phase document named by `CURRENT_TASK.md`
6. `docs/handoffs/LATEST.md`
7. The latest repository state, recent commits, and the diff relevant to the current task
8. The source files, tests, configuration, and documentation directly related to the current task

Conversation memory is not authoritative. The repository is the source of truth.

## Required Startup Confirmation

Before implementation begins, the active worker must be able to state:

- Current phase
- Current task ID and objective
- Allowed files and systems
- Forbidden changes
- Required validation
- Most recent completed work
- Known risks or blockers
- Expected stopping point

If any answer is missing, stale, contradictory, or unsupported by the repository, stop implementation and repair the project-control documents first.

## Instruction Authority

When instructions conflict, follow this order:

1. User instructions for the current task
2. `docs/PRIME_DIRECTIVE.md`
3. Active phase document
4. `docs/CURRENT_TASK.md`
5. `docs/CHAT_HANDOFF_PROTOCOL.md`
6. `docs/PROJECT_STATUS.md`
7. `docs/handoffs/LATEST.md`
8. Older plans, archived documents, previous chat statements, and assumptions

A lower-authority source must never silently override a higher-authority source.

## Work Rules

- Use one clear objective per chat.
- Do not begin work outside `CURRENT_TASK.md`.
- Do not redesign, rebalance, or add features during cleanup tasks.
- Record useful side ideas in a deferred-work section instead of implementing them.
- Keep commits small, intentional, and limited to the active scope.
- Preserve server authority, accessibility behavior, player data, security boundaries, and deployment stability.
- Never place arbitrary executable code inside uploaded content or mod packs.
- Do not claim validation that was not actually run.

## Missing or Stale Control Files

If a required control file is missing or stale:

1. Do not guess the project state.
2. Inspect the latest repository and recent commits.
3. Reconstruct the current state from evidence.
4. Update the control file.
5. Commit the repaired documentation separately when practical.
6. Restart the startup sequence.

## End-of-Work Sequence

Before closing a work unit:

1. Review the diff for unrelated changes.
2. Run the validation required by the current task.
3. Commit only the intended scope.
4. Update `docs/PROJECT_STATUS.md`.
5. Update or replace `docs/CURRENT_TASK.md`.
6. Update `docs/handoffs/LATEST.md`.
7. Run the new-chat check in `docs/CHAT_HANDOFF_PROTOCOL.md`.
8. Clearly tell the user when the next objective should begin in a new chat.

## Standard New-Chat Prompt

Use this prompt when starting the next development chat:

> Pull the latest `main` branch of `crazytaxzi/Neon_Wreckers_TTV_Overlay`. Read `START_HERE.md` and every file it requires before planning or changing anything. Reconstruct the current state from the repository, confirm the active task and boundaries, then continue only that task.
