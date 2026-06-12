# Supabase Setup (Database + Authentication)

This template includes a working Supabase integration showing how to build a
**login-controlled** full-stack app: cookie-based auth (email/password + OAuth),
protected routes, and per-user database CRUD operations.

## 📋 What's Included

- **Auth clients** (`lib/supabase/{client,server,middleware}.ts`) - Cookie-aware
  Supabase clients for the browser, the server, and the auth middleware (`@supabase/ssr`)
- **Route protection** (`proxy.ts`) - Redirects unauthenticated users to `/login`
- **Auth pages & routes** (`app/login`, `app/signup`, `app/auth/*`) - Email/password +
  Google/GitHub sign-in, sign-out, and OAuth/email callbacks
- **TypeScript Types** (`types/supabase.ts`) - Type-safe database schema definitions
- **API Routes** (`app/api/tasks/`) - RESTful, per-user CRUD endpoints (require auth)
- **UI Page** (`app/tasks/page.tsx`) - Interactive task management interface

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the database to be provisioned (~2 minutes)

### 1a. Connect the Supabase MCP (recommended)

This lets Claude manage your database directly — create tables, apply
migrations, inspect the schema, and regenerate types — instead of you pasting
SQL by hand. The Supabase MCP is the **remote server** at
`https://mcp.supabase.com/mcp`, authenticated with **OAuth** (a browser window
authorizes your Supabase account — there is **no access token to copy or
paste**).

The template does **not** commit an MCP config; you add the server yourself
(this avoids duplicating one you may already have). First check, then add:

1. **Already configured?** Run `claude mcp list` (or `claude mcp get supabase`).
   If a server pointing at `mcp.supabase.com` is listed, you're set.
2. **Add it (user scope):**

   ```bash
   claude mcp add --transport http --scope user supabase https://mcp.supabase.com/mcp
   ```

   `--scope user` makes it available across all your projects without committing
   anything to this repo. The first use opens the OAuth browser flow.

3. **Verify:** ask Claude _"list my Supabase tables using the MCP."_

- **Scope it to one project (recommended).** Append `?project_ref=YOUR_REF` to
  the URL above, where `YOUR_REF` is the subdomain of your Project URL
  (`https://YOUR_REF.supabase.co`). Add `&read_only=true` while you're only
  exploring (drop it when you need to apply migrations).

> ⚠️ **Never point the MCP at production data.** The Supabase MCP is intended for
> development and testing projects only. Use a dedicated dev project, and prefer
> `read_only=true` unless you're actively applying migrations.

### 2. Create the Tasks Table

The schema lives in version control as a migration — the **single source of
truth**, kept in sync with `types/supabase.ts`:

```
supabase/migrations/20250101000000_create_tasks_table.sql
```

Apply it using **any one** of these (they all run the same SQL):

- **Supabase MCP (recommended — let Claude do it):** once the MCP is connected
  (see [§1a](#1a-connect-the-supabase-mcp-recommended)), ask Claude to apply the
  migration. It reads the `.sql` file above and calls `apply_migration` (named
  `create_tasks_table`), so it's tracked in your project's migration history.
- **Supabase CLI:** `supabase link --project-ref <ref>` then `supabase db push`.
- **SQL Editor (manual):** open **SQL Editor → New Query** in the dashboard,
  paste the contents of the migration file, and click **Run**.

For reference, the migration creates a user-scoped table with per-user RLS:

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
```

> No seed rows are inserted: tasks belong to a user, so `auth.uid()` must be set
> (which only happens when a signed-in user inserts via the app). Sign in and
> create tasks from the `/tasks` page instead.
>
> **When you change the schema**, edit/add a migration file under
> `supabase/migrations/`, re-apply it, then regenerate `types/supabase.ts` (MCP
> `generate_typescript_types`, or the Supabase CLI) so the types stay in sync.

### 2a. Create the n8n Chat Tables (optional — for the chat history sidebar)

The n8n streaming chat (see [docs/integrations/n8n.md](docs/integrations/n8n.md))
can persist conversations so the chat page can show a **session sidebar**. That
feature is backed by a second migration:

```
supabase/migrations/20260604000000_n8n_chat_sessions_and_history.sql
```

Apply it the same way as the tasks migration (MCP `apply_migration`, the
Supabase CLI, or the SQL Editor). It creates two tables:

- **`n8n_chat_sessions`** — one row per conversation, tying a persistent
  `session_id` (text, unique) to its owner `user_id` and a descriptive `name`
  shown in the sidebar (plus `created_at` / `updated_at`). The n8n workflow
  **inserts** these rows via its service-role connection (so it bypasses RLS);
  the app only reads them. RLS ships with the same four per-user policies as
  `tasks` (`auth.uid() = user_id` for select/insert/update/delete). The table is
  added to the **`supabase_realtime`** publication so the sidebar updates live as
  new sessions appear.
- **`n8n_chat_histories`** — the standard LangChain **Postgres Chat Memory**
  table n8n's AI Agent memory node reads and writes (`id` serial, `session_id`
  varchar, `message` jsonb). RLS here uses an **ownership-scoped read policy**:
  a user may `SELECT` a history row only if they own the matching
  `n8n_chat_sessions.session_id`. n8n writes the rows; the app reads them through
  the RLS-scoped browser client.

> **Naming note:** a Supabase project may also have its own unrelated
> `chat_sessions` / `chat_messages` tables. This feature does **not** use them —
> the `n8n_`-prefixed names exist precisely to avoid that collision.

### 2b. Connect n8n to Postgres (session pooler)

For the chat history sidebar to have anything to show, **n8n must write the
conversation into these tables**. n8n's AI Agent stores memory with a **Postgres
Chat Memory** node (which reads/writes `n8n_chat_histories`), and your workflow
upserts a row into `n8n_chat_sessions` on the first message of a session. Both
need a Postgres credential in n8n that points at your Supabase database.

Use the **Session pooler** connection (it is IPv4-proxied for free — n8n Cloud
connects over IPv4, whereas Supabase's _Direct connection_ is IPv6-only).

**Get the connection details from Supabase:**

1. In your project dashboard, click **Connect** (top bar).
2. Choose **Direct → Connection string**.
3. Under **Connection Method**, select **Session pooler**.
4. Supabase shows the `host`, `port`, `database`, and `user`. Copy _your_ values
   — the host prefix (`aws-0` vs `aws-1`) and region differ per project.

It looks like this (example project ref `iylnmehjvvtrgvobtglx`, region
`us-east-1`):

```
postgresql://postgres.<project-ref>:[YOUR-PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres
```

**Create a Postgres credential in n8n** with these fields (map the values above):

| n8n field                         | Value                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Host**                          | `aws-<n>-<region>.pooler.supabase.com` (yours from step 4)                                                                                              |
| **Database**                      | `postgres`                                                                                                                                              |
| **User**                          | `postgres.<project-ref>`                                                                                                                                |
| **Password**                      | your **database password** (Dashboard → **Settings → Database**; reset it there if you don't have it — note that resetting breaks existing connections) |
| **Port**                          | **`5432`** (session pooler)                                                                                                                             |
| **Maximum Number of Connections** | `100`                                                                                                                                                   |
| **SSL**                           | `Disable` (tick **Ignore SSL Issues** if your n8n requires it)                                                                                          |
| **SSH Tunnel**                    | off                                                                                                                                                     |

> **Port gotcha:** the **session pooler is `5432`**. Supabase also offers a
> **transaction pooler on port `6543`** (same host); that works too, but stick to
> the session pooler (`5432`) here unless you have a specific reason. If you see
> `6543` in an example, that's the transaction pooler — same database, different
> pooling mode.

**Wire it into the agent:** in your n8n AI Agent, attach the **Postgres Chat
Memory** node using this credential and key it on the session id the app sends —
`{{ $json.body.sessionId }}`. That makes the agent persist each turn into
`n8n_chat_histories` under the same `session_id` the sidebar reads back. See
[docs/integrations/n8n.md](docs/integrations/n8n.md) for the full chat/session
contract (including the `n8n_chat_sessions` upsert and the forwarded `userId`).

> **Security:** this database password lives **only** in the n8n credential
> (server-side). Never put it in the Next.js app, `.env.local`, or the browser —
> the app talks to Supabase through the anon key + RLS, not this connection.

### 3. Configure Environment Variables

1. In your Supabase project dashboard, click on **Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy your **Project URL** and **anon/public key**

#### Using a .env.local File

1. Create a `.env.local` file in the project root (you can copy `.env.example`)
2. Add your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**⚠️ IMPORTANT:** Never commit the `.env.local` file to Git! It's already in `.gitignore`.

When deploying, add the same variables in your hosting provider's environment
settings, plus `NEXT_PUBLIC_SITE_URL` (your production URL) so OAuth and email
links redirect correctly.

### 4. Configure Authentication

The whole app is login-controlled: visiting any page while signed out redirects
to `/login`. Set up the sign-in methods in your Supabase dashboard.

**Email / password**

1. Go to **Authentication → Providers → Email** and make sure it's enabled.
2. For local development, **turn OFF "Confirm email"** so new signups work
   immediately. (Leave it on in production — `/auth/confirm` handles the
   confirmation link.)

**Google / GitHub OAuth**

1. Go to **Authentication → Providers** and enable **Google** and/or **GitHub**.
2. Create an OAuth app with each provider and paste the **Client ID** and
   **Client Secret** into Supabase.
3. Go to **Authentication → URL Configuration** and add these **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirm`
   - your production equivalents (e.g. `https://your-app.com/auth/callback`)

> Don't want OAuth yet? Email/password works on its own — the Google/GitHub
> buttons simply won't function until their providers are enabled.

### 5. Test the Integration

1. Restart your Next.js development server.
2. Navigate to [http://localhost:3000](http://localhost:3000) — you'll be
   redirected to `/login`.
3. Go to `/signup`, create an account, and you'll land on the home page with
   your email shown in the nav.
4. Visit [http://localhost:3000/tasks](http://localhost:3000/tasks) and:
   - ✅ Create new tasks
   - ✅ Mark tasks as complete/incomplete
   - ✅ Delete tasks
   - ✅ See different priority levels
5. Click **Sign Out** — you're returned to `/login` and protected pages are
   no longer accessible.

## 🔒 Security Best Practices

### Row Level Security (RLS)

This template ships **per-user RLS** out of the box (see the table SQL above):
each policy checks `auth.uid() = user_id`, so users can only read and modify
their own rows. Because the API routes use the cookie-aware server client
(`lib/supabase/server.ts`), the signed-in user is passed to the database and
these policies are enforced automatically — even though the app only ever uses
the public anon key. This is the correct, safe pattern: never ship a permissive
`USING (true)` policy to production.

### Environment Variables

- Use your hosting provider's environment settings in production (not committed `.env` files)
- Never commit API keys to your repository
- Use `NEXT_PUBLIC_` prefix only for client-side variables
- Keep server-only secrets without the prefix

## 📚 Code Structure

```
.
├── proxy.ts                     # Refreshes the session & protects routes
├── lib/
│   └── supabase/
│       ├── client.ts            # Browser client (Client Components)
│       ├── server.ts            # Server client (Server Components/Actions/Routes)
│       └── middleware.ts        # updateSession() used by proxy.ts
├── types/
│   └── supabase.ts              # Database type definitions (incl. user_id)
├── app/
│   ├── login/                   # Login page + email/password server actions
│   ├── signup/                  # Signup page
│   ├── auth/
│   │   ├── callback/route.ts    # OAuth/PKCE code exchange
│   │   ├── confirm/route.ts     # Email-confirmation / magic link
│   │   └── signout/route.ts     # POST sign-out
│   ├── components/
│   │   └── OAuthButtons.tsx     # Google/GitHub buttons
│   ├── api/
│   │   └── tasks/
│   │       ├── route.ts         # GET /api/tasks, POST /api/tasks (per-user)
│   │       └── [id]/
│   │           └── route.ts     # PATCH/DELETE /api/tasks/:id (per-user)
│   └── tasks/
│       └── page.tsx             # Tasks UI page
└── .env.example                 # Environment variable template
```

## 🧪 API Endpoints

All task endpoints require an authenticated session and return `401 Unauthorized`
when signed out. Each operation is automatically scoped to the current user.

### GET /api/tasks

Fetch the current user's tasks, ordered by creation date (newest first)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "completed": false,
      "priority": "high",
      "created_at": "2024-11-08T12:00:00Z",
      "updated_at": "2024-11-08T12:00:00Z"
    }
  ],
  "metadata": {
    "count": 5
  }
}
```

### POST /api/tasks

Create a new task

**Request:**

```json
{
  "title": "New task",
  "priority": "medium"
}
```

**Response:** `201 Created` with task data

### PATCH /api/tasks/:id

Update an existing task

**Request:**

```json
{
  "completed": true
}
```

**Response:** `200 OK` with updated task data

### DELETE /api/tasks/:id

Delete a task

**Response:** `200 OK` with success message

## 🎓 Learning Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [TypeScript with Supabase](https://supabase.com/docs/guides/api/generating-types)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🐛 Troubleshooting

### "Missing Supabase environment variables" Error

**Problem:** The app can't find your Supabase credentials.

**Solution:**

1. Check that you've added the environment variables (in `.env.local` or your host's environment settings)
2. Restart your development server after adding the variables
3. Verify the variable names match exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### API Returns 500 Error

**Problem:** Supabase query is failing.

**Solution:**

1. Check that the `tasks` table exists in your Supabase project
2. Verify RLS policies are set up correctly
3. Check the browser console for detailed error messages
4. Verify your Supabase credentials are correct

### Tasks Don't Appear After Creating

**Problem:** New tasks aren't showing in the list.

**Solution:**

1. Check browser console for errors
2. Verify RLS policies allow INSERT operations
3. Check Network tab to see if the POST request succeeded
4. Try refreshing the page manually

## 🚀 Next Steps

Now that you have a working database integration:

1. **Modify the Schema:** Add new columns to the tasks table
2. **Add Filtering:** Implement filter by priority or completion status
3. **Add Sorting:** Let users sort tasks by different fields
4. **Add Pagination:** Implement pagination for large task lists
5. **Add Search:** Implement full-text search on task titles
6. **Replace with Your Data:** Create your own tables and integrate them into your app

This example is yours to customize and expand upon as you build your unique application!
