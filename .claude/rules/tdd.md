---
description: TDD is the law — tests before implementation
globs: app/**,lib/**,tests/**
---

# TDD — The Law (applies to all feature work)

**EVERY feature request or code change MUST start by writing tests _before_ any
implementation. This is the most important rule. There are no exceptions for feature work.**
Mechanically reinforced: the pre-commit hook (`scripts/check-test-colocation.js`) blocks
staged source modules that have no matching test in `tests/`.

## Pre-Implementation Checklist

Before writing ANY implementation code, verify:

- [ ] Have I written failing tests that define success?
- [ ] Have I run those tests to confirm they're RED?
- [ ] Can I describe what "passing" looks like in concrete assertions?

If ANY answer is "no" → STOP and write tests first.

## TDD Process — ALWAYS FOLLOW

1. **Red Phase (REQUIRED FIRST STEP)**
   - Your FIRST response to a feature request MUST be: _"Let me start by writing the tests
     that define what success looks like for this feature."_
   - Write comprehensive failing tests in the `tests/` directory.
   - Run tests to confirm they fail (shows "red"). This proves the test works.
2. **Green Phase**
   - Implement the **simplest possible code** in `app/`/`lib/` that makes the tests pass.
   - Run tests to confirm they now pass (shows "green").
3. **Refactor Phase**
   - Clean up and optimize implementation and test code without changing behavior.
   - Run tests after each refactor to ensure nothing is broken.
4. **Finalization Phase**
   - Run the full suite: `npm test`
   - Validate coverage stays over the 80% gate: `npm run test:coverage`

## Correct TDD Pattern

```
User: "Add streaming tracing support"
Assistant: "Following TDD - I'll write tests first to define what success looks like."
Assistant: *Creates tests/unit/test_streaming_tracing.test.ts*
Assistant: *Runs tests - shows RED (failing)*
Assistant: *NOW creates app/utils/streaming-tracer.ts*
Assistant: *Runs tests again - shows GREEN (passing)*
```

## Red Flags (stop and correct)

- Writing implementation code before a failing test exists.
- Theorizing about a fix without a failing test that reproduces it.
- Merging an unverified fix.
