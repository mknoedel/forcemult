---
description: Strict TS, path aliases, naming, Next.js default-export rules
globs: '**/*.ts,**/*.tsx'
---

# TypeScript & Naming (applies to `**/*.ts`, `**/*.tsx`)

- **Strict mode**: always use TypeScript in strict mode (`tsconfig.json`).
- **Path aliases**: use `@/...` imports (e.g. `@/components/ui/button`), not deep relative
  paths.
- **Type imports**: use explicit `type` imports — `import type { Task } from '@/types'`.
- **Import order**: keep consistent ordering, managed by the linter.
- **Explicit return types** on API route handlers (e.g. `Promise<NextResponse>`).
- **Next.js 16 params**: dynamic route params are `Promise<{ id: string }>` — `await` them.
  `cookies()` is async — `await` it.
- **Supabase empty containers**: use `Record<string, never>` for empty schema containers
  (Views/Functions/Enums/CompositeTypes) in `types/supabase.ts`.

## Naming conventions

- **Directories**: `lowercase-with-dashes` (e.g. `components/auth-wizard`).
- **Components / Types / Interfaces**: `PascalCase`.
- **Variables / Functions**: `camelCase`.
- **Constants**: `UPPER_CASE`.
- **Test files**: mirror the implementation — `app/utils/foo.ts` → `tests/unit/test_foo.test.ts`.

## Exports — named vs default

Prefer **named exports** in `lib/` and `components/` (greppable, refactor-friendly; avoid
default exports there). **Exception — Next.js App Router entrypoints** require a **default
export** and must keep it: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`,
`not-found.tsx`, `template.tsx`, and `default.tsx`. The root `proxy.ts` (Next.js 16, formerly
`middleware.ts`) uses a named `proxy` export. Route handlers
(`route.ts`) use named method exports (`GET`, `POST`, …). The ESLint config is intentionally
Next.js-aware and does **not** ban default exports.
