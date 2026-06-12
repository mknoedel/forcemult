# Integration: n8n LLM Agent Streaming

This template ships a working scaffold that calls an **n8n** workflow over an
HTTP webhook and **streams an LLM agent's response back to the UI**
token-by-token. Files: `app/api/chat/route.ts` (server) and `app/chat/page.tsx`
(client chat UI).

- **Architecture**: Chat UI (`useChat`) → Next.js Route Handler
  (`app/api/chat/route.ts`) → n8n Webhook (AI Agent node with streaming) →
  response streamed back through the route handler to the browser. **Always
  proxy through the route handler** — the n8n webhook URL/secret stay
  server-side (`N8N_WEBHOOK_URL` / `N8N_WEBHOOK_SECRET`); never call n8n from
  the browser.
- **Placeholder mode**: When `N8N_WEBHOOK_URL` is unset, the route streams a
  mock reply (via `simulateReadableStream`) so the UI works before n8n is
  connected. Set the env var to switch to the real agent.
- **Streaming transport**: The **Web Streams API** (built into Next.js /
  Node 20+ and the browser). The route forwards the upstream `ReadableStream`
  as a plain text stream via `createTextStreamResponse`; the client consumes
  it with the AI SDK's `TextStreamChatTransport`.
- **Installed dependencies**:
  - `ai` + `@ai-sdk/react` — `useChat` hook + streaming helpers.
  - `zod` — request-body validation.
  - `react-markdown` + `remark-gfm` — render streamed assistant markdown
    safely (no `dangerouslySetInnerHTML`).
- **Authentication — Header Auth (`API_KEY`)**: the route authenticates to n8n
  by sending an **`API_KEY` request header** whose value is
  `N8N_WEBHOOK_SECRET`. In n8n, add a **Header Auth credential** with header
  name `API_KEY` and attach it to the Webhook node. (The header name is fixed to
  `API_KEY` in `app/api/chat/route.ts` — the shared convention for this
  template. It is **not** sent as a bearer token.) If `N8N_WEBHOOK_SECRET` is
  unset, no auth header is sent.
- **Session memory (`sessionId`)**: the chat page generates a stable
  `sessionId` per browser session (`crypto.randomUUID()`) and sends it in the
  request body; the route forwards it to n8n. Wire it into your AI Agent's
  **memory** node (e.g. keyed by `{{ $json.body.sessionId }}`) so the agent
  remembers earlier turns in the same conversation.

## Chat sessions (history sidebar)

The chat page has a sidebar that lists past conversations and lets the user
switch between them. It is backed by two Supabase tables that the migration
`supabase/migrations/20260604000000_n8n_chat_sessions_and_history.sql` creates
(see [SUPABASE_SETUP.md](../../SUPABASE_SETUP.md)). The boundary is simple:
**n8n writes these tables, the app only reads them.**

- **Webhook body now includes `userId`**: in addition to `message`,
  `sessionId`, and `messages`, `app/api/chat/route.ts` forwards `userId` — the
  signed-in user's id — so the n8n workflow can attribute a session to its
  owner. Read it in n8n as `{{ $json.body.userId }}`.
- **Upsert a session row (n8n's job)**: on the **first** message of a new
  `sessionId`, the workflow must **upsert** a row into **`n8n_chat_sessions`**
  with:
  - `session_id` — from `{{ $json.body.sessionId }}`
  - `user_id` — from `{{ $json.body.userId }}`
  - `name` — a short, descriptive title (e.g. an LLM-generated summary of the
    first message) shown in the sidebar.

  Do this insert with the **service-role / Postgres connection** so it bypasses
  RLS (the row's `user_id` is supplied explicitly from the body, not from a
  session). Use an upsert keyed on the unique `session_id` so re-runs don't
  duplicate the row.

- **History is the standard LangChain memory table**: conversation messages live
  in **`n8n_chat_histories`** — the table n8n's **Postgres Chat Memory** node
  reads and writes, keyed by `session_id`. Each row is one LangChain message
  (`message` jsonb, `{type, content}`). Point the memory node at this table and
  it fills automatically as the agent runs. The Postgres Chat Memory node needs a
  **Postgres credential pointing at your Supabase database via the session
  pooler** — see [SUPABASE_SETUP.md → 2b. Connect n8n to Postgres](../../SUPABASE_SETUP.md)
  for the exact host/port/user fields.
- **The app reads, never writes**: the sidebar list comes from
  **`n8n_chat_sessions`** (live via **Supabase Realtime** — that table is in the
  `supabase_realtime` publication), and selecting a session loads its messages
  from **`n8n_chat_histories`**. Both reads go through the **RLS-scoped browser
  client**, so a student only ever sees their own sessions and history.
- **Response format — NDJSON (handled for you)**: n8n's AI Agent streams
  **newline-delimited JSON**, one record per line:
  `{"type":"begin",...}` / `{"type":"item","content":"…"}` / `{"type":"end",...}`.
  `lib/n8n-stream.ts` (`createN8nTextStream`) parses this in the route —
  concatenating the `content` of `item` records (escaped `\n` decoded into real
  newlines) — so the chat bubble shows clean markdown, not raw JSON. Plain-text
  workflows (non-JSON lines) pass through unchanged, so you normally **don't**
  need to touch the parser.
- **n8n config**: On the **AI Agent** node, enable the streaming response
  option and respond through the webhook. **Activate** the workflow (toggle it
  **Active**) so the production webhook is live.
- **Webhook URL — use the production URL**: set `N8N_WEBHOOK_URL` to the
  **`/webhook/<id>`** (production) URL — it's always live while the workflow is
  Active. The **`/webhook-test/<id>`** URL only accepts **one** request per
  click of **"Execute workflow"** in the editor (it returns
  `404 "webhook not registered"` otherwise) — handy for one-off manual tests,
  not for the running app.
- **Env**: `N8N_WEBHOOK_URL` (and optional `N8N_WEBHOOK_SECRET`) live in
  `.env.local`; placeholders are in `.env.example`. Env changes require a dev
  server restart. Note `/api/chat` is login-gated, so test it from the chat UI
  while signed in (not an anonymous `curl` to the Next.js route).
