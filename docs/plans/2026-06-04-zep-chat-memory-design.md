# Design: Zep chat memory for the n8n chat scaffold

**Date:** 2026-06-04
**Status:** Approved (brainstorming) — ready for implementation planning
**Branch:** `claude/fervent-ardinghelli-c0fb52`

## Summary

Wire the template's streaming chat (`/api/chat` → n8n) into a **Zep knowledge
graph** so that:

1. **Before** calling n8n, we retrieve the signed-in user's long-term context from
   Zep (`thread.getUserContext`) and pass it into the n8n request alongside the user
   message. This pulls in durable memory — facts older than the agent's recent
   message window, and knowledge from the user's _other_ threads.
2. **After** the agent replies, we record the turn (user message + assistant reply)
   to the user's Zep thread, which ingests both into the user-level knowledge graph.

It is an **optional, env-gated template feature**: dormant unless `ZEP_API_KEY` is
set, active only in the real (n8n-connected) chat path, and it must **never** delay
or break the chat stream.

## Decisions (from brainstorming)

- **Scope:** reusable template feature, gated on `ZEP_API_KEY`. Chat works unchanged
  when the key is absent. Tests + docs required.
- **Graph ingestion:** user messages feed the graph; assistant replies are kept in
  thread history but **excluded** from graph extraction via `ignoreRoles: ['assistant']`.
  (Reversed from the initial "ingest both" decision after live testing showed the
  agent's paraphrases created facts mis-attributed to the assistant entity, e.g.
  "Assistant has a CS degree".)
- **When active:** only in the n8n-connected branch. Placeholder/mock turns are never
  written to Zep.
- **Retrieval ordering:** low-latency — retrieve, call n8n, then write both messages
  after the reply. Current-turn recency is already covered by the agent's own message
  window; Zep's job here is long-term / cross-thread memory, and
  `getUserContext` searches the user's entire graph regardless of ordering.
- **No feedback loop (critical invariant):** the retrieved context block is passed
  _only_ to the n8n request. It is **never** written back to Zep. `recordChatTurn`
  receives only the raw user text and the raw assistant reply, so already-extracted
  facts are not re-ingested and amplified over time.

## Zep API (TypeScript, `@getzep/zep-cloud`)

- `new ZepClient({ apiKey })`
- `client.thread.getUserContext(threadId)` → `{ context: string }` — a pre-formatted
  block (user summary + relevant facts with date ranges), assembled from the user's
  whole graph and ranked by recent thread messages.
- `client.user.add({ userId, firstName?, lastName?, email? })` — idempotent in
  practice; "already exists" is swallowed.
- `client.thread.create({ threadId, userId })` — ditto.
- `client.thread.addMessages(threadId, { messages })` where each message is
  `{ content, role: "user" | "assistant", name }`. This both appends to thread
  history and ingests into the user-level knowledge graph.

## Architecture & data flow

```
Browser (useChat, sends sessionId)
  └─ POST /api/chat
       1. Zod-validate (unchanged). sessionId → Zep threadId.
       2. n8n branch only, and only when ZEP_API_KEY is set:
          ┌─ RETRIEVE (blocking, timeout-guarded ~3s) ──────────────┐
          │  ctx = retrieveUserContext(client, threadId)            │
          │   = zep.thread.getUserContext(threadId).context         │
          │   first turn / failure / timeout → ctx = ""             │
          └─────────────────────────────────────────────────────────┘
       3. POST n8n  body: { message, context: ctx, sessionId, messages }
       4. Stream n8n reply → client (tee: pass-through + accumulate text)
          ┌─ WRITE (background, after stream close, via next `after()`) ┐
          │  getUser() → recordChatTurn(client, {                       │
          │     supabaseUser, threadId, userText, assistantText })      │
          │  = user.add → thread.create → addMessages([user,assistant]) │
          │  best-effort; "already exists" swallowed; never throws      │
          └──────────────────────────────────────────────────────────────┘
  └─ placeholder branch: untouched. No ZEP_API_KEY: untouched.
```

- **One blocking Zep call** on the critical path (`getUserContext`), timeout-guarded.
  Failure → empty context, chat proceeds. The stream is never blocked or broken.
- **Writes happen after the reply** via Next's `after()`, so they never delay the
  client. Single batch `addMessages([user, assistant])`.
- **New n8n contract:** the request body gains a `context` string. The n8n workflow
  injects it into the agent prompt (e.g. `{{ $json.body.context }}`). Existing
  `message` / `sessionId` / `messages` fields are unchanged, so current workflows keep
  working and simply ignore `context` until wired in.
- **Identity:** Zep `userId` = Supabase `user.id`; `email` / name from the Supabase
  user (`user_metadata` for name when present). Message `name`: user → display
  name/email, assistant → `"Assistant"`.

## Components & module layout

Route stays thin (300-line file / ~50-line function limits apply). New code in
`lib/zep/`, testable in isolation:

```
lib/zep/
├── client.ts        # getZepClient(): ZepClient | null
│                     #   null when ZEP_API_KEY unset → feature dormant.
│                     #   Factory (no module-level instantiation), mirrors the
│                     #   Supabase client pattern so the app builds without the key.
├── identity.ts      # toZepUser(supabaseUser): { userId, email?, firstName?, lastName? }
│                     #   pure mapping helper.
└── chat-memory.ts   # retrieveUserContext(client, threadId): Promise<string>
                      #     getUserContext + timeout guard; "" on any failure.
                      #   recordChatTurn(client, { supabaseUser, threadId,
                      #     userText, assistantText }): Promise<void>
                      #     user.add → thread.create → addMessages([user, assistant]);
                      #     swallows "already exists"; never throws.
                      #   (extract stream-capture helper to lib/zep/stream-capture.ts
                      #    if the route branch grows past comfortable size.)
```

Route changes confined to the n8n branch of `app/api/chat/route.ts`:

1. `getZepClient()`. If non-null, `await retrieveUserContext(client, sessionId)`
   (timeout-guarded) and add `context` to the n8n request body.
2. Tee the response stream through a `TransformStream` that passes chunks to the
   client and accumulates decoded assistant text.
3. In `after()`, pull the Supabase user via the existing server client and call
   `recordChatTurn(...)` with the accumulated text.

**Dependency:** add `@getzep/zep-cloud` (verify current version before installing).

## Error handling (chat must never break)

- `getZepClient()` → `null` without the key → feature skipped, behavior identical to
  today.
- `retrieveUserContext` wraps `getUserContext` in try/catch **and** a ~3s timeout
  (`Promise.race`); failure/timeout → `""`.
- `recordChatTurn` runs in `after()` (off the response path); fully try/caught;
  "already exists" conflicts swallowed; errors logged via `lib/logger`, never thrown.
- No Zep failure mode can delay the first token or error the stream.

## Testing (TDD — RED before GREEN; ≥ 80% coverage)

- `tests/unit/lib/zep/test_client.test.ts` — null without key; instance with key.
- `tests/unit/lib/zep/test_identity.test.ts` — Supabase → Zep user mapping (email,
  name from metadata, missing-name case).
- `tests/unit/lib/zep/test_chat_memory.test.ts` (mock `@getzep/zep-cloud`):
  - `retrieveUserContext` returns the context string; `""` on throw and on timeout.
  - `recordChatTurn` calls `user.add` → `thread.create` → `addMessages` in order;
    swallows "already exists"; never throws on failure; **asserts logged messages
    contain only the raw user/assistant text, not the retrieved context block.**
- `tests/integration/api/test_chat_zep.test.ts` (mock SDK + n8n `fetch`):
  - With key + n8n: stream passes through unchanged; n8n body includes `context`;
    `recordChatTurn` invoked with the streamed assistant text after completion.
  - Without key: Zep never touched; chat streams as before.

## Out of scope (YAGNI)

- `graph.search(query)` for sharper current-query relevance — `getUserContext` is
  enough for v1; note it as a documented extension point.
- Custom context templates (`context.createContextTemplate`).
- Logging in placeholder mode.
- Per-user summary instructions, ontology, graph management UI.

## Docs to update

- `.env.example` — add commented `ZEP_API_KEY` (server-side only).
- `docs/integrations/zep.md` — add an "App integration: chat memory" section (env
  var, the n8n `context` body field + `{{ $json.body.context }}` wiring, the
  no-feedback-loop note).
- `docs/getting-started.md` — mention the env var in the optional Zep step.
- `CLAUDE.md` — regenerated AUTO sections (new `lib/zep/*` modules) via pre-commit.
