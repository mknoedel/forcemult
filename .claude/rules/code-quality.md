---
description: 300-line limit, complexity triggers, doc sync, logging
globs: app/**,components/**,lib/**,types/**,scripts/**
---

# Code Quality (applies to all source)

## Hard limits (mechanically enforced)

- **File size**: max **300 lines** for source in `app/`, `components/`, `lib/`, `types/`.
  The pre-commit hook (`scripts/check-file-sizes.js`) blocks commits that exceed it.
  Test files (`*.test.*`/`*.spec.*`) and `*.d.ts` are exempt. When a file approaches the
  limit, extract cohesive pieces into sibling modules.
- **Function length**: keep functions under ~50 lines; break larger ones into smaller,
  named helpers.

## Refactor triggers

Refactor when you hit any of: more than 5 nested conditionals, more than 3 try/catch blocks
in one function, more than 10 imports in a module, or repeated copy-pasted patterns.

## Documentation sync (HARD RULE)

Any commit that adds, removes, or renames a file in `app/`, `components/`, `lib/`, `types/`,
or `scripts/` should keep CLAUDE.md current. The pre-commit hook auto-regenerates the
`<!-- AUTO:tree -->` / `<!-- AUTO:modules -->` sections (`scripts/generate-docs.js`) and
`scripts/validate-docs.js` warns if docs drift. Do not hand-edit the AUTO sections.

## Logging, Monitoring & Error Handling

- **Structured logging**: use the centralized logger in `lib/logger.ts`
  (`logger.error/warn/info/debug`, structured JSON, `LOG_LEVEL`-controlled) instead of
  scattered `console.log`. It is the single sanctioned place that writes to the console.
- **Monitoring**: expose health-check endpoints (e.g. `/api/health`) for services.
- **Error handling**: use Next.js `error.tsx` boundaries and React Error Boundaries; add
  retry logic for network calls; gracefully handle `loading.tsx`, error, and empty states;
  validate and sanitize all inputs at API boundaries.
