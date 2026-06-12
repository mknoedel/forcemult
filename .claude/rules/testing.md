---
description: Centralized tests/ layout, 80% coverage gate, testing patterns
globs: tests/**,app/**,lib/**
---

# Testing & Quality (applies when editing `tests/**` or any source)

- **TDD is Law**: see `.claude/rules/tdd.md`.
- **Centralized layout**: tests live in `tests/`, mirroring the source tree —
  `tests/unit/` (unit/component, mirrors `app/`) and `tests/integration/` (API/cross-module).
  This project does **not** colocate tests next to source.
- **Coverage gate**: Jest enforces **80%** (branches/functions/lines/statements) — see
  `jest.config.js`. The pre-push hook runs the full suite before any push.
- **Performance**: prefer single-file runs during development
  (`npm test tests/unit/app/page.test.tsx`); run the whole suite after medium tasks.
- **Unit tests**: focus on critical functionality. Mock dependencies until built. Test valid,
  invalid, and edge-case data. No interdependencies between tests; group with `describe`.
- **Component tests**: use React Testing Library to test user interactions, props, loading,
  and error states.
- **Integration tests**: exercise API endpoints across the full request/response cycle.
- **Naming**: match the implementation — `app/utils/foo.ts` → `tests/unit/test_foo.test.ts`
  (both `name.test.tsx` and `test_name.test.tsx` styles exist and are accepted).
