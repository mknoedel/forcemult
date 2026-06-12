# Northwestern MMM & MPD2 Starter Template

This file is the lean entry point for agents. Detailed, path-scoped guidance lives in
`.claude/rules/` (auto-loaded when editing matching files) and longer references in `docs/`.
Mechanical enforcement (git hooks + check scripts) is the source of truth — prose guides,
hooks enforce.

## Project Overview

A **Next.js 16** starter template for Northwestern MMM and MPD2 students: TypeScript, Tailwind CSS +
shadcn/ui, Supabase (auth + data, `@supabase/ssr`), a TDD framework, and an n8n LLM streaming
chat scaffold. The app is **login-controlled** (everything outside `/login`, `/signup`,
`/auth/*` requires a session). The `/` route is a shell that students replace with their own
project.

- **Your role**: expert in TypeScript, Node.js, React, Next.js 16, Tailwind, and shadcn/ui.
- **New project? Start here**: walk through [docs/getting-started.md](docs/getting-started.md)
  (first-time setup: env, Supabase, auth, verify) — then delete it once bootstrapping is done.

---

## Essential Commands

```bash
npm run dev            # Dev server (http://localhost:3000)
npm run build          # Production build
npm run lint           # ESLint
npm run type-check     # tsc --noEmit
npm run validate       # type-check + lint (run before committing)
npm run format         # Prettier write
npm test               # Jest (unit + integration)
npm run test:coverage  # Coverage report (80% gate)
```

### Enforcement scripts (run in git hooks)

```bash
node scripts/check-secrets.js          # Block staged secrets (API keys, tokens, private keys)
node scripts/check-file-sizes.js       # Block source files over 300 lines
node scripts/check-test-colocation.js  # Block source modules without a test in tests/
node scripts/generate-docs.js          # Regenerate the AUTO sections below
node scripts/generate-docs.js --check  # CI: verify AUTO sections are current
node scripts/validate-docs.js --full   # Verify required doc sections/markers exist
```

`.claude/settings.json` pre-approves test/lint/build/format, `node scripts/*`, and safe git;
denies `rm -rf /`, force-push, hard reset, `npm publish`, and pipe-to-shell.

---

## Directory Structure

<!-- AUTO:tree -->
app/
├── api/
│   ├── chat/
│   │   └── route.ts  # Proxy the request to the n8n workflow and stream its reply back.
│   ├── client-errors/
│   │   └── route.ts  # Receives client-side crash reports and records them server-side via the
│   ├── memory/
│   │   ├── search/
│   │   │   └── route.ts  # POST /api/memory/search — run an auto graph search over the signed-in user's
│   │   └── summary/
│   │       └── route.ts  # GET /api/memory/summary — return the signed-in user's long-term memory (their
│   ├── tasks/
│   │   ├── [id]/
│   │   │   └── route.ts
│   │   └── route.ts
│   └── test-runner/
│       └── route.ts
├── auth/
│   ├── callback/
│   │   └── route.ts  # OAuth / PKCE callback. The provider redirects here with a `?code=...` which
│   ├── confirm/
│   │   └── route.ts  # Email confirmation / magic-link handler. Supabase emails a link containing a
│   └── signout/
│       └── route.ts  # Signs the user out and sends them to /login. Called by the Sign Out form in
├── charts/
│   └── page.tsx
├── chat/
│   └── page.tsx
├── components/
│   ├── chat/
│   │   ├── ChatContextPanel.tsx  # Right-hand panel with two views of the user's Zep memory:
│   │   ├── ChatMessages.tsx
│   │   └── ChatSessionSidebar.tsx
│   ├── home/
│   │   ├── AiInstructionsCard.tsx
│   │   ├── TddFrameworkCard.tsx
│   │   └── WelcomeCard.tsx
│   ├── tasks/
│   │   ├── StudentsInfoCard.tsx
│   │   └── TaskItem.tsx
│   ├── ExampleComponent.tsx
│   ├── Navigation.tsx
│   ├── OAuthButtons.tsx  # Social sign-in buttons. OAuth must be initiated from the browser because it
│   ├── PageHero.tsx  # The shared page header used at the top of every top-level page (Design, Charts,
│   ├── PageShell.tsx  # The standard page frame for every top-level content page (Design, Charts, Chat,
│   └── ThemeToggle.tsx
├── design/
│   ├── components/
│   │   ├── AddComponentGuide.tsx  # A taste of the wider shadcn registry — components that aren't installed yet
│   │   ├── ColorTokens.tsx  # The living color palette. Each swatch renders with its real token class
│   │   ├── ComponentGallery.tsx  # Live gallery of the shadcn/ui primitives that ship with this template. These
│   │   ├── ConceptsSection.tsx  # Plain-language explanation of what a design system is, what shadcn/ui is, and
│   │   ├── DesignMdSection.tsx  # Explains the open DESIGN.md format that this template's design system is
│   │   ├── EnforcementSection.tsx  # Explains, for non-technical students, why hard-coded styles create
│   │   ├── TypeAndShapeSection.tsx  # Typography scale and shape (corner radius) reference. Shows the three real
│   │   └── WhyDesignSystemsSection.tsx  # Frames the *problem* before any solution: what an interface looks like with no
│   └── page.tsx
├── login/
│   ├── actions.ts  # Email/password sign-in. Called as a form action from /login.
│   └── page.tsx
├── memory/
│   ├── components/
│   │   ├── GraphSearchExplorer.tsx  # Interactive: runs an auto graph search over the student's own Zep graph via
│   │   ├── HowWeUseZepSection.tsx  # Grounds the concepts in *this* app: how the chat page uses Zep to remember
│   │   ├── KnowledgeGraphSection.tsx  # Explains a knowledge graph in plain language: instead of storing chat logs as
│   │   ├── sample-queries.ts  # Starter queries for the graph search explorer. They're phrased the way a
│   │   ├── UserSummaryCard.tsx  # Interactive: fetches the signed-in student's long-term memory (their Zep
│   │   └── WhatIsMemorySection.tsx  # Frames the problem first: a plain chatbot forgets everything the moment a
│   └── page.tsx
├── signup/
│   └── page.tsx
├── tasks/
│   └── page.tsx
├── test-dashboard/
│   ├── components/
│   │   ├── CoverageCard.tsx
│   │   ├── TestSuiteList.tsx
│   │   └── TestSummaryCard.tsx
│   ├── page.tsx
│   └── types.ts
├── error.tsx  # Route-level error boundary. Next.js renders this when a Server/Client
├── global-error.tsx  # Global error boundary. Catches errors thrown in the root layout itself, where
├── globals.css
├── layout.tsx  # Applies the saved theme before paint (see public/theme-init.js) to
└── page.tsx
components/
└── ui/
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── chart-container.tsx
    ├── chart-context.tsx
    ├── chart-legend.tsx
    ├── chart-tooltip.tsx
    ├── chart.tsx
    ├── checkbox.tsx
    ├── input.tsx
    ├── label.tsx
    └── select.tsx  # A lightweight select built on the native `<select>` element.
lib/
├── supabase/
│   ├── client.ts  # Supabase client for use inside Client Components (`'use client'`).
│   ├── middleware.ts  # Refreshes the Supabase auth session on every request and gates access.
│   └── server.ts  # Supabase client for use on the server: Server Components, Route Handlers, and
├── zep/
│   ├── chat-memory.ts  # Fetch the user's long-term context for a thread, plus (when `userId` is
│   ├── client.ts  # Returns a Zep client when ZEP_API_KEY is set, otherwise null so the chat
│   ├── graph-search.ts  # Shared Zep helpers for the /memory learning page. Unlike the chat-memory
│   ├── identity.ts  # Map a Supabase user to the fields Zep's user.add expects.
│   └── stream-capture.ts  # A pass-through transform that accumulates the streamed assistant text and,
├── chat-history.ts  # Map stored n8n LangChain history rows into the UI message shape used by the
├── logger.ts  # Minimal structured logger. Prefer this over `console.log` so logs are
├── n8n-stream.ts  # Normalize an n8n AI Agent streaming response into a plain text token stream.
├── report-client-error.ts  # The error shape an App Router error boundary receives: a standard `Error`
└── utils.ts  # Merge Tailwind class names, resolving conflicts (later classes win).
types/
├── index.ts
└── supabase.ts  # A single LangChain message as stored in n8n_chat_histories.message.
<!-- /AUTO:tree -->

---

## Key Modules

<!-- AUTO:modules -->
| Module | Purpose | Key Exports |
|--------|---------|-------------|
| `app/error.tsx` | Route-level error boundary. Next.js renders this when a Server/Client | `Error` |
| `app/global-error.tsx` | Global error boundary. Catches errors thrown in the root layout itself, where | `GlobalError` |
| `app/layout.tsx` | Applies the saved theme before paint (see public/theme-init.js) to | `metadata`, `RootLayout` |
| `app/page.tsx` |  | `HomePage` |
| `app/api/chat/route.ts` | Proxy the request to the n8n workflow and stream its reply back. | `maxDuration`, `POST` |
| `app/api/client-errors/route.ts` | Receives client-side crash reports and records them server-side via the | `POST` |
| `app/api/memory/search/route.ts` | POST /api/memory/search — run an auto graph search over the signed-in user's | `POST` |
| `app/api/memory/summary/route.ts` | GET /api/memory/summary — return the signed-in user's long-term memory (their | `GET` |
| `app/api/tasks/route.ts` |  | `GET`, `POST` |
| `app/api/tasks/[id]/route.ts` |  | `PATCH`, `DELETE` |
| `app/api/test-runner/route.ts` |  | `POST` |
| `app/auth/callback/route.ts` | OAuth / PKCE callback. The provider redirects here with a `?code=...` which | `GET` |
| `app/auth/confirm/route.ts` | Email confirmation / magic-link handler. Supabase emails a link containing a | `GET` |
| `app/auth/signout/route.ts` | Signs the user out and sends them to /login. Called by the Sign Out form in | `POST` |
| `app/charts/page.tsx` |  | `ChartsPage` |
| `app/chat/page.tsx` |  | `ChatPage` |
| `app/components/ExampleComponent.tsx` |  | `ExampleComponent` |
| `app/components/Navigation.tsx` |  | `Navigation` |
| `app/components/OAuthButtons.tsx` | Social sign-in buttons. OAuth must be initiated from the browser because it | `OAuthButtons` |
| `app/components/PageHero.tsx` | The shared page header used at the top of every top-level page (Design, Charts, | `PageHero` |
| `app/components/PageShell.tsx` | The standard page frame for every top-level content page (Design, Charts, Chat, | `PageShell` |
| `app/components/ThemeToggle.tsx` |  | `ThemeToggle` |
| `app/components/chat/ChatContextPanel.tsx` | Right-hand panel with two views of the user's Zep memory: | `ChatContextPanel` |
| `app/components/chat/ChatMessages.tsx` |  | `ChatMessages` |
| `app/components/chat/ChatSessionSidebar.tsx` |  | `ChatSessionSidebar` |
| `app/components/home/AiInstructionsCard.tsx` |  | `AiInstructionsCard` |
| `app/components/home/TddFrameworkCard.tsx` |  | `TddFrameworkCard` |
| `app/components/home/WelcomeCard.tsx` |  | `WelcomeCard` |
| `app/components/tasks/StudentsInfoCard.tsx` |  | `StudentsInfoCard` |
| `app/components/tasks/TaskItem.tsx` |  | `TaskItem` |
| `app/design/page.tsx` |  | `metadata`, `DesignPage` |
| `app/design/components/AddComponentGuide.tsx` | A taste of the wider shadcn registry — components that aren't installed yet | `AddComponentGuide` |
| `app/design/components/ColorTokens.tsx` | The living color palette. Each swatch renders with its real token class | `ColorTokens` |
| `app/design/components/ComponentGallery.tsx` | Live gallery of the shadcn/ui primitives that ship with this template. These | `ComponentGallery` |
| `app/design/components/ConceptsSection.tsx` | Plain-language explanation of what a design system is, what shadcn/ui is, and | `ConceptsSection` |
| `app/design/components/DesignMdSection.tsx` | Explains the open DESIGN.md format that this template's design system is | `DesignMdSection` |
| `app/design/components/EnforcementSection.tsx` | Explains, for non-technical students, why hard-coded styles create | `EnforcementSection` |
| `app/design/components/TypeAndShapeSection.tsx` | Typography scale and shape (corner radius) reference. Shows the three real | `TypeAndShapeSection` |
| `app/design/components/WhyDesignSystemsSection.tsx` | Frames the *problem* before any solution: what an interface looks like with no | `WhyDesignSystemsSection` |
| `app/login/actions.ts` | Email/password sign-in. Called as a form action from /login. | `login`, `signup` |
| `app/login/page.tsx` |  | `LoginPage`, `default` |
| `app/memory/page.tsx` |  | `metadata`, `MemoryPage` |
| `app/memory/components/GraphSearchExplorer.tsx` | Interactive: runs an auto graph search over the student's own Zep graph via | `GraphSearchExplorer` |
| `app/memory/components/HowWeUseZepSection.tsx` | Grounds the concepts in *this* app: how the chat page uses Zep to remember | `HowWeUseZepSection` |
| `app/memory/components/KnowledgeGraphSection.tsx` | Explains a knowledge graph in plain language: instead of storing chat logs as | `KnowledgeGraphSection` |
| `app/memory/components/sample-queries.ts` | Starter queries for the graph search explorer. They're phrased the way a | `SAMPLE_QUERIES` |
| `app/memory/components/UserSummaryCard.tsx` | Interactive: fetches the signed-in student's long-term memory (their Zep | `UserSummaryCard` |
| `app/memory/components/WhatIsMemorySection.tsx` | Frames the problem first: a plain chatbot forgets everything the moment a | `WhatIsMemorySection` |
| `app/signup/page.tsx` |  | `SignupPage`, `default` |
| `app/tasks/page.tsx` |  | `TasksPage` |
| `app/test-dashboard/page.tsx` |  | `TestDashboard` |
| `app/test-dashboard/types.ts` |  | `TestResult`, `TestSuite`, `Coverage`, `TestSummary`, `TestRunResult` |
| `app/test-dashboard/components/CoverageCard.tsx` |  | `CoverageCard` |
| `app/test-dashboard/components/TestSuiteList.tsx` |  | `TestSuiteList` |
| `app/test-dashboard/components/TestSummaryCard.tsx` |  | `TestSummaryCard` |
| `components/ui/badge.tsx` |  | `BadgeProps`, `Badge`, `badgeVariants` |
| `components/ui/button.tsx` |  | `ButtonProps`, `Button`, `buttonVariants` |
| `components/ui/card.tsx` |  | `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription` |
| `components/ui/chart-container.tsx` |  | `ChartContainer` |
| `components/ui/chart-context.tsx` |  | `THEMES`, `ChartConfig`, `ChartContext`, `useChart`, `ChartStyle` |
| `components/ui/chart-legend.tsx` |  | `ChartLegend`, `ChartLegendContent` |
| `components/ui/chart-tooltip.tsx` |  | `ChartTooltip`, `ChartTooltipContent` |
| `components/ui/chart.tsx` |  | `ChartStyle`, `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend` |
| `components/ui/checkbox.tsx` |  | `Checkbox` |
| `components/ui/input.tsx` |  | `Input` |
| `components/ui/label.tsx` |  | `Label` |
| `components/ui/select.tsx` | A lightweight select built on the native `<select>` element. | `Select` |
| `lib/chat-history.ts` | Map stored n8n LangChain history rows into the UI message shape used by the | `UiMessage`, `historyToUiMessages` |
| `lib/logger.ts` | Minimal structured logger. Prefer this over `console.log` so logs are | `LogLevel`, `logger` |
| `lib/n8n-stream.ts` | Normalize an n8n AI Agent streaming response into a plain text token stream. | `N8N_RUN_SEPARATOR`, `createN8nTextStream` |
| `lib/report-client-error.ts` | The error shape an App Router error boundary receives: a standard `Error` | `reportClientError` |
| `lib/utils.ts` | Merge Tailwind class names, resolving conflicts (later classes win). | `cn`, `generateId`, `studioCard`, `studioCardHover` |
| `lib/supabase/client.ts` | Supabase client for use inside Client Components (`'use client'`). | `createClient` |
| `lib/supabase/middleware.ts` | Refreshes the Supabase auth session on every request and gates access. | `updateSession` |
| `lib/supabase/server.ts` | Supabase client for use on the server: Server Components, Route Handlers, and | `createClient` |
| `lib/zep/chat-memory.ts` | Fetch the user's long-term context for a thread, plus (when `userId` is | `retrieveUserContext`, `ChatTurn`, `recordChatTurn` |
| `lib/zep/client.ts` | Returns a Zep client when ZEP_API_KEY is set, otherwise null so the chat | `getZepClient` |
| `lib/zep/graph-search.ts` | Shared Zep helpers for the /memory learning page. Unlike the chat-memory | `UserMemory`, `GraphFact`, `GraphEntity`, `GraphEpisode`, `GraphSearchResult` |
| `lib/zep/identity.ts` | Map a Supabase user to the fields Zep's user.add expects. | `ZepUserFields`, `toZepUser`, `displayName` |
| `lib/zep/stream-capture.ts` | A pass-through transform that accumulates the streamed assistant text and, | `createCaptureStream` |
| `types/index.ts` |  | `ApiError` |
| `types/supabase.ts` | A single LangChain message as stored in n8n_chat_histories.message. | `Json`, `Database`, `Task`, `TaskInsert`, `TaskUpdate` |
<!-- /AUTO:modules -->

---

## Architecture

Next.js 16 App Router. A request flows:

```
Browser
  -> proxy.ts               # refreshes the Supabase session, redirects anon users to /login
  -> app/**/page.tsx (RSC)  # Server Components render using the server Supabase client
  -> app/api/**/route.ts    # Route Handlers (REST) validate input with Zod, run as the user
  -> Supabase (RLS)         # row-level security scopes every query to the signed-in user
```

- **Auth gate**: `proxy.ts` → `lib/supabase/middleware.ts` runs on every request; only
  `/login`, `/signup`, `/auth/*`, and static assets are public.
- **Two Supabase clients**: the **server** client (`lib/supabase/server.ts`, carries the
  session → RLS) for RSC / route handlers / server actions; the **browser** client
  (`lib/supabase/client.ts`) only in Client Components for reading auth state.
- **Chat**: `app/chat/page.tsx` (`useChat`) → `app/api/chat/route.ts` proxy → n8n webhook,
  streamed back token-by-token (never call n8n from the browser).
- **Layering**: `app/` (routes/UI) → `lib/` (clients/utils) → `types/`; UI composes shadcn/ui
  primitives from `components/ui/`. No upward imports (`lib/` must not import from `app/`).

---

## Rules Map (path-scoped, in `.claude/rules/`)

| When editing… | Rule |
|---------------|------|
| Any feature work | [tdd.md](.claude/rules/tdd.md) — **TDD is the law** (tests first) |
| `tests/**` / any source | [testing.md](.claude/rules/testing.md) — centralized `tests/`, 80% gate |
| Any source | [code-quality.md](.claude/rules/code-quality.md) — 300-line limit, logging, doc sync |
| `**/*.ts(x)` | [typescript.md](.claude/rules/typescript.md) — strict, naming, default-export exemptions |
| `app/**`, `components/**` (tsx) | [react.md](.claude/rules/react.md) · [ui-styling.md](.claude/rules/ui-styling.md) |
| `app/api/**` | [api.md](.claude/rules/api.md) — REST, Zod, server client |
| `lib/supabase/**`, `app/auth/**`, `proxy.ts` | [database.md](.claude/rules/database.md) — Supabase + auth |
| Anything sensitive | [security.md](.claude/rules/security.md) — RLS, secrets, input validation |

## Docs Map

| Topic | File |
|-------|------|
| First-time setup (bootstrapping) | [docs/getting-started.md](docs/getting-started.md) |
| App design system (colors, typography, components) | [DESIGN.md](DESIGN.md) |
| Supabase project + schema + auth setup | [SUPABASE_SETUP.md](SUPABASE_SETUP.md) |
| n8n LLM agent streaming chat | [docs/integrations/n8n.md](docs/integrations/n8n.md) |
| Zep knowledge-graph CLI + docs MCP | [docs/integrations/zep.md](docs/integrations/zep.md) |

---

## TDD — The Law (summary)

**EVERY feature or change starts with a failing test, before any implementation.** Red →
Green → Refactor. The pre-commit hook blocks staged source modules with no matching test.
Full rule: [.claude/rules/tdd.md](.claude/rules/tdd.md).

## Code Quality (summary)

- **300-line limit** on source in `app/`/`components/`/`lib/`/`types/` (hook-enforced; tests
  and `*.d.ts` exempt). **Functions** under ~50 lines.
- **Docs sync**: the pre-commit hook regenerates the AUTO sections above and auto-stages
  CLAUDE.md. Do not hand-edit content between `<!-- AUTO:* -->` markers.
- Full rules: [.claude/rules/code-quality.md](.claude/rules/code-quality.md).

---

## Git Hooks (husky)

| Hook | Steps |
|------|-------|
| **pre-commit** | `lint-staged` (eslint + prettier on staged) → `check-secrets` → `check-file-sizes` → `check-test-colocation` → `generate-docs` → `validate-docs` |
| **pre-push** | `validate` + `test` (SHA-cached via `.test-passed`, skipped if HEAD already passed) → `npm audit` (warn-only) → `design:lint` (warn-only) |

---

## Critical Gotchas

- **`cookies()` is async in Next 16** — `await` it; the Supabase server client is created with
  `await createClient()`. Dynamic route params are `Promise<{ id }>` — `await` them too.
- **Supabase clients are factory functions** (no module-level instantiation), so the app
  builds without credentials; a missing-env error only surfaces on first use.
- **Default exports are required** for Next.js `page.tsx`/`layout.tsx` — do NOT enable ESLint
  `import/no-default-export`. Use named exports everywhere else. (`proxy.ts` exports a named
  `proxy` function, which Next.js 16 also accepts.)
- **Dev server runs on port 3000**, host `0.0.0.0` — see the `dev` script. (Port 5000 was avoided because macOS reserves it for the AirPlay Receiver.)
- **Tailwind is pinned to v3.4.x** — do not upgrade to v4 (breaking PostCSS/config changes).
- **Google Fonts behind a TLS-intercepting proxy**: `next/font/google` fetches fonts at build
  time, which fails behind a TLS-intercepting proxy. Next.js 16 removed the
  `turbopackUseSystemTlsCerts` flag — point Node at the proxy CA instead:
  `NODE_EXTRA_CA_CERTS=/path/to/ca.pem`.
- **AUTO sections in CLAUDE.md are generated** by `scripts/generate-docs.js` (pre-commit) —
  never hand-edit between `<!-- AUTO:* -->` markers (CLAUDE.md is Prettier-ignored for this).
- **pre-push test cache**: tests are skipped if `.test-passed` already holds the current HEAD
  SHA (written by `posttest`). A new commit invalidates it automatically.

## Code Review Checklist (pre-merge)

The git hooks enforce most of this automatically; verify before opening a PR:

- [ ] Tests written first and passing (`npm test`); coverage ≥ 80% (`npm run test:coverage`).
- [ ] `npm run validate` clean (type-check + lint, 0 errors).
- [ ] No source file over 300 lines (`node scripts/check-file-sizes.js`).
- [ ] No secrets staged (`node scripts/check-secrets.js`).
- [ ] New source modules have a matching test in `tests/`.
- [ ] CLAUDE.md AUTO sections regenerated (`node scripts/generate-docs.js`); rules/docs updated
      if architecture, env vars, or API contracts changed.
- [ ] Prettier-clean (`npm run format:check`).

## Deliberate Deviations from the harness defaults

Intentional adaptations for this Next.js stack — not gaps to "fix":

- **`import/no-default-export` is OFF** — App Router entrypoints require default exports.
- **Centralized `tests/` tree** (not colocated beside source) — preserves the 80% Jest
  coverage setup; `scripts/check-test-colocation.js` validates the mirror instead.
- **Superpowers — per-environment, no local duplication** — Claude Code on the web can't use the
  interactive `/plugin` installer, so the [Superpowers](https://github.com/obra/superpowers)
  skills are **committed** under `.claude/vendor/superpowers/` (NOT auto-discovered; a mirror of
  upstream, Prettier/ESLint-ignored to stay byte-identical, refreshed by the
  `update-superpowers-skills` GitHub Action via `scripts/sync-superpowers-skills.sh`, which opens
  a **PR** — the review gate for upstream changes). On the **web**, the SessionStart hook copies
  them into `.claude/skills/` (gitignored) and injects the `using-superpowers` guidance — unless
  the user already has the plugin or a same-named skill. On **local**, the hook doesn't run, so
  nothing is materialized; users install the real plugin instead (pre-registered via
  `extraKnownMarketplaces` + `enabledPlugins` in `.claude/settings.json`), which auto-updates and
  never collides with the vendored copy.

## Working in this repo

- **Server validation**: after starting the dev server, check its output for warnings/errors
  before proceeding.
- **Library verification**: verify library versions before installing (especially CSS
  frameworks); restart the dev server fully when chasing styling issues.
- **Initial connection tests**: test auth/external API connections with small scripts before
  building major features.
- **Response style**: simple, everyday language. Don't remove existing code/comments or
  reformat unrelated code unless necessary for the change.
- **Maintenance**: update CLAUDE.md / the relevant `.claude/rules/*` when adding major
  dependencies or architectural patterns, changing structure or env vars, or changing API
  response formats or testing patterns.
