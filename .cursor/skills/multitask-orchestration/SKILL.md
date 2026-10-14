---
name: multitask-orchestration
description: Protocol for running a multi-package task with parallel subagents in one workspace (Cursor Multitask). Use when a prompt defines phases and packages, or when work must be split across subagents.
---
# Multitask orchestration (RuleDesk)

Project rules: .cursorrules and .ai/LESSONS.txt apply in full. This skill only defines the orchestration protocol; the task prompt defines packages, files, and phases.

## Orchestrator
- Run packages strictly by phase. Packages inside a phase run in parallel (queue if the parallel limit is lower). The next phase starts only after the gate of the previous one.
- Every file belongs to exactly one package per phase. Resolve HANDOFFs between phases: assign to the next phase owner or do it yourself.
- Gate per phase:
  1. npm run typecheck and npm run lint are green;
  2. npm test (one process, only between phases);
  3. HANDOFFs resolved;
  4. one commit per package: git add only that package's files; message in repo history style ("Fix …", "Add …", "Remove …").
- Commits at gates are authorized by this protocol; no checkpoint prompt is needed. Push and PR only at the end.
- master is protected: work in the task branch, finish with git push -u origin <branch> and gh pr create --base master. Never --no-verify. Never merge; the user merges after manual checks.
- Final report (Definition of Done):
  - git log origin/<branch> -1 --oneline;
  - git status -sb;
  - full git diff --name-only origin/master...HEAD;
  - commits per package;
  - consolidated MANUAL-CHECK list;
  - open HANDOFFs.

## Subagent
- Trace first: read your files and listed dependencies before editing. Line numbers in prompts are hints.
- Edit ONLY files owned by your package. Need another file → do not touch it; report under HANDOFF (file, what, why).
- Forbidden:
  - git commit, rebase, stash, checkout, push;
  - npm install, npm test and any test:* script (with-node-sqlite rebuilds better-sqlite3 and breaks parallel agents);
  - npm run build;
  - editing package.json, lockfiles, .cursorrules, .ai/LESSONS.txt, docs/*, or existing files in drizzle/.
- Allowed: npm run typecheck, npm run lint. Errors in files you do not own: report, do not fix.
- Report format:
  - files read (short);
  - changes per file;
  - HANDOFF;
  - LESSONS-CANDIDATES ("Problem -> Root Cause -> Invariant Rule");
  - MANUAL-CHECK (anything that needs a live Electron instance or a copy of a real database).
