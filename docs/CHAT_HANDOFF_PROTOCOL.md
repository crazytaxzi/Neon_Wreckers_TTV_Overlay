# Neon Wreckers Chat Handoff Protocol

**Status:** Authoritative workflow document  
**Applies to:** All AI-assisted development, refactoring, testing, deployment, documentation, and project-management work in this repository  
**Parent authority:** `docs/PRIME_DIRECTIVE.md`

## 1. Purpose

This protocol defines when work should stop in the current chat, how a clean handoff must be prepared, and how the next chat must reconstruct the project state without relying on conversational memory.

The repository is the source of truth. Chat history is supporting context only.

## 2. Core Rule

Use one clear objective per chat.

A phase may require several chats. Do not run the entire project in one continuous conversation. Do not create a new chat for every tiny edit. The preferred boundary is a completed, validated, and committed work unit.

## 3. Mandatory New-Chat Check

Run this check before starting a new major task and at the end of every completed work unit.

A new chat is required when any of the following is true:

- The current objective is complete.
- The next task has a different primary objective.
- The next task belongs to a different phase or sprint.
- A clean commit has created a natural stopping point.
- The next task requires inspecting a substantially different part of the repository.
- Important assumptions, architecture decisions, or allowed scope have changed.
- The current conversation contains conflicting, stale, abandoned, or superseded directions.
- The conversation has become long enough that accurately tracking scope, decisions, or repository state is becoming unreliable.
- A failure, rollback, or redesign changes the planned path forward.
- The current task cannot continue safely without a fresh audit of the latest repository state.

A new chat is not required only because a fixed number of messages has been reached.

## 4. Preferred Stopping Point

The safest stopping point is after all of the following are true:

- The current task is complete or formally paused.
- Relevant validation has been run.
- The diff has been reviewed for unrelated changes.
- Documentation has been updated.
- The intended files have been committed.
- The commit identifier has been recorded.
- The next task has been defined without beginning implementation.

Do not begin the next objective merely to use the remaining conversation.

## 5. Required Announcement

When a new-chat boundary is reached, the assistant must clearly state:

> This is a good new-chat boundary. The current work unit is complete or safely paused. Continuing with the next objective in this chat would increase the risk of scope drift or stale assumptions.

The assistant must then provide a ready-to-paste handoff prompt for the next chat.

## 6. Repository Handoff Files

The project should maintain the following files as the work progresses:

- `docs/PRIME_DIRECTIVE.md` - permanent project authority and non-negotiable rules.
- `docs/PROJECT_STATUS.md` - current phase, completed phases, active risks, and overall progress.
- `docs/CURRENT_TASK.md` - exactly one active task, its scope, restrictions, and validation requirements.
- `docs/sprints/` - phase and sprint plans with measurable acceptance criteria.
- `docs/handoffs/` - completed task handoffs and recovery notes.
- `docs/decisions/` - accepted architectural decision records.

If one of these files does not yet exist, create it when it becomes necessary rather than keeping equivalent information only in chat.

## 7. Required Handoff Record

Before ending a work chat, create or update a handoff record containing:

```text
Date:
Repository:
Branch:
Starting commit:
Ending commit:
Current phase:
Current sprint:
Completed objective:
Files changed:
Behavior changed:
Behavior deliberately preserved:
Validation performed:
Validation results:
Known risks or failures:
Deferred ideas:
Rollback method:
Next objective:
Allowed scope for next objective:
Forbidden scope for next objective:
Required reading for next chat:
```

Never describe a validation step as completed unless it was actually run successfully.

## 8. Ready-to-Paste Next-Chat Prompt

Every handoff should include a prompt following this format:

```text
You are continuing work on crazytaxzi/Neon_Wreckers_TTV_Overlay.

Before changing code:
1. Read docs/PRIME_DIRECTIVE.md.
2. Read docs/CHAT_HANDOFF_PROTOCOL.md.
3. Read docs/PROJECT_STATUS.md if it exists.
4. Read docs/CURRENT_TASK.md if it exists.
5. Read the latest relevant file in docs/handoffs/.
6. Inspect the current repository state and verify the listed commit.
7. Do not rely on prior chat memory when it conflicts with repository files.

Current phase:
[phase]

Completed work:
[completed work]

Last verified commit:
[commit]

Next objective:
[one objective]

Allowed scope:
[allowed files and systems]

Forbidden scope:
[explicit exclusions]

Required validation:
[tests, typecheck, build, migration checks, or manual verification]

Stop and prepare another handoff when this objective is complete or when the New-Chat Check requires it.
```

## 9. Start-of-Chat Reconstruction

At the beginning of every implementation chat, the assistant must:

1. Read the Prime Directive.
2. Read this protocol.
3. Read the current phase, task, decision, and handoff files relevant to the objective.
4. Inspect the actual latest repository state.
5. Confirm the branch and commit being used.
6. Compare the requested work against the allowed and forbidden scope.
7. Identify the exact validation needed before making changes.

If repository state disagrees with the handoff, the repository wins and the discrepancy must be documented.

## 10. Scope Discipline During a Chat

At any time, the assistant must be able to state:

- What task is active.
- Why the task is being performed.
- Which files or systems are allowed to change.
- Which files or systems must not change.
- How completion will be proven.
- What condition will trigger the next handoff.

Ideas discovered outside the active objective must be recorded under deferred work. They must not be implemented unless they are required to complete the active objective safely.

## 11. Commit and Validation Rule

Prefer small, single-purpose commits.

Before declaring a work unit complete:

- Review the final diff.
- Remove unrelated edits.
- Run the most relevant available checks.
- Record any checks that could not be run and the exact reason.
- Confirm that current gameplay, accessibility, security, and deployment behavior remain preserved unless the task explicitly authorized a change.
- Record the commit hash in the handoff.

A vague commit such as `cleanup`, `updates`, or `various fixes` is not an acceptable project boundary.

## 12. Emergency Handoff

If work must stop because of a failed build, broken migration, unavailable dependency, connector failure, conflicting requirements, or unsafe repository state, do not pretend the task is complete.

Create an emergency handoff containing:

- The last known safe commit.
- The exact command or action that failed.
- The relevant error output.
- Files modified but not validated.
- Whether changes were committed, reverted, or left uncommitted.
- The safest next diagnostic step.
- Actions that must not be attempted until the failure is understood.

## 13. Phase Completion Gate

A phase is complete only when:

- Every required sprint or work unit is complete.
- Acceptance criteria are satisfied.
- Relevant tests and builds pass.
- Documentation reflects the implemented architecture.
- Known risks are recorded.
- Rollback procedures are documented.
- `docs/PROJECT_STATUS.md` marks the phase complete.
- The next phase has a defined objective but implementation has not silently begun.

Phase completion always creates a new-chat boundary.

## 14. Final Authority

When conversational instructions, remembered plans, temporary notes, and repository documentation disagree, use this order of authority:

1. The user's latest explicit instruction.
2. `docs/PRIME_DIRECTIVE.md`.
3. Accepted records in `docs/decisions/`.
4. The active phase or sprint document.
5. `docs/CURRENT_TASK.md`.
6. The latest verified handoff record.
7. Earlier chat history.

Any conflict that materially changes scope must be documented before implementation continues.
