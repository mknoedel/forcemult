---
name: Northwestern MMM & MPD2 Starter
colors:
  # Light theme — these mirror the :root values in app/globals.css.
  background: '#F1EDE4'
  foreground: '#1B1713'
  card: '#F9F6F1'
  cardForeground: '#1B1713'
  popover: '#F9F6F1'
  popoverForeground: '#1B1713'
  primary: '#4E2A84' # Northwestern Purple
  primaryForeground: '#FAF8F4'
  secondary: '#E4DCCE'
  secondaryForeground: '#2B241D'
  muted: '#E6E1D5'
  mutedForeground: '#696159'
  accent: '#E4DCCE'
  accentForeground: '#2B241D'
  destructive: '#DC2828'
  destructiveForeground: '#FAF8F4'
  border: '#D7CEC1'
  input: '#D7CEC1'
  ring: '#4E2A84'
  # Studio accent palette (each paired with a *-foreground for contrast).
  gold: '#F2B32C'
  goldForeground: '#28201A'
  coral: '#EB5E33'
  coralForeground: '#28201A'
  teal: '#1E8A73'
  tealForeground: '#FAF8F4'
  chart1: '#4E2A84'
  chart2: '#1E8A73'
  chart3: '#F2B32C'
  chart4: '#EB5E33'
  chart5: '#886BB3'
typography:
  h1:
    fontFamily: Bricolage Grotesque
    fontSize: '2.25rem'
    fontWeight: 700
    lineHeight: '2.5rem'
    letterSpacing: '-0.02em'
  h2:
    fontFamily: Bricolage Grotesque
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: '2rem'
    letterSpacing: '-0.01em'
  body:
    fontFamily: Hanken Grotesk
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: '1.5rem'
  label:
    fontFamily: Hanken Grotesk
    fontSize: '0.875rem'
    fontWeight: 500
    lineHeight: '1.25rem'
  small:
    fontFamily: Hanken Grotesk
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: '1rem'
rounded:
  sm: '6px'
  md: '8px'
  lg: '0.75rem'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
components:
  button:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primaryForeground}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
  buttonSecondary:
    backgroundColor: '{colors.secondary}'
    textColor: '{colors.secondaryForeground}'
    typography: '{typography.label}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
  card:
    backgroundColor: '{colors.card}'
    textColor: '{colors.cardForeground}'
    rounded: '{rounded.lg}'
    padding: '1.5rem'
---

# DESIGN.md — Your App's Design System

This file is the structured description of your app's **visual identity**, written
in the [Google `DESIGN.md`](https://github.com/google-labs-code/design.md) format.
The YAML tokens above are machine-readable values; the prose below explains _why_
they exist and _how_ to apply them. AI coding agents read this file so the UI they
generate stays consistent with your brand.

## How to edit your design system

The tokens above are **documentation that mirrors the real theme**. The _live_
values that actually style the app are the **HSL CSS variables in
[`app/globals.css`](app/globals.css)** (mapped to Tailwind classes in
`tailwind.config.js`). To rebrand the app, edit those variables **directly** — then
update the matching token here so this file stays accurate.

Each color token maps 1:1 to a CSS variable (drop the `--`, e.g. `primaryForeground`
→ `--primary-foreground`). The one gotcha: `globals.css` stores colors as HSL
**`H S% L%`** (no `hsl()` wrapper), while this file uses hex — convert when you edit.

| Token here            | CSS variable in `app/globals.css` | What it controls                     |
| --------------------- | --------------------------------- | ------------------------------------ |
| `primary`             | `--primary`                       | Main brand / action color            |
| `primaryForeground`   | `--primary-foreground`            | Text/icons on a primary surface      |
| `background`          | `--background`                    | Page background                      |
| `foreground`          | `--foreground`                    | Default body text                    |
| `secondary` / `muted` | `--secondary` / `--muted`         | Subtle surfaces                      |
| `accent`              | `--accent`                        | Hover/highlight surfaces             |
| `destructive`         | `--destructive`                   | Errors / delete actions              |
| `border` / `input`    | `--border` / `--input`            | Hairlines and field borders          |
| `ring`                | `--ring`                          | Focus ring                           |
| `chart1`…`chart5`     | `--chart-1`…`--chart-5`           | Data-visualization palette           |
| `rounded.lg`          | `--radius`                        | Corner radius (md/sm derive from it) |

> **Tip:** after editing, run `npm run design:lint` to validate this file against
> the spec (broken token references, WCAG contrast, etc.). Dark-mode values live in
> the `.dark` block of `app/globals.css` and follow the same variable names.

## Overview

A bold, design-forward **"Studio Bauhaus"** identity built on **shadcn/ui**. The feel
is warm and confident — cream paper surfaces and near-black ink, anchored by
**Northwestern Purple** (`#4E2A84`) as the brand/action color and punctuated by a
geometric accent trio (gold, coral, teal). Hierarchy comes from **thick ink borders
and hard offset shadows** rather than soft elevation, with friendly rounded corners.
It should read as crafted and energetic — the kind of polish design-innovation
students recognize. A full **dark theme** (warm charcoal surfaces, a brighter purple)
ships alongside and is toggled in the navigation. When a specific token isn't defined,
lead with the purple, reach for one accent, and keep the border-and-shadow language
consistent.

## Colors

The palette is **warm cream neutrals + a Northwestern Purple primary + a geometric
accent trio**. `primary` (`#4E2A84`) drives buttons, links, focus rings, and the
first chart series. Neutrals (`background`, `foreground`, `secondary`, `muted`,
`accent`, `border`) are warm off-whites and ink rather than cool slate. Three
accents — `gold` (`#F2B32C`), `coral` (`#EB5E33`), and `teal` (`#1E8A73`) — carry the
Bauhaus character on feature badges, callouts, and the logo mark; each has a paired
`*Foreground` tuned for WCAG AA. `destructive` (`#DC2828`) is reserved for errors and
destructive actions only. The app ships with a full **dark theme** (the `.dark` block
in `app/globals.css`): warm charcoal surfaces and a brighter purple, same token names.

## Typography

Three typefaces, all loaded via `next/font/google` in `app/layout.tsx` and exposed as
CSS variables: **Bricolage Grotesque** (`--font-display`) for headlines — an
expressive grotesque with an optical-size axis that stays crisp at large sizes;
**Hanken Grotesk** (`--font-sans`) for body, labels, and UI; and **Instrument Serif**
(`--font-serif`) for the occasional italic editorial accent (e.g. the word _worth_ in
the hero). Use `font-display` for headings, the default sans for prose, and
`font-serif italic` sparingly for emphasis. Headings run heavy (700–800) with tight
letter-spacing; body stays at weight 400 for readability.

## Layout

Spacing uses **Tailwind's default 4px-based scale** (`xs`–`xl` above are the common
steps). Content is centered with a max width via the Tailwind `container` (2rem
padding, capped at 1400px on `2xl`). Design **mobile-first** and let layouts reflow
responsively. Keep generous breathing room — prefer more whitespace over dense UI.

## Elevation & Depth

Depth is **graphic, not soft**. The signature move is a **hard offset shadow** —
`shadow-hard` (`4px 4px 0` of the `foreground` ink), with `shadow-hard-sm` and
`shadow-hard-lg` variants — paired with a **2px ink border** (`border-2
border-foreground`). On hover, cards nudge up-and-left and the shadow grows, giving a
tactile "sticker" feel. The shadow is token-driven, so it flips to a light offset in
dark mode automatically. Reserve soft/blurred shadows for transient surfaces
(popovers, dropdowns, dialogs); don't mix the two languages on the same element.

## Shapes

Corners are **friendly and generous**. `rounded.lg` (`0.75rem`, the `--radius` value)
is the base; `md` and `sm` derive from it for smaller controls. Cards use `rounded-2xl`
for a soft, approachable feel, while interactive chips and buttons go fully `rounded-full`
— the pill shape is part of the Bauhaus character. Keep radii consistent across a
component family; the one deliberate exception is the geometric logo mark, which mixes a
half-circle and a hard corner on purpose.

## Components

Reusable primitives live in `components/ui/` (shadcn/ui). Compose those first rather
than hand-rolling markup. The token entries above capture the key ones:

- **button** — violet `primary` surface, `primaryForeground` text, `md` corners.
- **buttonSecondary** — the subtle `secondary` variant for low-emphasis actions.
- **card** — neutral surface with `lg` corners and generous padding.

Express variants (hover, active, disabled) by adjusting the same tokens; keep the
shape and typography consistent within a family.

## Do's and Don'ts

- **Do** use semantic tokens / Tailwind classes (`bg-primary`,
  `text-muted-foreground`, `border-border`) — never hard-coded hex in components.
- **Do** keep text/background pairs at **WCAG AA** contrast (≥ 4.5:1).
- **Do** reach for a `components/ui/` primitive before writing custom UI.
- **Don't** introduce new one-off colors; extend the palette here first.
- **Don't** rely on heavy drop shadows for hierarchy — use borders and spacing.
- **Don't** let this file drift: when you change `app/globals.css`, update the
  matching token here and run `npm run design:lint`.
