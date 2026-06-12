---
description: Supabase @supabase/ssr clients, RLS, auth/middleware
globs: 'lib/supabase/**,app/auth/**,app/api/**,proxy.ts'
---

# Database & Auth — Supabase (applies to `lib/supabase/**`, `app/auth/**`, `app/api/**`, `proxy.ts`)

## Clients (`@supabase/ssr`)

Cookie-aware clients live in `lib/supabase/`. Both are **factory functions** (no module-level
instantiation) so the app still builds without credentials.

- **Server client** (`lib/supabase/server.ts`, `await createClient()`): use in Server
  Components, Route Handlers, and Server Actions — it carries the user's session so RLS
  applies. Note: `cookies()` is **async** in Next 16 — `await` it.
- **Browser client** (`lib/supabase/client.ts`): use **only** in Client Components.

## Data access & security

- **RLS enforces all access control.** The `tasks` table is **user-scoped** (`user_id` +
  per-user policies); queries run as the signed-in user via the server client, so users only
  see their own rows. Principle of least privilege.
- **Schema & migrations**: version-controlled SQL under `supabase/migrations/` is the
  **single source of truth** for the schema (kept in sync with `types/supabase.ts`). Apply
  it via the **Supabase MCP server** (`apply_migration`, `list_tables`, advisors), the
  Supabase CLI (`supabase db push`), or the SQL Editor. Any schema change adds/edits a
  migration file there. The Supabase MCP is **not** committed to the repo — add it on
  demand (`claude mcp add --transport http --scope user supabase https://mcp.supabase.com/mcp`,
  remote + OAuth, no token to commit) after checking it isn't already configured; never
  point it at production data.
- **Type safety**: regenerate `types/supabase.ts` after schema changes (Supabase MCP
  `generate_typescript_types` or the Supabase CLI).

## Authentication

- **Protected by default**: `proxy.ts` (via `lib/supabase/middleware.ts`) refreshes the
  session on every request and redirects unauthenticated users to `/login`. Public paths:
  `/login`, `/signup`, `/auth/*`, and static assets.
- **Methods**: email/password via **server actions** (`app/login/actions.ts`) and **OAuth**
  (Google/GitHub) via the browser client in `app/components/OAuthButtons.tsx` (must be
  client-initiated — it redirects).
- **Routes**: `app/auth/callback` (OAuth/PKCE code exchange), `app/auth/confirm`
  (email/magic-link `verifyOtp`), `app/auth/signout` (POST).
- **Auth state in the UI**: read the user with the browser client (`getUser()` +
  `onAuthStateChange`) in Client Components (see `Navigation.tsx`). **Never trust the client
  for authorization** — RLS + the server client are the real gate.
