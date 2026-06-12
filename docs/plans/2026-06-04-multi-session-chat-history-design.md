# Design: Multi-session chat history

**Date:** 2026-06-04
**Status:** Approved (brainstorming complete) — ready for implementation plan

## Problem

The chat UI (`app/chat/page.tsx`) only ever shows the _current_ conversation. The
`sessionId` is generated fresh on every page load (`crypto.randomUUID()`) and never
persisted, so past conversations are unreachable. Students need to see a list of their
previous chat sessions and reload any of them.

Chat history already exists in Supabase: n8n's LangChain memory node writes to
`public.n8n_chat_histories`. We need a way to (a) list a user's sessions and (b) replay a
selected session's messages.

## Key facts discovered

- **`n8n_chat_histories`** (existing, written by n8n) is the standard LangChain Postgres
  Chat Memory table:
  ```
  id          integer  (serial PK — chronological order)
  session_id  varchar  (keys messages to a conversation)
  message     jsonb    (LangChain BaseMessage: {"type":"human"|"ai","content":"..."})
  ```
  It has **no `user_id`, no timestamp**, and **RLS is disabled** (flagged critical by the
  Supabase advisor — anyone with the anon key can read every user's messages).
- The current `sessionId` is **ephemeral** and must become persistent for sessions to be
  reloadable.
- n8n writes to Supabase via a Postgres/service-role connection, which **bypasses RLS** —
  so enabling RLS on `n8n_chat_histories` does not affect n8n writes.

## Decisions (from brainstorming)

1. **Layout:** ChatGPT-style **sidebar on `/chat`** listing past sessions; click to load;
   "New chat" button.
2. **Sessions table:** new `chat_sessions` table (schema below), populated by n8n. The chat
   route will forward the signed-in `user_id` so n8n can stamp ownership.
3. **Freshness:** **Supabase Realtime** subscription on `chat_sessions` so new/renamed
   sessions appear live.
4. **History security:** **enable RLS on `n8n_chat_histories`** with an ownership SELECT
   policy, so history can be read safely from the browser client (which Realtime needs
   anyway). Fixes the critical advisor finding and keeps both tables uniformly RLS-governed.

## Data model

```sql
-- NEW: owned by the app, rows inserted by n8n
chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  text NOT NULL UNIQUE,                       -- == n8n_chat_histories.session_id
  user_id     uuid NOT NULL DEFAULT auth.uid()
                REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,                              -- descriptive name n8n generates
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
-- 4 per-user policies (select/insert/update/delete) mirroring the tasks table.

-- EXISTING: secure it
ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own session history" ON n8n_chat_histories
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM chat_sessions s
    WHERE s.session_id = n8n_chat_histories.session_id
      AND s.user_id = auth.uid()));
```

Note: n8n inserts into `chat_sessions` with a service-role connection (bypasses RLS), so it
can set `user_id` from the value forwarded by the chat route. The SELECT/UPDATE/etc policies
gate the _app's_ reads.

## Data flow

```
Browser (/chat, client component)
  ├─ browser Supabase client → SELECT chat_sessions (RLS) ........ sidebar list
  ├─ Realtime channel on chat_sessions (RLS) ................... live new/renamed sessions
  ├─ click session → SELECT n8n_chat_histories WHERE session_id (RLS) → replay bubbles
  └─ send message → /api/chat (server route) → n8n webhook
                       └─ now also forwards user_id so n8n stamps chat_sessions ownership
```

## Components & files

- **`app/chat/page.tsx`** — orchestrates sidebar + chat pane; `sessionId` as state; "New
  chat" button. Split to stay under the 300-line limit:
  - `app/components/chat/ChatSessionSidebar.tsx` — session list + Realtime subscription +
    new-chat button + active highlighting.
  - `app/components/chat/ChatMessages.tsx` — bubble rendering extracted from current page.
  - `lib/chat-history.ts` — map LangChain `message` jsonb → UI messages (human→user,
    ai→assistant; skip system/tool; tolerate malformed jsonb).
- **`app/api/chat/route.ts`** — add the signed-in `user_id` to the n8n payload (route already
  runs server-side with the user session via the server Supabase client).
- **`types/supabase.ts`** — add `chat_sessions` + `n8n_chat_histories` to `Database`; export
  `ChatSession`, history row types.
- **`supabase/migrations/2026..._chat_sessions_and_history_rls.sql`** — create `chat_sessions`
  (+RLS) and the `n8n_chat_histories` RLS policy.

**Session switching with `useChat`:** `sessionId` becomes state; rebuild
`TextStreamChatTransport` (`useMemo` on `sessionId`) so each turn posts the right session; on
switch, fetch history and `setMessages(...)`; "New chat" = fresh `crypto.randomUUID()` +
clear messages. Live streaming keeps the existing `N8N_RUN_SEPARATOR` run-separator bubble
logic; replayed history rows are already discrete, so each maps to one bubble.

## Testing (TDD — red first, in `tests/`)

- `lib/chat-history.ts` mapper — human/ai/system/tool rows, empty, malformed jsonb.
- `ChatSessionSidebar` — renders list, "New chat" click, active highlighting, realtime insert
  appends (mocked browser client).
- `app/api/chat/route.ts` — payload now includes `user_id`; unauthenticated path unchanged.
- Migration — assert RLS policies exist (or a documented manual verification step).

## Out of scope (YAGNI)

Renaming/deleting sessions from the UI (n8n owns naming), session pagination/search, message
editing, optimistic message persistence. Deferred.

## Docs to update on implementation

- `docs/integrations/n8n.md` — document the `chat_sessions` insert contract n8n must satisfy
  (session_id, user_id forwarded from the route, name) and that history is now persisted/read.
- `SUPABASE_SETUP.md` / migrations note — the new table + the `n8n_chat_histories` RLS change.
- CLAUDE.md AUTO sections regenerate via the pre-commit hook.
