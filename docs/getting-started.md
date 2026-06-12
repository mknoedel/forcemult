# First-Time Setup (Bootstrapping)

> **AI agent — read this first.** This is a one-time onboarding script for a
> brand-new user (likely a first-time coder). Walk them through each step
> **interactively and conversationally** — do one step, confirm it worked, then
> move on. Don't dump all the commands at once. Track progress with the
> checklist at the end.
>
> **🧹 Self-cleanup (important):** Once every item in the Setup Checklist is
> checked off, you MUST:
>
> 1. Delete this file (`docs/getting-started.md`) and remove its link from
>    `CLAUDE.md`.
> 2. Rewrite the **Project Overview** in `CLAUDE.md` (and the structure, if it
>    changed) to describe the user's actual project instead of the starter template.
> 3. Commit the cleanup (e.g. "Complete project bootstrapping").
>
> A template that still contains setup scaffolding after setup is confusing.
> Leave the docs describing the _real_ project, not the bootstrap process.

Guide the user through these steps:

## 1. Install dependencies

- Run `npm install`.
- Confirm it finishes without errors.

## 2. Configure environment variables

- Copy `.env.example` to `.env.local` (`cp .env.example .env.local`).
- Explain that `.env.local` is **gitignored** and must never be committed —
  it holds secrets.
- They'll fill in the Supabase values in the next step. If you add the n8n
  integration later, its variables go here too.

## 3. Create / connect a Supabase project

- Ask whether they already have a Supabase project.
  - If not, walk them through creating a free one at https://supabase.com.
- Have them copy **Project URL** and **anon/public key** from
  _Project Settings → API_ into `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
  and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SETUP.md` has the detailed, click-by-click walkthrough — point them
  there if they get stuck.

## 4. Connect the Supabase MCP (recommended)

Connecting the Supabase MCP lets you (the agent) manage the database directly.
**Check first, then ask — never install it silently** (the student may already
have it configured, and a duplicate server is confusing):

1. **Detect.** Run `claude mcp list` (and/or `claude mcp get supabase`) and look
   for a Supabase server (its URL contains `mcp.supabase.com`). If one is already
   configured, you're done — use it.
2. **Ask.** If none is found, ask the student whether they'd like to add it.
   **Only on an explicit yes**, run:

   ```bash
   claude mcp add --transport http --scope user supabase https://mcp.supabase.com/mcp
   ```

   `--scope user` keeps it available across their projects and **out of the
   repo** (nothing committed). The first call opens a **browser to authorize
   their Supabase account via OAuth — no token to copy/paste.**

3. **Verify** with `list_tables` (or have the student say "list my Supabase
   tables").

- Details (scoping to one project with `?project_ref=`, the "never use
  production data" warning) are in `SUPABASE_SETUP.md` → §1a.
- **Skipping the MCP?** Fall back to the Supabase **SQL Editor** or the
  **Supabase CLI** (`supabase db push`) — both apply the same migration next.

## 5. Create the database schema (user-scoped)

- The bundled **Tasks** example needs a `tasks` table with a `user_id` column +
  per-user RLS. The schema is version-controlled at
  `supabase/migrations/20250101000000_create_tasks_table.sql` — the single
  source of truth (mirrored in `types/supabase.ts`).
- **Preferred path — Supabase MCP:** read that `.sql` file and apply it with
  `apply_migration` (name it `create_tasks_table`) so it's tracked in the
  project's migration history. Offer to do this for the student.
- **Otherwise:** paste the file's contents into the Supabase **SQL Editor**, or
  run `supabase db push` after `supabase link --project-ref <ref>`.
- After any schema change, regenerate `types/supabase.ts` (Supabase MCP
  `generate_typescript_types`, or the Supabase CLI). When the student designs
  their **own** features, design the schema together, add a new migration file
  under `supabase/migrations/`, and apply it the same way.

## 6. Configure authentication

- The app is **login-controlled** (everything except `/login`, `/signup`,
  `/auth/*` requires a session). Walk the user through `SUPABASE_SETUP.md` →
  _Configure Authentication_:
  - Enable the **Email** provider; **disable "Confirm email"** for local dev.
  - (Optional) Enable **Google**/**GitHub** providers and add the redirect URLs
    (`http://localhost:3000/auth/callback`, `/auth/confirm`).

## 7. Verify everything works

- Run `npm run dev` and open http://localhost:3000 → you should be redirected
  to `/login`.
- Sign up at `/signup`, confirm the nav shows your email, and that `/tasks`
  create/toggle/delete works. Sign out and confirm you're sent back to `/login`.
- Run `npm test` — all tests should pass.

## 8. (Optional) Connect the n8n chat agent

Only if the student wants the streaming LLM chat at `/chat`. Until they set
`N8N_WEBHOOK_URL`, the chat works in **placeholder mode** (a mock reply), so this
is safe to skip. Walk through it conversationally:

- In **n8n**, build a workflow: **Webhook** (POST) → **AI Agent** (streaming
  response enabled, responding through the webhook). **Activate** the workflow.
- **Auth**: create a **Header Auth** credential with header name **`API_KEY`**
  (this exact name — the route expects it) and attach it to the Webhook node.
  The value is the student's own secret string.
- In `.env.local`, set:
  - `N8N_WEBHOOK_URL` → the **production** webhook URL (`/webhook/<id>`, _not_
    `/webhook-test/<id>` — the test URL only fires once per "Execute workflow"
    click in the editor).
  - `N8N_WEBHOOK_SECRET` → the `API_KEY` value from the credential above.
- Restart `npm run dev` (env vars load at startup), sign in, open `/chat`, and
  send a message — a streamed reply should render as clean markdown.
- The route already parses n8n's NDJSON stream and forwards a per-session
  `sessionId` for agent memory; details in
  [`docs/integrations/n8n.md`](integrations/n8n.md). Students don't edit the
  parser.

## 9. (Optional) Connect Zep (knowledge-graph memory)

Only if the student wants to work with a **Zep** knowledge graph (agent memory:
entities, facts, relationships). This adds two developer tools, not app code — skip it
otherwise. Full details in [`docs/integrations/zep.md`](integrations/zep.md). Walk
through it conversationally:

- **CLI (`zepctl`)** — check `zepctl version` first; if missing, install via Homebrew
  (`brew tap getzep/zepctl https://github.com/getzep/zepctl.git && brew install
zepctl`). Then authenticate: have them create a Zep project + API key at
  https://app.getzep.com and run `zepctl config add-profile production` (stores the key
  in the keychain). Confirm with `zepctl project get`.
  Set `ZEP_API_KEY` in `.env.local` to also enable chat memory (the `/chat`
  agent retrieves the user's long-term context and logs each turn to their
  Zep graph; see [`docs/integrations/zep.md`](integrations/zep.md)).
- **Docs MCP (`zep-docs`)** — same **detect → ask → add** rule as the Supabase MCP
  (step 4): run `claude mcp list`, look for `docs-mcp.getzep.com`, and **only on an
  explicit yes** run `claude mcp add zep-docs --transport http
https://docs-mcp.getzep.com/mcp`. It's a public docs endpoint — nothing secret to
  commit.

## 10. (Optional) Make it yours — the design system

- Your app's look (colors, typography, components) is documented in
  [`DESIGN.md`](../DESIGN.md). It mirrors the live theme in `app/globals.css` and
  shows which token maps to which CSS variable.
- To rebrand, edit the HSL variables in `app/globals.css` directly, then update the
  matching tokens in `DESIGN.md` and run `npm run design:lint` to validate.

## Setup Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with Supabase credentials
- [ ] Supabase project created & connected
- [ ] Supabase MCP connected via OAuth (or SQL Editor / CLI fallback chosen)
- [ ] Database schema applied from `supabase/migrations/` (`tasks` table with
      `user_id` + RLS, + any custom tables)
- [ ] Auth providers configured (Email; optionally Google/GitHub)
- [ ] App runs locally: signup → `/tasks` → sign out all work end-to-end
- [ ] `npm test` passes
- [ ] _(Optional)_ n8n chat connected: `API_KEY` Header Auth + production
      `/webhook/` URL set, `/chat` streams a real reply
- [ ] _(Optional)_ Zep connected: `zepctl` installed & authenticated
      (`zepctl project get` works), `zep-docs` MCP added if wanted
- [ ] **Cleanup done:** this file removed & Project Overview rewritten for the real project
