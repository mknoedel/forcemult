# Apply Studio Bauhaus Design System to All Pages — Design

**Date:** 2026-06-04
**Status:** Approved

## Context

The home page, `Navigation`, footer, design tokens (`app/globals.css`),
`tailwind.config.js`, fonts (`app/layout.tsx`), and a dark-mode toggle were
already redesigned into the **"Studio Bauhaus"** direction: warm cream surfaces,
Northwestern Purple (`#4E2A84`) primary, a gold/coral/teal accent trio, hard
offset shadows (`shadow-hard*`) with 2px ink borders, friendly rounded corners,
and a three-font stack (Bricolage Grotesque display, Hanken Grotesk body,
Instrument Serif italic accent).

This work applies that same language to the remaining pages so the app reads as
one cohesive product. The `/design` page is the priority — it documents the
design system, so it must both look like the system and describe it accurately.

## Decisions (from brainstorming)

- **Semantic status colors → hybrid mapping.** Keep a "good = green-ish" signal
  while staying on-brand:
  - Pass / success / coverage ≥ 80% → **teal**
  - Warning / medium / coverage 60–79% → **gold**
  - Fail / error / coverage < 60% → **destructive**
  - Task priority: high → **coral**, medium → **gold**, low → **teal**
    (all with `border-2 border-foreground`)
- **`/design` = full studio showcase.** Becomes a living example: studio hero,
  bordered hard-shadow cards, display/serif fonts, new gold/coral/teal swatches,
  and documentation of the 3-font stack (replacing stale "Inter" references).
- **Rollout: all pages in one pass**, then a single review.
- **Approach: direct per-page restyle** (matching how the home page was built),
  with the one repeated `studioCard` class string extracted to a shared constant.
  No `PageShell` / `Badge`-variant / `lib/status-styles` abstractions (YAGNI for a
  student template).

## Shared mechanics (every page)

- Outer wrapper: `min-h-screen bg-background` (drop all
  `bg-gradient-to-br from-purple-50 …` gradients).
- Content wrapper: `mx-auto w-full max-w-content px-6 md:px-9` so every page
  aligns with the nav and home (1200px, 36px desktop gutters).
- Page header: `font-display text-4xl/5xl font-extrabold tracking-tight`, optional
  `font-serif italic` accent word + muted subhead — same pattern as the home hero.
- Cards: studio treatment — `border-2 border-foreground rounded-2xl shadow-hard`;
  interactive cards also get the hover translate, static info cards keep
  border+shadow without hover.
- Errors: hard-coded `bg-red-50` / `text-red-800` → destructive tokens
  (`border-destructive/40 bg-destructive/10 text-destructive`).
- Replace any `text-gray-*` with `text-foreground` / `text-muted-foreground`.
- **Heading/label text stays byte-identical** (e.g. `🤖 LLM Agent Chat`,
  `Passing`/`Failing`, `Tasks (n)`, priority words `high`/`medium`/`low`, chart
  titles, `--primary`, `bg-primary`) so existing page tests keep passing.

## Per-page plan

1. **`/design` (full showcase)** — `app/design/page.tsx` + components:
   - Studio hero (display title + serif accent + muted subhead), `bg-background`,
     `max-w-content`.
   - `ColorTokens.tsx`: add gold / coral / teal (+ `*-foreground`) swatches.
   - `TypeAndShapeSection.tsx`: rewrite font docs for the 3-font stack; show
     real `font-display` / `font-sans` / `font-serif` samples.
   - `ComponentGallery` / `ConceptsSection` / `EnforcementSection` /
     `AddComponentGuide`: studio card styling + display headings.
   - Preserve the `--primary` / `bg-primary` doc text the test asserts.
2. **login + signup** (`app/login/page.tsx`, `app/signup/page.tsx`) — `bg-background`;
   auth card → studio bordered hard-shadow card with the geometric logo mark +
   display title; destructive error box. Keep `Sign in` / `Sign up` button text.
3. **tasks** (`app/tasks/page.tsx`, `app/components/tasks/*`) — studio header/form
   card; `TaskItem` priority badges → coral/gold/teal, delete → destructive,
   `hover:shadow-hard-sm` (keep `line-through` + `high/medium/low` text);
   `StudentsInfoCard` gray→foreground + studio card.
4. **charts** (`app/charts/page.tsx`) — studio header + bordered chart cards; chart
   series already read the new `--chart-*` palette (recolors for free). Keep chart
   titles.
5. **chat** (`app/chat/page.tsx`) — studio header (emoji heading text preserved) +
   bordered chat card; bubbles already token-based.
6. **test-dashboard** (`app/test-dashboard/page.tsx` + components) — studio header;
   `TestSummaryCard` / `CoverageCard` / `TestSuiteList` status colors → hybrid
   mapping; gray→foreground. Keep `Passing`/`Failing`/percentage label text.

## Testing & verification

- Pure visual refactor: no new behavior, no new modules, no new dependencies →
  no new tests required (refactoring with existing coverage, TDD-exempt per
  CLAUDE.md). All existing tests must stay green.
- After implementation: `npm test`, `npm run validate` (type-check + lint, 0
  errors), `npm run design:lint` (0 errors).
- Dark mode comes for free (everything uses tokens).
- Respect the 300-line file limit and ~50-line function guideline; extract if a
  file grows past the limit.

## Out of scope

- Layout or behavior changes; new dependencies; `Badge`-variant / `PageShell` /
  `lib/status-styles` abstractions; touching the already-shipped home page,
  nav, tokens, or fonts beyond what these pages need.
