---
description: shadcn/ui, Tailwind v3.4.x tokens, Recharts
globs: 'app/**/*.tsx,components/**/*.tsx,app/globals.css'
---

# UI & Styling — Tailwind + shadcn/ui (applies to `app/**`, `components/**`)

- **Component library**: this template uses **shadcn/ui** (new-york style). Reusable
  primitives live in `components/ui/` (Button, Card, Input, Label, Checkbox, Badge, Select,
  Chart). **Prefer composing these over hand-rolling** — reach for a primitive first.
- **Creating a new component — follow this ladder, stop at the first match:**
  1. **Already installed?** Compose a primitive from `components/ui/` (Button, Card, Input,
     Label, Checkbox, Badge, Select, Chart). CLAUDE.md's _Key Modules_ table lists what's there.
  2. **In the shadcn registry but not installed?** Pull it via the **CLI** (works in this env):
     - Search / list: `npx shadcn@latest search @shadcn -q <term>` (or `list @shadcn`).
     - Inspect first: `npx shadcn@latest view @shadcn/<name>` or `docs <name>`.
     - Add: `npx shadcn@latest add <name> --yes` (`--overwrite` only when intentional). It
       lands in `components/ui/`, inherits our tokens (`components.json` → slate + CSS vars),
       and installs any Radix deps. **Always pass `--yes`** — the bare command is interactive
       and will hang an agent. Offline fallback: copy source from
       https://ui.shadcn.com/docs/components into `components/ui/`.
  3. **Composable from existing primitives?** Build a **feature composition** in
     `app/components/<feature>/<Name>.tsx` (e.g. `app/components/tasks/TaskItem.tsx`).
  4. **Truly new primitive (no shadcn match)?** Hand-build it in `components/ui/<name>.tsx`
     following shadcn conventions: Radix base if interactive, `cva` for variants, `cn()` from
     `@/lib/utils`, `forwardRef`, named export, **design tokens only** (no hard-coded colors).
  - **Where it lives:** reusable/generic primitive → `components/ui/`; app- or feature-specific
    composition → `app/components/<feature>/`. Litmus test — "would an unrelated feature reuse
    this verbatim?": yes → `components/ui/`, no → `app/components/`.
  - **New design-system component?** If it adds new component tokens/variants, document it in
    the `components:` block + Components section of `DESIGN.md`, then run `npm run design:lint`.
  - TDD still applies (failing test in `tests/` first) and the 300-line file limit holds.
- **Design tokens**: colors are CSS variables (HSL) in `app/globals.css`, mapped in
  `tailwind.config.js` (`bg-primary`, `text-muted-foreground`, `border-border`). Use tokens,
  not hard-coded colors, so light/dark theming stays consistent.
- **Enforced (ESLint, pre-commit + CI)**: hard-coded colors in `app/**`/`components/**` are a
  **build error** — raw hex (`#7c3aed`), `bg-[#fff]`-style arbitrary values, and
  `text-[rgb(...)]`/`[hsl(...)]`. Arbitrary values (`p-[13px]`) and off-theme class names
  **warn**. `jsx-a11y` accessibility rules also run. Token-source files (`app/globals.css`,
  `tailwind.config.js`, `DESIGN.md`) and the vendored `components/ui/**` primitives are exempt
  from the nudge rules. Fix: use a token utility (`bg-primary`) or add the value to the theme.
- **Design system (`DESIGN.md`)**: the repo-root [`DESIGN.md`](../../DESIGN.md) describes the
  app's visual identity (colors, typography, components) in Google's DESIGN.md format. **Read
  it before generating UI** so output stays on-brand. The **live** tokens are the HSL vars in
  `app/globals.css` — edit those directly to change the theme; `DESIGN.md` documents them and
  is updated alongside to stay accurate. Format note: `DESIGN.md` colors are hex/oklch, the
  live vars are `H S% L%` (no `hsl()` wrapper); keep `*-foreground` pairs WCAG AA. Validate
  the file with `npm run design:lint`.
- **`cn()` helper**: merge class names with `cn()` from `@/lib/utils`.
- **Charts**: use **Recharts** via the shadcn chart wrapper in `components/ui/chart*`
  (`ChartContainer`, `ChartTooltip`, `ChartLegend`). See `app/charts/page.tsx`. Add more
  chart types from https://ui.shadcn.com/charts.
- **Version**: stay on Tailwind CSS v3.4.x (`tailwindcss@^3.4.0`) with PostCSS config and
  `@tailwind` directives in `app/globals.css`.
- **Best practices**: utility classes, responsive/mobile-first, accessible components
  (shadcn/ui is built on Radix primitives).
