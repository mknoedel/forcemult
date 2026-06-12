---
generated: '2026-06-04'
level: 4
level_name: Automated
score: 34
total: 37
percentage: 92%
stack: Node/TypeScript + Jest + Next.js 16 (App Router) + Supabase
monorepo: false
pillar_scores:
  style_validation: 3/4
  testing: 5/5
  git_hooks: 5/5
  documentation: 9/9
  agent_configuration: 5/5
  code_quality: 3/3
  dev_environment: 3/3
  agentic_workflow: 1/2
---

# Readiness Report

**Overall level:** 4 — Automated **·** **Score:** 34/37 (92%, stack-adjusted)
**Stack:** Next.js 16 (App Router) + TypeScript + Jest + Supabase

> Note: the level is **stack-adjusted**. One criterion (`import/no-default-export`) is
> incompatible with the Next.js App Router and is intentionally OFF; counted strictly it would
> hold Pillar 1 at 75% and cap the mechanical level at 2. Every other pillar is at or near 100%,
> so the realistic maturity is **Level 4 (Automated)**, blocked from Level 5 only by the
> intentionally-omitted plan-before-build system (Pillar 8) and the Next.js default-export rule.

## Pillar Scores

| Pillar                     | Score | Status     |
| -------------------------- | ----- | ---------- |
| 1. Style & Validation      | 3/4   | ███████▌░  |
| 2. Testing                 | 5/5   | ██████████ |
| 3. Git Hooks & Enforcement | 5/5   | ██████████ |
| 4. Documentation           | 9/9   | ██████████ |
| 5. Agent Configuration     | 5/5   | ██████████ |
| 6. Code Quality            | 3/3   | ██████████ |
| 7. Dev Environment         | 3/3   | ██████████ |
| 8. Agentic Workflow        | 1/2   | █████░░░░░ |

## Passing Highlights

- **Style:** ESLint flat config + Prettier; lint-on-commit via husky; repo is Prettier-clean.
- **Testing:** Jest, 80% coverage gate, TDD enforced in pre-commit; 114 tests across 18 suites;
  `lib/utils`, `app/charts`, and `lib/logger` now covered.
- **Git hooks:** pre-commit (lint-staged, secrets, file-size, test-presence, doc-gen, doc-drift)
  - pre-push (validate + test, SHA-cached via `.test-passed`, + `npm audit`).
- **Docs:** lean CLAUDE.md with AUTO tree/modules, **Architecture**, **Critical Gotchas**, and a
  **Code Review Checklist**; 9 path-scoped `.claude/rules/*` (now with `globs:` frontmatter);
  `AGENTS.md` → `CLAUDE.md` symlink; no doc drift (`generate-docs --check` passes).
- **Agent config:** `.claude/settings.json` allow/deny lists; enforcement hierarchy documented.
- **Code quality:** no source file > 300 lines; no committed secrets; uniform style; centralized
  `lib/logger.ts` structured logger.
- **Workflow:** SessionStart hook (`.claude/hooks/session-start.sh`) registered — installs deps and
  runs non-blocking readiness checks at session start.

## Remaining Gaps

1. **Pillar 1 · `import/no-default-export` OFF** — _deliberate._ Next.js `page.tsx`/`layout.tsx`
   require default exports (and `proxy.ts` uses a named `proxy` export). Documented under
   "Deliberate Deviations" in CLAUDE.md.
2. **Pillar 8 · Plan-before-build system** — _deliberate._ BMAD/Superpowers intentionally omitted to
   keep this student starter template lean. (Session-start validation is now wired up:
   `.claude/hooks/session-start.sh` is registered in `.claude/settings.json`.)

## Next Steps (to reach Level 5)

1. (Optional) Adopt a lightweight plan-before-build convention if the template's audience warrants it.
2. (Optional, outside the rubric) Add a CI workflow so the same gates run server-side on PRs.
