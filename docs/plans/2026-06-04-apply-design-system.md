# Apply Studio Bauhaus Design System to All Pages — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restyle every remaining page (design system → auth → tasks → charts → chat → test-dashboard) into the already-shipped "Studio Bauhaus" design language so the whole app is visually cohesive.

**Architecture:** Pure visual refactor. Swap off-theme classes (purple/blue gradients, hard-coded red/green/yellow, gray text) for design tokens; wrap pages in the shared `max-w-content` content frame; convert cards to bordered hard-shadow "studio" cards; headings to `font-display`. Semantic status colors use a **hybrid mapping**: success/pass → teal, warning/medium → gold, error/fail → destructive; task priority high → coral, medium → gold, low → teal. No behavior changes, no new dependencies.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS 3.4 (design tokens in `app/globals.css`, mapped in `tailwind.config.js`), shadcn/ui, Jest + React Testing Library.

---

## Conventions (read once, apply in every task)

**Design doc:** `docs/plans/2026-06-04-apply-design-system-design.md`.

**This is a refactor with existing coverage** (TDD-exempt per CLAUDE.md). There are
no new failing tests to write. Each task: make the edits → run the relevant
existing test(s) to confirm GREEN → `npm run validate` (and `design:lint` where the
design page changed) → commit. The whole app's tests already pass on `main`.

**Shared class strings** (added in Task 1, imported from `@/lib/utils`):

- `studioCard` → `'border-2 border-foreground rounded-2xl shadow-hard'` (static cards)
- `studioCardHover` → `studioCard` + `' transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg'` (interactive cards)

**Token cheat-sheet** (never hard-code colors — ESLint blocks hex and warns on off-theme classes):
| Old / off-theme | New token |
|---|---|
| `bg-gradient-to-br from-purple-50 to-blue-50` (and `to-indigo-100`) | `bg-background` |
| `bg-red-50 border border-red-200 text-red-800` (error box) | `border-2 border-destructive/40 bg-destructive/10 text-destructive` |
| `text-gray-700` / `text-gray-800` | `text-foreground` |
| `text-green-600` / `bg-green-50` / success | `text-teal` / `bg-teal/10` |
| `text-yellow-600` / warning / medium | `text-gold` / `bg-gold/10` |
| `text-red-600` / fail / high-error | `text-destructive` / `bg-destructive/10` |
| priority high badge | `bg-coral text-coral-foreground border-2 border-foreground` |
| priority medium badge | `bg-gold text-gold-foreground border-2 border-foreground` |
| priority low badge | `bg-teal text-teal-foreground border-2 border-foreground` |
| heading classes | prefix with `font-display` |
| `rounded-lg border bg-card` (card chrome) | `rounded-2xl border-2 border-foreground bg-card shadow-hard` |

**HARD RULE — do not change visible text.** Keep every heading/label/button string
byte-identical (e.g. `📊 Charts Example`, `🤖 LLM Agent Chat`, `Test Dashboard`,
`Tasks (n)`, `Passing`/`Failing`/`Skipped`, `high`/`medium`/`low`, `--primary`,
`bg-primary`, `Sign in`, `Sign up`). Only classNames/markup wrappers change. This is
what keeps the existing page tests green.

**File limits:** 300 lines/file, ~50 lines/function. None of these files approach the
limit after edits; if one does, extract a sub-component.

**Verification commands used throughout:**

- Single suite: `npx jest <path>`
- Full suite: `npx jest`
- Types + lint: `npm run validate`
- Design doc lint: `npm run design:lint`

---

## Task 1: Shared studio card constants

**Files:**

- Modify: `lib/utils.ts`
- Modify: `tests/unit/lib/utils.test.ts`
- Modify: `app/page.tsx` (replace its local `studioCard` const with the import)

**Step 1: Add the constants to `lib/utils.ts`**

Append after the existing `cn` export:

```ts
/**
 * Studio Bauhaus card chrome — 2px ink border + hard offset shadow.
 * Use `studioCard` for static panels, `studioCardHover` for interactive cards.
 */
export const studioCard = 'border-2 border-foreground rounded-2xl shadow-hard';

export const studioCardHover =
  studioCard +
  ' transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg';
```

**Step 2: Add a smoke test to `tests/unit/lib/utils.test.ts`**

Add inside the file (new `describe` block):

```ts
import { studioCard, studioCardHover } from '@/lib/utils';

describe('studio card classes', () => {
  it('studioCard carries the ink border and hard shadow', () => {
    expect(studioCard).toContain('border-foreground');
    expect(studioCard).toContain('shadow-hard');
  });

  it('studioCardHover extends studioCard with a hover transform', () => {
    expect(studioCardHover.startsWith(studioCard)).toBe(true);
    expect(studioCardHover).toContain('hover:shadow-hard-lg');
  });
});
```

**Step 3: Refactor `app/page.tsx` to use the shared constant**

- Add `studioCardHover` to the existing `@/lib/utils` import (currently `app/page.tsx`
  imports `cn`? It does not import from utils yet — add: `import { studioCardHover } from '@/lib/utils';`).
- Delete the local declaration:
  ```ts
  const studioCard =
    'border-2 border-foreground rounded-2xl shadow-hard transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg';
  ```
- Replace the three usages `${studioCard}` with `${studioCardHover}`.

**Step 4: Verify**

```
npx jest tests/unit/lib/utils.test.ts tests/unit/app/page.test.tsx
```

Expected: PASS. Then `npm run validate` → 0 errors.

**Step 5: Commit**

```bash
git add lib/utils.ts tests/unit/lib/utils.test.ts app/page.tsx
git commit -m "refactor: extract shared studio card classes to lib/utils"
```

---

## Task 2: Design page — hero + content frame

**Files:**

- Modify: `app/design/page.tsx`

**Step 1: Restyle the wrapper and header**

Replace the `<main>` + `<header>` block (lines 20–31) with:

```tsx
      <main className="mx-auto w-full max-w-content space-y-16 px-6 py-12 md:px-9">
        <header className="space-y-4">
          <span className="inline-flex rounded-full bg-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-background">
            ● Design System
          </span>
          <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl">
            The <span className="font-serif font-normal italic text-primary">living</span>{' '}
            style guide.
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            A guided tour of how this app stays good-looking and consistent — what a
            design system is, the colors and building blocks you have, how new
            components get added, and how it&apos;s all kept on-brand automatically.
            No experience needed.
          </p>
        </header>
```

Keep the outer `<div className="min-h-screen bg-background">` and `<Navigation />` as-is,
and the six section components below unchanged.

**Step 2: Verify**

```
npx jest tests/unit/app/design/page.test.tsx
```

Expected: PASS (it checks for `--primary` / `bg-primary` text rendered by child
sections, which are untouched). Then `npm run validate`.

**Step 3: Commit**

```bash
git add app/design/page.tsx
git commit -m "style(design): studio hero + content frame on the design page"
```

---

## Task 3: Design page — ColorTokens (add accent swatches + studio chrome)

**Files:**

- Modify: `app/design/components/ColorTokens.tsx`

**Step 1: Add the accent tokens to `SURFACE_TOKENS`**

Insert these three entries into the `SURFACE_TOKENS` array (after `destructive`, before `card`):

```ts
  {
    name: 'gold',
    swatch: 'bg-gold',
    text: 'text-gold-foreground',
    cssVar: '--gold',
    use: 'Accent — warnings & highlights',
  },
  {
    name: 'coral',
    swatch: 'bg-coral',
    text: 'text-coral-foreground',
    cssVar: '--coral',
    use: 'Accent — high priority',
  },
  {
    name: 'teal',
    swatch: 'bg-teal',
    text: 'text-teal-foreground',
    cssVar: '--teal',
    use: 'Accent — success & low priority',
  },
```

**Step 2: Apply studio chrome to the section**

- Heading (line 72): `text-2xl font-bold` → `font-display text-2xl font-bold`.
- Swatch card container (line 88): `overflow-hidden rounded-lg border bg-card` →
  `overflow-hidden rounded-2xl border-2 border-foreground bg-card shadow-hard`.
- Chart-palette container (line 108): `rounded-lg border bg-card p-4` →
  `rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard`.

Do **not** change the `bg-primary` / `--primary` / token name text — the design test
asserts on it.

**Step 3: Verify**

```
npx jest tests/unit/app/design/page.test.tsx
```

Expected: PASS. Then `npm run validate`.

**Step 4: Commit**

```bash
git add app/design/components/ColorTokens.tsx
git commit -m "style(design): add gold/coral/teal swatches + studio chrome to ColorTokens"
```

---

## Task 4: Design page — TypeAndShapeSection (3-font docs)

**Files:**

- Modify: `app/design/components/TypeAndShapeSection.tsx`

**Step 1: Replace the file contents**

```tsx
/**
 * Typography scale and shape (corner radius) reference. Shows the three real
 * typefaces — Bricolage Grotesque (display), Hanken Grotesk (body), and
 * Instrument Serif (italic accent) — and the rounding tokens used across the app.
 */
const TYPE_SAMPLES = [
  {
    label: 'Display',
    sample: 'Build something worth shipping',
    className: 'font-display text-3xl font-extrabold tracking-tight',
    note: 'font-display — Bricolage Grotesque',
  },
  {
    label: 'Heading',
    sample: 'What’s in the box',
    className: 'font-display text-2xl font-bold tracking-tight',
    note: 'font-display — Bricolage Grotesque',
  },
  {
    label: 'Serif accent',
    sample: 'worth',
    className: 'font-serif text-3xl italic text-primary',
    note: 'font-serif — Instrument Serif',
  },
  {
    label: 'Body',
    sample: 'The quick brown fox jumps over the lazy dog.',
    className: 'text-base',
    note: 'font-sans — Hanken Grotesk',
  },
  {
    label: 'Label',
    sample: 'Form label',
    className: 'text-sm font-medium',
    note: 'font-sans — Hanken Grotesk',
  },
  {
    label: 'Small',
    sample: 'Caption / metadata',
    className: 'text-xs text-muted-foreground',
    note: 'font-sans — Hanken Grotesk',
  },
];

const RADII = [
  { name: 'rounded-sm', className: 'rounded-sm' },
  { name: 'rounded-md', className: 'rounded-md' },
  { name: 'rounded-lg', className: 'rounded-lg' },
  { name: 'rounded-2xl', className: 'rounded-2xl' },
];

export function TypeAndShapeSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Typography &amp; shape
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Three typefaces work together: <strong>Bricolage Grotesque</strong>{' '}
          for display headings (
          <code className="rounded bg-muted px-1 text-foreground">
            font-display
          </code>
          ), <strong>Hanken Grotesk</strong> for body and UI (the default sans),
          and <strong>Instrument Serif</strong> for the occasional italic accent
          (
          <code className="rounded bg-muted px-1 text-foreground">
            font-serif
          </code>
          ). Reusing these keeps text uniform everywhere.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard">
          <p className="text-sm font-medium text-muted-foreground">
            Type scale
          </p>
          {TYPE_SAMPLES.map((sample) => (
            <div
              key={sample.label}
              className="flex items-baseline justify-between gap-4 border-b pb-3 last:border-0"
            >
              <span className={sample.className}>{sample.sample}</span>
              <code className="shrink-0 text-xs text-muted-foreground">
                {sample.note}
              </code>
            </div>
          ))}
        </div>

        <div className="space-y-4 rounded-2xl border-2 border-foreground bg-card p-5 shadow-hard">
          <p className="text-sm font-medium text-muted-foreground">
            Corner radius
          </p>
          <div className="flex flex-wrap gap-5">
            {RADII.map((radius) => (
              <div key={radius.name} className="text-center">
                <div
                  className={`h-20 w-20 border-2 border-primary bg-primary/10 ${radius.className}`}
                />
                <code className="mt-2 block text-xs text-muted-foreground">
                  {radius.name}
                </code>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Radii derive from a single{' '}
            <code className="text-foreground">--radius</code> value in
            globals.css; cards use{' '}
            <code className="text-foreground">rounded-2xl</code>.
          </p>
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Verify**

```
npx jest tests/unit/app/design/page.test.tsx
```

Expected: PASS. Then `npm run validate`.

**Step 3: Commit**

```bash
git add app/design/components/TypeAndShapeSection.tsx
git commit -m "docs(design): document the 3-font stack in TypeAndShapeSection"
```

---

## Task 5: Design page — remaining sections (studio chrome)

**Files:**

- Modify: `app/design/components/ConceptsSection.tsx`
- Modify: `app/design/components/ComponentGallery.tsx`
- Modify: `app/design/components/EnforcementSection.tsx`
- Modify: `app/design/components/AddComponentGuide.tsx`

**Step 1: Read each file, then apply these mechanical transforms** (content unchanged):

1. Every section heading `text-2xl font-bold` → `font-display text-2xl font-bold`.
2. Every shadcn `<Card>` or card-like container using `rounded-lg border bg-card`
   (the _outer_ card chrome only — not inline `code`/`pre` blocks) →
   `rounded-2xl border-2 border-foreground bg-card shadow-hard`.
   - For `<Card>` components, pass the chrome via `className`: e.g.
     `<Card className="border-2 border-foreground rounded-2xl shadow-hard">` (import
     `studioCard` from `@/lib/utils` and use `className={studioCard}` if cleaner).
3. `CardTitle` text → add `font-display` to its `className`.
4. Leave token-based accents (`bg-primary/10`, `border-destructive/40`, etc.) and all
   `code`/`pre` blocks as-is.

Do not change any visible text (the design test reads specific strings from
ConceptsSection/EnforcementSection).

**Step 2: Verify**

```
npx jest tests/unit/app/design/page.test.tsx
npm run validate
npm run design:lint
```

Expected: tests PASS, validate 0 errors, design:lint 0 errors.

**Step 3: Commit**

```bash
git add app/design/components/ConceptsSection.tsx app/design/components/ComponentGallery.tsx app/design/components/EnforcementSection.tsx app/design/components/AddComponentGuide.tsx
git commit -m "style(design): studio chrome on remaining design-page sections"
```

---

## Task 6: Login page

**Files:**

- Modify: `app/login/page.tsx`

**Step 1: Apply edits**

- Outer wrapper (line 23):
  `min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-6`
  → `flex min-h-screen items-center justify-center bg-background px-6`.
- Card (line 24): `<Card className="w-full max-w-md">` →
  `<Card className="w-full max-w-md border-2 border-foreground rounded-2xl shadow-hard">`.
- Above `<CardHeader>`, add the geometric logo mark + display title. Replace the
  `<CardHeader>` block with:

```tsx
<CardHeader className="space-y-3">
  <span className="relative block h-8 w-8" aria-hidden="true">
    <span className="absolute left-0 h-8 w-4 rounded-l-full bg-primary" />
    <span className="absolute right-0 top-0 h-4 w-4 bg-coral" />
    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-br-full bg-gold" />
  </span>
  <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
    Sign in
  </CardTitle>
  <CardDescription>Welcome back. Sign in to continue.</CardDescription>
</CardHeader>
```

- Error box (line 31):
  `p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800`
  → `rounded-xl border-2 border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive`.
- Keep the `Sign in` button text and form unchanged.

**Step 2: Verify**

```
npx jest tests/unit/app/login.test.tsx
```

Expected: PASS (asserts the `Sign in` button + form fields). Then `npm run validate`.

**Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "style(login): studio auth card with logo mark + destructive error"
```

---

## Task 7: Signup page

**Files:**

- Modify: `app/signup/page.tsx`

**Step 1: Apply the same edits as Task 6**, adapted to signup:

- Outer wrapper (line 23) → `flex min-h-screen items-center justify-center bg-background px-6`.
- Card (line 24) → add `border-2 border-foreground rounded-2xl shadow-hard`.
- Replace `<CardHeader>` with the logo-mark + display-title block (title text stays
  `Create an account`, description stays `Sign up to get started.`):

```tsx
<CardHeader className="space-y-3">
  <span className="relative block h-8 w-8" aria-hidden="true">
    <span className="absolute left-0 h-8 w-4 rounded-l-full bg-primary" />
    <span className="absolute right-0 top-0 h-4 w-4 bg-coral" />
    <span className="absolute bottom-0 right-0 h-4 w-4 rounded-br-full bg-gold" />
  </span>
  <CardTitle className="font-display text-2xl font-extrabold tracking-tight">
    Create an account
  </CardTitle>
  <CardDescription>Sign up to get started.</CardDescription>
</CardHeader>
```

- Error box (line 31) → `rounded-xl border-2 border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive`.
- Keep the `Sign up` button text unchanged.

**Step 2: Verify**

```
npx jest tests/unit/app/login.test.tsx
npm run validate
```

(There is no dedicated signup test; `login.test.tsx` covers the shared action. Confirm
the full auth suite still passes.) Expected: PASS, 0 errors.

**Step 3: Commit**

```bash
git add app/signup/page.tsx
git commit -m "style(signup): studio auth card matching login"
```

---

## Task 8: Tasks page (page shell + form)

**Files:**

- Modify: `app/tasks/page.tsx`

**Step 1: Apply edits** (logic untouched — only the returned JSX chrome):

- Outer wrapper (line 123): `min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100`
  → `min-h-screen bg-background`.
- Content frame (line 125): `<div className="container mx-auto px-6 py-12">` →
  `<div className="mx-auto w-full max-w-content px-6 py-12 md:px-9">`.
- Inner (line 126): keep `max-w-4xl mx-auto` OR drop it (the new frame already caps
  width); simplest: change `<div className="max-w-4xl mx-auto">` →
  `<div className="space-y-8">`.
- Main card (line 127): `<Card className="shadow-xl">` →
  `<Card className="border-2 border-foreground rounded-2xl shadow-hard">`.
- Title (line 129): `<CardTitle className="text-4xl">` →
  `<CardTitle className="font-display text-4xl font-extrabold tracking-tight">`
  (text `Supabase Tasks Example` unchanged).
- Error box (line 137): `mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800`
  → `mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 text-destructive`.
- Form (line 144): `mb-8 p-6 bg-muted/50 rounded-lg`
  → `mb-8 rounded-2xl border-2 border-foreground bg-muted/50 p-6`.
- The two `<h2 className="text-xl font-semibold ...">` (lines 146, 173) → add
  `font-display`. Keep `Create New Task` and `Tasks ({tasks.length})` text.
- Empty state (line 185): `bg-muted/50 rounded-lg` → `rounded-2xl border-2 border-foreground bg-muted/50`.

**Step 2: Verify**

```
npx jest tests/unit/app/tasks/test_page.test.tsx
```

Expected: PASS (`Tasks (n)`, `Loading tasks...`, `No tasks yet...` text preserved).
Then `npm run validate`.

**Step 3: Commit**

```bash
git add app/tasks/page.tsx
git commit -m "style(tasks): studio page shell, form, and error state"
```

---

## Task 9: TaskItem (priority hybrid + studio row)

**Files:**

- Modify: `app/components/tasks/TaskItem.tsx`

**Step 1: Replace `getPriorityClasses` (lines 7–18)** with the hybrid mapping:

```ts
function getPriorityClasses(priority: string) {
  const base = 'border-2 border-foreground';
  switch (priority) {
    case 'high':
      return `${base} bg-coral text-coral-foreground`;
    case 'medium':
      return `${base} bg-gold text-gold-foreground`;
    case 'low':
      return `${base} bg-teal text-teal-foreground`;
    default:
      return `${base} bg-muted text-muted-foreground`;
  }
}
```

**Step 2: Update the row + delete button**

- Row container (line 30):
  `flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow`
  → `flex items-center gap-4 rounded-2xl border-2 border-foreground bg-card p-4 transition-transform hover:-translate-y-0.5 hover:shadow-hard-sm`.
- Delete button (line 53): `text-red-600 hover:bg-red-50 hover:text-red-700`
  → `text-destructive hover:bg-destructive/10 hover:text-destructive`.
- Keep `{task.priority}` text and the `line-through` completed style (line 38) exactly —
  a test asserts `line-through` and the priority words.

**Step 3: Verify**

```
npx jest tests/unit/app/tasks/test_page.test.tsx
```

Expected: PASS. Then `npm run validate`.

**Step 4: Commit**

```bash
git add app/components/tasks/TaskItem.tsx
git commit -m "style(tasks): hybrid priority badges + studio task row"
```

---

## Task 10: StudentsInfoCard

**Files:**

- Modify: `app/components/tasks/StudentsInfoCard.tsx`

**Step 1: Apply edits**

- Card (line 5): `<Card className="mt-8 shadow-xl">` →
  `<Card className="mt-8 border-2 border-foreground rounded-2xl shadow-hard">`.
- Title (line 7): `<CardTitle className="text-xl">` →
  `<CardTitle className="font-display text-xl">` (text `📚 For Students` unchanged).
- Replace all three `text-gray-700` occurrences (lines 11, 12, 39, 49) with
  `text-muted-foreground` (use Edit `replace_all`).

**Step 2: Verify**

```
npx jest tests/unit/app/tasks/test_page.test.tsx
npm run validate
```

Expected: PASS, 0 errors.

**Step 3: Commit**

```bash
git add app/components/tasks/StudentsInfoCard.tsx
git commit -m "style(tasks): tokenize StudentsInfoCard"
```

---

## Task 11: Charts page

**Files:**

- Modify: `app/charts/page.tsx`

**Step 1: Apply edits** (chart series already use `--chart-*` — recolor for free):

- Outer wrapper (line 52): `min-h-screen bg-gradient-to-br from-purple-50 to-blue-50`
  → `min-h-screen bg-background`.
- Content frame (line 54): `<div className="container mx-auto px-6 py-12">` →
  `<div className="mx-auto w-full max-w-content px-6 py-12 md:px-9">`.
- Inner (line 55): `max-w-4xl mx-auto space-y-8` → `space-y-8`.
- Heading (line 57): `text-4xl font-bold mb-2` →
  `font-display text-4xl font-extrabold tracking-tight mb-2` (text `📊 Charts Example`
  unchanged).
- All three `<Card>` (lines 68, 102, 146): add
  `className="border-2 border-foreground rounded-2xl shadow-hard"`.
- All three `<CardTitle>` (lines 70, 104, 148): add `font-display` to a `className`.
  Keep titles `Monthly Sign-ups`, `Growth Trend`, `Why Recharts?` (tests assert them).

**Step 2: Verify**

```
npx jest tests/unit/app/charts/page.test.tsx
```

Expected: PASS. Then `npm run validate`.

**Step 3: Commit**

```bash
git add app/charts/page.tsx
git commit -m "style(charts): studio shell + bordered chart cards"
```

---

## Task 12: Chat page

**Files:**

- Modify: `app/chat/page.tsx`

**Step 1: Apply edits** (message bubbles already token-based — leave them):

- Outer wrapper (line 39): `min-h-screen bg-gradient-to-br from-purple-50 to-blue-50`
  → `min-h-screen bg-background`.
- Content frame (line 41): `<div className="container mx-auto px-6 py-12">` →
  `<div className="mx-auto w-full max-w-content px-6 py-12 md:px-9">`.
- Inner (line 42): `max-w-3xl mx-auto` → `mx-auto max-w-3xl`.
- Card (line 43): `<Card className="flex flex-col h-[70vh]">` →
  `<Card className="flex h-[70vh] flex-col border-2 border-foreground rounded-2xl shadow-hard">`.
- CardTitle (line 45): add `font-display` (text `🤖 LLM Agent Chat` unchanged — the
  test asserts this exact string).

**Step 2: Verify**

```
npx jest tests/unit/app/chat-page.test.tsx
```

Expected: PASS. Then `npm run validate`.

**Step 3: Commit**

```bash
git add app/chat/page.tsx
git commit -m "style(chat): studio shell + bordered chat card"
```

---

## Task 13: Test-dashboard page shell

**Files:**

- Modify: `app/test-dashboard/page.tsx`

**Step 1: Apply edits**

- Outer wrapper (line 42): `min-h-screen bg-muted/30` → `min-h-screen bg-background`.
- Content frame (line 44): `<div className="container mx-auto px-6 py-8">` →
  `<div className="mx-auto w-full max-w-content px-6 py-8 md:px-9">`.
- Inner (line 45): `max-w-6xl mx-auto` → drop to nothing (`<div>` → remove wrapper or
  keep as `<div className="space-y-6">`). Simplest: `<div className="space-y-6">` and
  remove the per-card `mb-6` later if desired (optional; leave for now).
- Heading (line 47): `text-4xl font-bold mb-2` →
  `font-display text-4xl font-extrabold tracking-tight mb-2` (text `Test Dashboard`
  unchanged).
- "Run tests" card (line 53): `<Card className="mb-6">` →
  `<Card className="mb-6 border-2 border-foreground rounded-2xl shadow-hard">`.
- Error card (line 84): `<Card>` → `<Card className="border-2 border-foreground rounded-2xl shadow-hard">`;
  inner error box (line 86) `p-4 bg-red-50 border-l-4 border-red-500 rounded`
  → `rounded-xl border-l-4 border-destructive bg-destructive/10 p-4`; `text-red-800`
  (line 87) → `text-destructive`; `text-red-700` (line 90) → `text-destructive/80`.
- Empty-state card (line 101): `<Card>` → `<Card className="border-2 border-foreground rounded-2xl shadow-hard">`;
  heading (line 104) `text-2xl font-semibold text-gray-700` →
  `font-display text-2xl font-semibold text-foreground` (text `Ready to test your code?`
  unchanged).

**Step 2: Verify**

```
npx jest tests/unit/app/test-dashboard.test.tsx
```

Expected: PASS. Then `npm run validate`.

**Step 3: Commit**

```bash
git add app/test-dashboard/page.tsx
git commit -m "style(test-dashboard): studio shell + tokenized states"
```

---

## Task 14: TestSummaryCard (hybrid status colors)

**Files:**

- Modify: `app/test-dashboard/components/TestSummaryCard.tsx`

**Step 1: Apply edits** (keep `Total Tests`, `Passing`, `Failing`, `Skipped` text):

- Card (line 6): `<Card className="mb-6">` →
  `<Card className="mb-6 border-2 border-foreground rounded-2xl shadow-hard">`.
- Title (line 8): add `font-display`.
- Total tile (line 12): `bg-muted/50 rounded-lg` → `rounded-xl border-2 border-foreground bg-muted/50`;
  number (line 13) `text-gray-700` → `text-foreground`.
- Passing tile (line 20): `bg-green-50 rounded-lg` → `rounded-xl border-2 border-foreground bg-teal/10`;
  number (line 21) `text-green-600` → `text-teal`.
- Failing tile (line 26): `bg-red-50 rounded-lg` → `rounded-xl border-2 border-foreground bg-destructive/10`;
  number (line 27) `text-red-600` → `text-destructive`.
- Skipped tile (line 32): `bg-yellow-50 rounded-lg` → `rounded-xl border-2 border-foreground bg-gold/10`;
  number (line 33) `text-yellow-600` → `text-gold`.
- Success banner (line 41): `bg-green-50 border-l-4 border-green-500 rounded`
  → `rounded-xl border-l-4 border-teal bg-teal/10`; text (line 42) `text-green-800` → `text-teal`.
- Failure banner (line 47): `bg-red-50 border-l-4 border-red-500 rounded`
  → `rounded-xl border-l-4 border-destructive bg-destructive/10`; text (line 48)
  `text-red-800` → `text-destructive`.

**Step 2: Verify**

```
npx jest tests/unit/app/test-dashboard.test.tsx
npm run validate
```

Expected: PASS, 0 errors.

**Step 3: Commit**

```bash
git add app/test-dashboard/components/TestSummaryCard.tsx
git commit -m "style(test-dashboard): hybrid status colors in TestSummaryCard"
```

---

## Task 15: CoverageCard (hybrid tiers)

**Files:**

- Modify: `app/test-dashboard/components/CoverageCard.tsx`

**Step 1: Replace the two color helpers (lines 4–16)**:

```ts
function getCoverageColor(percentage: string) {
  const pct = parseFloat(percentage);
  if (pct >= 80) return 'text-teal';
  if (pct >= 60) return 'text-gold';
  return 'text-destructive';
}

function getCoverageBarColor(percentage: string) {
  const pct = parseFloat(percentage);
  if (pct >= 80) return 'bg-teal';
  if (pct >= 60) return 'bg-gold';
  return 'bg-destructive';
}
```

**Step 2: Apply chrome + info box edits**

- Card (line 20): `<Card className="mb-6">` →
  `<Card className="mb-6 border-2 border-foreground rounded-2xl shadow-hard">`.
- Title (line 22): add `font-display`.
- Info box (line 75): `mt-6 p-4 bg-blue-50 rounded-lg` →
  `mt-6 rounded-xl border-2 border-foreground bg-primary/5 p-4`; heading (line 76)
  `font-semibold text-blue-900` → `font-display font-semibold text-foreground`; list
  (line 79) `text-sm text-blue-800` → `text-sm text-muted-foreground`.
- Update the legend wording (lines 81, 84, 88) to match the new palette while keeping
  it readable: `Green (80%+)` → `Teal (80%+)`, `Yellow (60-79%)` → `Gold (60-79%)`,
  `Red (<60%)` → `Coral/red (<60%)`. (These are body copy, not asserted by tests —
  verify against `tests/unit/app/test-dashboard.test.tsx` which checks percentages and
  `85.50%`, not the legend words.)

**Step 3: Verify**

```
npx jest tests/unit/app/test-dashboard.test.tsx
npm run validate
```

Expected: PASS, 0 errors.

**Step 4: Commit**

```bash
git add app/test-dashboard/components/CoverageCard.tsx
git commit -m "style(test-dashboard): hybrid coverage tiers in CoverageCard"
```

---

## Task 16: TestSuiteList (hybrid status)

**Files:**

- Modify: `app/test-dashboard/components/TestSuiteList.tsx`

**Step 1: Apply edits** (keep `✓ Passed` / `✗ Failed` and test titles):

- Card (line 23): `<Card>` → `<Card className="border-2 border-foreground rounded-2xl shadow-hard">`.
- Title (line 25): add `font-display`.
- Suite row container (line 30): `border rounded-lg overflow-hidden` →
  `overflow-hidden rounded-xl border-2 border-foreground`.
- Status badge (lines 46–48): passed `bg-green-100 text-green-800 border-green-200`
  → `bg-teal/15 text-teal border-2 border-teal/40`; failed
  `bg-red-100 text-red-800 border-red-200` → `bg-destructive/15 text-destructive border-2 border-destructive/40`.
- Per-test status glyph color (lines 67–71): `text-green-600` → `text-teal`,
  `text-red-600` → `text-destructive`, `text-yellow-600` → `text-gold`.
- Failure message box (line 84): `mt-2 p-3 bg-red-50 rounded text-sm` →
  `mt-2 rounded-lg border-2 border-destructive/40 bg-destructive/10 p-3 text-sm`;
  `text-red-800` (line 85) → `text-destructive`; `text-red-700` (line 91) →
  `text-destructive/80`.

**Step 2: Verify**

```
npx jest tests/unit/app/test-dashboard.test.tsx
npm run validate
```

Expected: PASS, 0 errors.

**Step 3: Commit**

```bash
git add app/test-dashboard/components/TestSuiteList.tsx
git commit -m "style(test-dashboard): hybrid status colors in TestSuiteList"
```

---

## Task 17: Full verification sweep

**Files:** none (verification only).

**Step 1: Run the whole suite + gates**

```
npx jest
npm run validate
npm run design:lint
```

Expected: **all suites pass**, validate **0 errors** (warnings OK — pre-existing
arbitrary-value/`any` style), design:lint **0 errors**.

**Step 2: Manual visual check (optional, needs Supabase env)**

The app is auth-gated, so a running screenshot of `/` etc. needs `.env.local`. If
available: `npm run dev`, then visit `/design`, `/login`, `/signup`, `/tasks`,
`/charts`, `/chat`, `/test-dashboard` in both light and dark mode (toggle in the nav)
and confirm: no purple/blue gradients remain, cards have ink borders + hard shadows,
headings use the display font, and status colors follow the hybrid mapping.

> Note: `npm run build` currently fails on a **pre-existing, unrelated** issue in
> `app/api/test-runner/route.ts` (`Can't resolve 'node_modules/jest/bin/jest.js'`).
> This is not introduced by the redesign and `build` is not a pre-push gate
> (`validate` + `test` are). Do not attempt to "fix" it as part of this work.

**Step 3: Final commit (if any stray formatting from lint-staged)**

```bash
git add -A
git commit -m "style: finalize Studio Bauhaus rollout across all pages" || echo "nothing to commit"
```

---

## Done criteria

- [ ] Every page uses `bg-background` (no `from-purple-50`/`to-indigo-100` gradients).
- [ ] Every page content frame uses `max-w-content` + `px-6 md:px-9` (aligns with nav/home).
- [ ] Cards use studio chrome (`border-2 border-foreground rounded-2xl shadow-hard`).
- [ ] Headings use `font-display`; the 3-font stack is documented on `/design`.
- [ ] Status/priority colors follow the hybrid mapping (teal/gold/destructive + coral).
- [ ] `npx jest` green, `npm run validate` 0 errors, `npm run design:lint` 0 errors.
- [ ] No visible text changed; no behavior changed; no new dependencies.
