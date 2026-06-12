# Northwestern MMM & MPD2 — Next.js Starter Template

A production-ready **Next.js 16** starter for Northwestern MMM and MPD2 master's students. It comes
pre-wired with TypeScript, Tailwind CSS + shadcn/ui, Supabase (auth + database), an n8n LLM
chat scaffold, and a Test-Driven Development framework with quality gates enforced by git
hooks — so you can spend your time building your idea, not your toolchain. Whether this is your
first time coding or you're already comfortable with React, the guardrails meet you where you are.

> 🧩 **This is a GitHub _template_ repository.** Click the green **"Use this template"**
> button at the top of the GitHub page → **Create a new repository**. That gives you your own
> clean copy (no shared git history) to clone and build on. Don't fork it.

---

## 🎯 What this template gives you

1. **A blank canvas** — the home page (`/`) is a shell you replace with your own project.
2. **A login-controlled app** — Supabase email/password + OAuth auth is already wired up; every
   page except `/login`, `/signup`, and `/auth/*` requires a signed-in user.
3. **Working examples to learn from** — a full Supabase CRUD feature, a streaming AI chat with
   optional long-term memory, a charts page, an interactive design-system page, a knowledge-graph
   memory explorer, and a live test dashboard. Study them, then delete what you don't need.
4. **Guardrails that teach good habits** — a TDD workflow, an 80% test-coverage gate, a
   300-line file limit, secret scanning, and auto-generated docs, all enforced automatically
   when you commit and push.

---

## 🚀 Quick Start

### 1. Get your own copy

Click **"Use this template" → Create a new repository**, then clone _your_ new repo:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Install & configure

```bash
npm install                 # install dependencies
cp .env.example .env.local  # create your local env file (gitignored — never commit it)
```

Then fill in your Supabase keys in `.env.local`. The first-time setup is walked through
step-by-step in **[docs/getting-started.md](docs/getting-started.md)** — start there. (Once
you've finished bootstrapping, delete `docs/getting-started.md` and update the Project Overview
in `CLAUDE.md` to describe _your_ project.)

### 3. Run it

```bash
npm run dev      # starts the dev server on http://localhost:3000
```

> The app is login-controlled, so visiting `http://localhost:3000` redirects you to `/login`.
> Create an account at `/signup` to get in. (Full auth + database setup is in
> [SUPABASE_SETUP.md](SUPABASE_SETUP.md).)

> 💬 The `/chat` page works out of the box in **placeholder mode** — no external setup needed to
> demo it. To wire it to a real LLM agent, point it at your own n8n webhook
> (see [docs/integrations/n8n.md](docs/integrations/n8n.md)). Optionally add **Zep** to give the
> chat **long-term memory** that persists across sessions
> (see [docs/integrations/zep.md](docs/integrations/zep.md)) — explore it on the `/memory` page.

---

## 🗺️ What's in the box

The template ships with several working pages. Replace the home shell with your own app, and
use the rest as reference (or delete them). Every page sits inside a shared layout with a sticky
header — logo, nav links, your signed-in email, a sign-out button, and a **light/dark theme
toggle** (your choice is remembered across visits).

| Route               | What it is                                                          |
| ------------------- | ------------------------------------------------------------------- |
| `/`                 | **The shell** — replace this with your project's main interface     |
| `/login`, `/signup` | Email/password + OAuth (Google/GitHub) auth, ready to use           |
| `/auth/*`           | Auth plumbing — OAuth callback, email confirmation, sign-out        |
| `/tasks`            | A full **Supabase CRUD** example (create / read / update / delete)  |
| `/chat`             | A **streaming LLM chat** that proxies to an n8n agent webhook       |
| `/charts`           | A **Recharts** data-visualization example using the shadcn chart UI |
| `/design`           | An interactive **design-system guide** — tokens, type, components   |
| `/memory`           | A **knowledge-graph memory** guide (Zep) + live memory tools        |
| `/test-dashboard`   | A live view of your test suite + coverage                           |

> 📚 `/design` is a learning tool, not part of your final app — it shows the live color tokens,
> typography, and component gallery, plus how to add new shadcn/ui components. Browse it to stay
> on-brand, then remove it when you no longer need the reference.

> 🧠 `/memory` explains, in plain language, how an AI gets **long-term memory** with **Zep**
> knowledge graphs — then lets you fetch your own user summary and search your memory graph live
> (Zep's auto search). The tools light up once `ZEP_API_KEY` is set
> (see [docs/integrations/zep.md](docs/integrations/zep.md)); the page renders fine without it.

---

## 📂 Project Structure

```
.
├── app/                       # App Router: routes, pages, API handlers, UI
│   ├── page.tsx               # 👈 Start here — replace with your app
│   ├── components/            # 👈 Your app-specific components (Navigation, ThemeToggle…)
│   ├── api/                   # Route handlers (REST) — e.g. tasks, chat, memory, test-runner
│   ├── memory/                # /memory learning page + live Zep memory tools
│   ├── error.tsx · global-error.tsx  # error boundaries (graceful failure UI)
│   ├── login/ · signup/       # Auth pages + server actions
│   └── auth/                  # OAuth / email-confirmation / sign-out callbacks
├── components/ui/             # shadcn/ui primitives (Button, Card, Input, Chart…)
├── lib/
│   ├── supabase/              # client.ts (browser) · server.ts (RSC/API) · middleware.ts
│   ├── zep/                   # Zep long-term memory (client, chat memory, graph search)
│   ├── logger.ts              # structured logger — use instead of console.log
│   └── utils.ts              # cn() Tailwind class merger
├── types/                     # Shared TypeScript types (incl. generated Supabase types)
├── tests/                     # Your tests live here (TDD is required)
│   ├── unit/                  # mirrors app/ — unit + component tests
│   └── integration/           # API + cross-module tests
├── docs/                      # getting-started.md + integration guides
├── CLAUDE.md / AGENTS.md      # Project rules for you and your AI coding agent
└── .claude/rules/             # Path-scoped rules your AI agent auto-loads
```

---

## 🛠️ Pre-Configured Tech Stack

| Category      | Technology                    | Why it's here                                   |
| ------------- | ----------------------------- | ----------------------------------------------- |
| **Framework** | Next.js 16 (App Router, RSC)  | Industry-standard React framework               |
| **Language**  | TypeScript (strict)           | Type safety and better editor support           |
| **Styling**   | Tailwind CSS v3.4 + shadcn/ui | Rapid, accessible, on-brand UI                  |
| **Auth + DB** | Supabase (`@supabase/ssr`)    | Login, row-level security, Postgres             |
| **AI Chat**   | n8n webhook (streamed)        | LLM agent scaffold, proxied server-side         |
| **AI Memory** | Zep (`@getzep/zep-cloud`)     | Optional long-term memory via a knowledge graph |
| **Charts**    | Recharts (shadcn wrapper)     | Data visualization                              |
| **Testing**   | Jest + React Testing Library  | TDD methodology with an 80% coverage gate       |

---

## 📝 Development Workflow

### TDD is the law — write tests first

Every feature starts with a failing test. Red → Green → Refactor.

```bash
# 1. Write a failing test first (RED)
#    e.g. tests/unit/app/components/MyComponent.test.tsx
npm test

# 2. Write the simplest code to make it pass (GREEN)
#    e.g. app/components/MyComponent.tsx
npm test

# 3. Refactor with the tests as your safety net
```

### Everyday commands

```bash
npm run dev            # dev server on http://localhost:3000
npm run validate       # type-check + lint (run before committing)
npm test               # run the test suite
npm run test:coverage  # coverage report (80% gate)
npm run format         # Prettier
npm run build          # production build
```

### Quality gates (enforced automatically)

This repo uses git hooks (husky) so the rules can't be forgotten:

- **pre-commit** — lints & formats staged files, blocks committed secrets, blocks source files
  over 300 lines, blocks new source modules with no matching test, and keeps `CLAUDE.md` in sync.
- **pre-push** — runs `npm run validate` and the full test suite before anything leaves your machine.

If a commit or push is blocked, read the message — it's telling you which rule to fix. These
gates aren't busywork: they're the same habits (tests first, small files, no leaked secrets,
typed boundaries) that professional teams rely on.

---

## 🤖 Built to work with AI coding agents

This template is designed to be driven by an AI assistant (Claude Code, Cursor, etc.):

- **[CLAUDE.md](CLAUDE.md)** (and its `AGENTS.md` alias) is the lean entry point describing the
  project, commands, and architecture. Its module tree and table are auto-generated — read it to
  understand the codebase; the README (this file) is your human-facing on-ramp.
- **[.claude/rules/](.claude/rules/)** holds path-scoped rules (TDD, testing, TypeScript, React,
  API, database, security, UI styling) that an agent auto-loads when editing matching files.

Keep these accurate as your project grows — they're how your AI partner stays aligned with your
codebase.

---

## 🎨 Customization & Design System

- **Home page**: edit `app/page.tsx` (this is the shell you replace).
- **Global styles / theme**: the live design tokens are HSL CSS variables in `app/globals.css`,
  mapped to Tailwind utilities (`bg-primary`, `text-muted-foreground`) in `tailwind.config.js`.
  Use tokens, never hard-coded colors — raw hex and arbitrary color values are an ESLint **build
  error** so light/dark mode stays consistent.
- **Design system**: [DESIGN.md](DESIGN.md) documents your colors, typography, and components in
  Google's DESIGN.md format and maps each token to its CSS variable. Edit the variables in
  `app/globals.css` to rebrand, update `DESIGN.md` to match, then validate with
  `npm run design:lint`. The `/design` page renders all of this live.
- **Add UI components**: `npx shadcn@latest add <name> --yes` (e.g. `dialog`, `table`) — always
  pass `--yes` so it doesn't hang. New primitives land in `components/ui/` and inherit your
  tokens; feature-specific compositions go in `app/components/<feature>/`.

---

## 🔒 Security (built in)

- **Login-controlled by default** — `proxy.ts` refreshes the session on every request and
  redirects anonymous users to `/login`.
- **Row-Level Security (RLS)** — the example `tasks` table is user-scoped with per-user policies;
  the server Supabase client carries the session so RLS applies and users only see their own rows.
  Never trust the client for authorization.
- **Input validation** — validate API inputs with **Zod** at the boundary.
- **No committed secrets** — keys live in `.env.local` (gitignored); a pre-commit hook scans
  staged files and blocks API keys, tokens, and private keys.

---

## 📋 Project Checklist

Before submitting your project:

- [ ] Replaced the home shell with your own idea
- [ ] All features have tests (written first — TDD)
- [ ] Test coverage ≥ 80% (`npm run test:coverage`)
- [ ] `npm run validate` is clean (no type or lint errors)
- [ ] No hardcoded secrets (use `.env.local`)
- [ ] Deleted the example pages you don't need (`/tasks`, `/chat`, `/charts`, `/design`, `/memory`, `/test-dashboard`)
- [ ] `CLAUDE.md` / `.claude/rules/` updated if you changed the architecture

---

## 🆘 Getting Help

- **First-time setup**: [docs/getting-started.md](docs/getting-started.md)
- **Supabase + auth setup**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **AI chat integration**: [docs/integrations/n8n.md](docs/integrations/n8n.md)
- **AI long-term memory (Zep)**: [docs/integrations/zep.md](docs/integrations/zep.md)
- **Project rules**: [CLAUDE.md](CLAUDE.md)
- **Docs**: [Next.js](https://nextjs.org/docs) ·
  [Tailwind](https://tailwindcss.com/docs) · [shadcn/ui](https://ui.shadcn.com) ·
  [Supabase](https://supabase.com/docs) · [React](https://react.dev)

**Common issues**

- _Changes not showing?_ Restart the dev server and check the console.
- _Tests failing?_ Read the error, check the test file location, and verify your imports.
- _Type errors?_ Define types in `types/`, and check `tsconfig.json`.
- _Redirected to `/login`?_ That's expected — the app requires a session. Sign up at `/signup`.

---

## 🚢 Deployment

1. Make sure tests pass and `npm run build` succeeds.
2. Deploy to your hosting platform of choice (e.g. Vercel).
3. Set your environment variables (the ones in `.env.example`) in the host's configuration.

---

## 📄 License

ISC — this is your starter template to build upon.

---

**Remember**: this is _your_ canvas. The shell app is just a starting point — replace it with
your creative vision and build something amazing. 🌟

**Happy coding!**
_Northwestern MMM & MPD2 Programs_
