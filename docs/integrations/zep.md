# Integration: Zep Knowledge Graph

[Zep](https://www.getzep.com) is a **knowledge-graph memory** service for AI agents:
it ingests conversations and documents, extracts entities/facts/relationships, and
lets you query that graph for context later. This template doesn't ship app code that
calls Zep — instead you get two **developer tools** so you (and the AI agent) can work
with a Zep project directly: the **`zepctl` CLI** and the **`zep-docs` MCP server**.

Both are **optional** and **per-developer** (not committed to the repo, like the
Supabase MCP). Each student connects their own Zep project and credentials.

---

## 1. `zepctl` — the Zep CLI

`zepctl` administers a Zep project from the terminal: users, threads, graphs, nodes,
edges (facts), episodes (source data), and ontology.

### Install (macOS)

**Homebrew (recommended):**

```bash
brew tap getzep/zepctl https://github.com/getzep/zepctl.git
brew install zepctl
```

**Binary fallback:** download the macOS binary from the
[releases page](https://github.com/getzep/zepctl/releases). If macOS quarantines it:

```bash
xattr -d com.apple.quarantine /path/to/zepctl
```

Verify the install:

```bash
zepctl version
```

### Authenticate

You need a Zep account and a project API key from the
[Zep dashboard](https://app.getzep.com). Then either:

- **Profile (recommended)** — stores the key in your **system keychain** (macOS
  Keychain), never in plain text:

  ```bash
  zepctl config add-profile production   # prompts for the API key securely
  zepctl config get-profiles             # confirm it's set & active
  ```

- **Environment variable** — for CI or non-keychain shells:

  ```bash
  export ZEP_API_KEY=your_key_here
  ```

Confirm you're connected:

```bash
zepctl project get
```

### Key commands

| Command                         | Manages                                            |
| ------------------------------- | -------------------------------------------------- |
| `zepctl graph`                  | knowledge graphs                                   |
| `zepctl node` / `zepctl edge`   | graph nodes & edges (facts / relationships)        |
| `zepctl episode`                | episodes (the source data ingested into the graph) |
| `zepctl ontology`               | entity / edge type definitions                     |
| `zepctl user` / `zepctl thread` | users & conversation threads                       |
| `zepctl summary-instructions`   | per-user summary instructions                      |
| `zepctl task`                   | async tasks                                        |
| `zepctl project`                | project settings                                   |

Global flags: `-o json|yaml|table|wide` (output format), `-p <profile>` (switch
profile), `-q` (quiet), `-v` (verbose). Run `zepctl <command> --help` for details.

---

## 2. `zep-docs` — the documentation MCP server

The `zep-docs` MCP server gives the AI agent live access to Zep's documentation, so
answers about Zep APIs/CLI stay current. **Check first, then ask — never install it
silently** (the student may already have it, and a duplicate server is confusing):

1. **Detect.** Run `claude mcp list` and look for a `zep-docs` entry (URL contains
   `docs-mcp.getzep.com`). If it's there and `✓ Connected`, you're done.
2. **Ask.** If none is found, ask the student whether they'd like to add it. **Only on
   an explicit yes**, run:

   ```bash
   claude mcp add zep-docs --transport http https://docs-mcp.getzep.com/mcp
   ```

   This is a **public docs endpoint** — no API key or OAuth, nothing secret to commit.
   Use `--scope user` to make it available across all their projects instead of just
   this one.

3. **Verify** with `claude mcp list` (expect `zep-docs … ✓ Connected`). The MCP tools
   become available the next time the Claude Code session reconnects its servers.

---

## 3. App integration: chat memory

When `ZEP_API_KEY` is set, the chat scaffold (`app/api/chat/route.ts`) uses Zep in
the **n8n-connected path** (not placeholder mode):

- **Before** calling n8n it fetches the signed-in user's long-term context with
  `thread.getUserContext(sessionId)` **and** prepends a `<USER_SUMMARY>` block built
  from the user node (`user.getNode`), so the summary is included even when the Zep
  project's context-block summary toggle is off. The combined block is added to the
  n8n request body as `context` — wire it into your agent prompt with
  `{{ $json.body.context }}`.
- **After** the reply streams back it records the turn (user message + assistant
  reply) to the user's Zep thread (`sessionId`). Assistant replies are **kept in
  thread history** but **excluded from graph ingestion** (`ignoreRoles: ['assistant']`),
  so extracted facts are attributed to the user, not the assistant. (The n8n agent
  paraphrases the user; ingesting its replies mis-attributed facts to the assistant
  entity, e.g. "Assistant has a CS degree".)

The retrieved `context` is passed to n8n only — it is **never** written back to
Zep, so already-extracted facts aren't re-ingested. Every Zep call is best-effort:
if the key is unset or Zep is unavailable, the chat works exactly as before. Set
`ZEP_API_KEY` in `.env.local` (server-side only).

---

## 4. App integration: the `/memory` learning page

The `/memory` route (in the nav after **Design**) is a student-facing page that
teaches long-term memory + knowledge graphs in plain language, then lets students
explore **their own** Zep graph live. It's backed by two server routes and one
shared helper (`lib/zep/graph-search.ts`):

- **`GET /api/memory/summary`** → `fetchUserSummary(client, userId)` returns the
  signed-in user's user-node summary (their long-term memory). Rendered by
  `UserSummaryCard`.
- **`POST /api/memory/search`** (`{ query }`, Zod-validated, ≤400 chars) →
  `searchUserGraph(client, userId, query)` runs an **auto search**
  (`graph.search({ scope: 'auto', returnRawResults: true })`). Auto scope lets Zep
  compose the most relevant context across edges, nodes, episodes, observations,
  and thread summaries into a single `context` block, and the raw
  edges/nodes/episodes are surfaced so students see what fed it. Rendered by
  `GraphSearchExplorer` (with starter sample queries).

Both routes resolve the user from the **server Supabase session** and pass
`user.id` to Zep — a browser-supplied id is never trusted, so a student can only
ever read/search their own graph. `ZEP_API_KEY` stays server-side; if it's unset
the routes return **503** and the page explains how to enable the tools. Unlike
the chat helpers (which swallow errors), these surface failures so students can
see exactly what happened.

---

## Notes

- **Per-developer, not committed.** `zepctl`'s key lives in the keychain; the MCP
  server lives in the user's Claude config — neither is in the repo. This mirrors how
  the Supabase MCP is handled (see `.claude/rules/database.md`).
- **Use the docs MCP for "how do I…" Zep questions; use `zepctl` to act** on a project.
