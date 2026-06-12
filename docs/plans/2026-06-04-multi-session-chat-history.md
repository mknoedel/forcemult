# Multi-Session Chat History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let students see a sidebar of their past chat sessions on `/chat` and reload any conversation's history, backed by a new `n8n_chat_sessions` table and the n8n LangChain `n8n_chat_histories` memory table.

**Architecture:** A new RLS-scoped `n8n_chat_sessions` table (populated by n8n) ties a persistent `session_id` to a `user_id` + descriptive `name`. The browser Supabase client reads the session list (and subscribes to it via Realtime) and reads message history from `n8n_chat_histories` — both gated by RLS. The `/api/chat` route forwards the signed-in `user_id` to n8n so it can stamp ownership when it inserts the session row.

> **Target DB note (presto-clients, `iylnmehjvvtrgvobtglx`):** This project already has its _own_ unrelated `chat_sessions` + `chat_messages` tables, and does **not** have `n8n_chat_histories`. So (a) the new sessions table is named **`n8n_chat_sessions`** to avoid colliding with the existing `chat_sessions`, and (b) the migration **CREATEs** `n8n_chat_histories` (it isn't present) rather than altering it. The existing `chat_sessions`/`chat_messages` tables are left untouched.

**Tech Stack:** Next.js 16 App Router, TypeScript (strict), Supabase (`@supabase/ssr` browser client + Realtime + RLS), AI SDK (`useChat` + `TextStreamChatTransport`), Jest + React Testing Library.

**Design doc:** `docs/plans/2026-06-04-multi-session-chat-history-design.md`

---

## Conventions for every task

- **TDD is the law.** Write the failing test, run it RED, implement minimally, run it GREEN, commit.
- Tests live in `tests/` (mirrored tree), never colocated. 80% coverage gate.
- Run a single file during development: `npm test <path>`. Full suite before finishing.
- Keep every source file under 300 lines and functions under ~50 lines.
- Use design tokens only (no hard-coded colors) and compose `components/ui/*` primitives.
- Commit messages: conventional (`feat:`, `test:`, `docs:`, `chore:`).
- Pre-commit hooks regenerate CLAUDE.md AUTO sections — let them.

---

## Task 1: Database migration — `n8n_chat_sessions` + `n8n_chat_histories`

**Files:**

- Create: `supabase/migrations/20260604000000_n8n_chat_sessions_and_history.sql`

This is an infrastructure/SQL task. The "test" is applying it to the **presto-clients** Supabase project (`iylnmehjvvtrgvobtglx`) and confirming both tables exist with RLS enabled and the policies are present.

**Step 1: Write the migration file**

```sql
-- Migration: persistent n8n chat sessions + the n8n chat history memory table.
--
-- n8n_chat_sessions ties a persistent session_id to a user and a descriptive
-- name. Rows are INSERTED by the n8n workflow (service-role connection, which
-- bypasses RLS); the app only reads them.
--
-- n8n_chat_histories is the LangChain Postgres Chat Memory table that n8n's
-- AI Agent memory node writes to. We create it here (this project does not have
-- it yet) and add an ownership-scoped SELECT policy so the app can read history
-- safely from the browser client.
--
-- NOTE: this project already has an unrelated `chat_sessions` + `chat_messages`
-- pair; those are intentionally left untouched. The n8n-prefixed names avoid the
-- collision.

-- 1. The sessions table -------------------------------------------------------
CREATE TABLE n8n_chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL UNIQUE,                       -- == n8n_chat_histories.session_id
  user_id     UUID NOT NULL DEFAULT auth.uid()
                REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX n8n_chat_sessions_user_id_idx ON n8n_chat_sessions (user_id);

ALTER TABLE n8n_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions" ON n8n_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat sessions" ON n8n_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON n8n_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat sessions" ON n8n_chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 2. The n8n LangChain memory table ------------------------------------------
-- Standard schema n8n's Postgres Chat Memory node expects.
CREATE TABLE n8n_chat_histories (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR NOT NULL,
  message     JSONB NOT NULL
);

CREATE INDEX n8n_chat_histories_session_id_idx
  ON n8n_chat_histories (session_id);

ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- A user may read a history row only if they own the session it belongs to.
CREATE POLICY "Users can read their own session history" ON n8n_chat_histories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM n8n_chat_sessions s
      WHERE s.session_id = n8n_chat_histories.session_id
        AND s.user_id = auth.uid()
    )
  );

-- 3. Realtime: let the app subscribe to n8n_chat_sessions changes -------------
ALTER PUBLICATION supabase_realtime ADD TABLE n8n_chat_sessions;
```

**Step 2: Apply to the presto-clients project and verify**

Apply via the Supabase MCP `apply_migration` against **project `iylnmehjvvtrgvobtglx`** (name: `n8n_chat_sessions_and_history`), then:

- Run `list_tables` (verbose) on `iylnmehjvvtrgvobtglx` — confirm `n8n_chat_sessions` and `n8n_chat_histories` both exist with `rls_enabled: true`; confirm the pre-existing `chat_sessions`/`chat_messages` tables are unchanged.
- Run `get_advisors` (type `security`) — confirm no new "RLS disabled" finding was introduced for these tables.

Expected: both `n8n_chat_*` tables present; `n8n_chat_sessions` has 4 policies; `n8n_chat_histories` has the read policy; RLS enabled on both.

> If `ALTER PUBLICATION supabase_realtime ADD TABLE n8n_chat_sessions` errors because the table is already a member, that's fine — ignore and continue.

**Step 3: Commit**

```bash
git add supabase/migrations/20260604000000_n8n_chat_sessions_and_history.sql
git commit -m "feat(db): add n8n_chat_sessions and n8n_chat_histories tables with RLS"
```

---

## Task 2: Supabase types for the new tables

**Files:**

- Modify: `types/supabase.ts`

**Step 1: Add the table definitions to `Database['public']['Tables']`**

Add these two entries alongside `tasks` (keep `tasks` unchanged):

```ts
n8n_chat_sessions: {
  Row: {
    id: string;
    session_id: string;
    user_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    session_id: string;
    user_id?: string;
    name: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    session_id?: string;
    user_id?: string;
    name?: string;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
n8n_chat_histories: {
  Row: {
    id: number;
    session_id: string;
    message: Json;
  };
  Insert: {
    id?: number;
    session_id: string;
    message: Json;
  };
  Update: {
    id?: number;
    session_id?: string;
    message?: Json;
  };
  Relationships: [];
};
```

**Step 2: Export the convenience types** (append near the existing `Task` exports)

```ts
export type ChatSession =
  Database['public']['Tables']['n8n_chat_sessions']['Row'];
export type N8nChatHistory =
  Database['public']['Tables']['n8n_chat_histories']['Row'];

/** A single LangChain message as stored in n8n_chat_histories.message. */
export interface N8nStoredMessage {
  type: string; // 'human' | 'ai' | 'system' | 'tool'
  content: string;
}
```

**Step 3: Verify it type-checks**

Run: `npm run type-check`
Expected: PASS (0 errors).

**Step 4: Commit**

```bash
git add types/supabase.ts
git commit -m "feat(types): add n8n_chat_sessions and n8n_chat_histories types"
```

---

## Task 3: History mapper — `lib/chat-history.ts`

Converts stored LangChain history rows into the UI message shape the chat pane renders.

**Files:**

- Create: `lib/chat-history.ts`
- Test: `tests/unit/lib/chat-history.test.ts`

**Step 1: Write the failing test**

```ts
import { historyToUiMessages } from '@/lib/chat-history';
import type { N8nChatHistory } from '@/types/supabase';

function row(id: number, message: unknown): N8nChatHistory {
  return { id, session_id: 's1', message: message as never };
}

describe('historyToUiMessages', () => {
  it('maps human rows to user messages and ai rows to assistant messages', () => {
    const rows = [
      row(1, { type: 'human', content: 'Hello' }),
      row(2, { type: 'ai', content: 'Hi there' }),
    ];
    expect(historyToUiMessages(rows)).toEqual([
      {
        id: 'history-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
      {
        id: 'history-2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi there' }],
      },
    ]);
  });

  it('skips system and tool messages', () => {
    const rows = [
      row(1, { type: 'system', content: 'You are a bot' }),
      row(2, { type: 'tool', content: '{"result":1}' }),
      row(3, { type: 'human', content: 'Hi' }),
    ];
    const result = historyToUiMessages(rows);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('user');
  });

  it('preserves chronological order by row id', () => {
    const rows = [
      row(2, { type: 'ai', content: 'second' }),
      row(1, { type: 'human', content: 'first' }),
    ];
    const result = historyToUiMessages(rows);
    expect(result.map((m) => m.parts[0].text)).toEqual(['first', 'second']);
  });

  it('tolerates malformed or empty message payloads', () => {
    const rows = [
      row(1, null),
      row(2, 'not an object'),
      row(3, { type: 'human' }), // no content
      row(4, { type: 'ai', content: 'ok' }),
    ];
    const result = historyToUiMessages(rows);
    // Only the well-formed ai row survives; content-less/garbled rows are dropped.
    expect(result).toEqual([
      {
        id: 'history-4',
        role: 'assistant',
        parts: [{ type: 'text', text: 'ok' }],
      },
    ]);
  });

  it('returns an empty array for no rows', () => {
    expect(historyToUiMessages([])).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/unit/lib/chat-history.test.ts`
Expected: FAIL ("Cannot find module '@/lib/chat-history'").

**Step 3: Write the minimal implementation**

```ts
import type { N8nChatHistory } from '@/types/supabase';

/**
 * Map stored n8n LangChain history rows into the UI message shape used by the
 * chat pane. `n8n_chat_histories.message` is a LangChain BaseMessage
 * (`{ type: 'human' | 'ai' | 'system' | 'tool', content: string }`). We render
 * only the conversational turns: `human` → user bubble, `ai` → assistant bubble.
 * Rows are ordered by their serial `id` (chronological). Malformed or
 * content-less rows are skipped so a bad record can't break the transcript.
 */

export interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
}

const ROLE_BY_TYPE: Record<string, UiMessage['role']> = {
  human: 'user',
  ai: 'assistant',
};

export function historyToUiMessages(rows: N8nChatHistory[]): UiMessage[] {
  return [...rows]
    .sort((a, b) => a.id - b.id)
    .map(toUiMessage)
    .filter((m): m is UiMessage => m !== null);
}

function toUiMessage(row: N8nChatHistory): UiMessage | null {
  const message = row.message;
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return null;
  }
  const { type, content } = message as { type?: unknown; content?: unknown };
  if (typeof type !== 'string' || typeof content !== 'string') return null;
  const role = ROLE_BY_TYPE[type];
  if (!role) return null;
  return {
    id: `history-${row.id}`,
    role,
    parts: [{ type: 'text', text: content }],
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test tests/unit/lib/chat-history.test.ts`
Expected: PASS (5 passing).

**Step 5: Commit**

```bash
git add lib/chat-history.ts tests/unit/lib/chat-history.test.ts
git commit -m "feat(chat): map stored n8n history rows to UI messages"
```

---

## Task 4: Forward `user_id` from `/api/chat` to n8n

So n8n can stamp `n8n_chat_sessions.user_id` when it inserts a session row.

**Files:**

- Modify: `app/api/chat/route.ts`
- Modify: `tests/unit/app/api/chat.test.ts`

**Step 1: Add the failing test**

At the top of `chat.test.ts`, add a server-client mock (after the file's existing imports, before `describe`):

```ts
const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));
```

In `beforeEach`, default the user to signed-in:

```ts
mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
```

Add a new test inside `describe('POST /api/chat', ...)`:

```ts
it('forwards the signed-in user id to n8n', async () => {
  process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';
  const fetchMock = streamingFetchMock();
  global.fetch = fetchMock as unknown as typeof fetch;

  await POST(makeRequest(userMessage));

  expect(lastFetchBody(fetchMock).userId).toBe('user-123');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/unit/app/api/chat.test.ts`
Expected: FAIL (`userId` is `undefined` in the forwarded body).

**Step 3: Implement**

In `app/api/chat/route.ts`, add the import:

```ts
import { createClient } from '@/lib/supabase/server';
```

Inside `POST`, after computing `sessionId` and before the webhook block, fetch the user:

```ts
// The route is login-gated by proxy.ts, so there is a session here. We read the
// user id and forward it to n8n so it can stamp n8n_chat_sessions ownership on insert.
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
const userId = user?.id;
```

Then add `userId` to the webhook body:

```ts
body: JSON.stringify({
  message: userText,
  sessionId,
  userId,
  messages: parsed.data.messages,
}),
```

**Step 4: Run tests to verify they pass**

Run: `npm test tests/unit/app/api/chat.test.ts`
Expected: PASS (all existing + the new one).

**Step 5: Commit**

```bash
git add app/api/chat/route.ts tests/unit/app/api/chat.test.ts
git commit -m "feat(chat): forward signed-in user id to n8n for session ownership"
```

---

## Task 5: Extract the message-bubble renderer — `ChatMessages.tsx`

Pull the existing bubble-rendering JSX out of `app/chat/page.tsx` into a reusable component so the page stays under 300 lines once the sidebar is added. Behavior is unchanged (pure refactor of existing, tested rendering).

**Files:**

- Create: `app/components/chat/ChatMessages.tsx`
- Test: `tests/unit/app/components/chat/ChatMessages.test.tsx`

**Step 1: Write the failing test** (mirrors the page's existing message tests)

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

import { ChatMessages } from '@/app/components/chat/ChatMessages';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';

type Msg = {
  id: string;
  role: string;
  parts: Array<{ type: string; text?: string }>;
};

function renderMessages(messages: Msg[], status = 'ready', error?: unknown) {
  return render(
    <ChatMessages messages={messages} status={status} error={error} />
  );
}

describe('ChatMessages', () => {
  it('shows the empty state when there are no messages', () => {
    renderMessages([]);
    expect(
      screen.getByText(/ask anything to see a streamed response/i)
    ).toBeInTheDocument();
  });

  it('renders user and assistant bubbles', () => {
    renderMessages([
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi there' }] },
      { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hello!' }] },
    ]);
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('splits a message with a run separator into two bubbles', () => {
    renderMessages([
      {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: `First${N8N_RUN_SEPARATOR}Final` }],
      },
    ]);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('shows the thinking indicator when submitted and an error when present', () => {
    renderMessages(
      [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
      'submitted',
      new Error('boom')
    );
    expect(
      screen.getByRole('status', { name: /thinking/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/unit/app/components/chat/ChatMessages.test.tsx`
Expected: FAIL ("Cannot find module '@/app/components/chat/ChatMessages'").

**Step 3: Implement** — move the bubble + indicator + error JSX from `page.tsx` into this component. Define a `ChatMessagesProps` with `messages`, `status`, `error`. Keep the exact same markup/classes (including the `N8N_RUN_SEPARATOR` split, `prose-invert` for user, and the thinking dots). Use `function ChatMessages(...)` with a named export.

```tsx
'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';

interface ChatMessagesProps {
  messages: Array<{
    id: string;
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>;
  status: string;
  error: unknown;
}

export function ChatMessages({ messages, status, error }: ChatMessagesProps) {
  // ...paste the existing empty-state / messages.map(...) / thinking indicator /
  // error block from app/chat/page.tsx verbatim (the <CardContent> *inner*
  // content), unchanged.
}
```

> Keep this file focused on rendering only — no input form, no hooks. If it nears 300 lines, it's fine; the original block is ~70 lines.

**Step 4: Run test to verify it passes**

Run: `npm test tests/unit/app/components/chat/ChatMessages.test.tsx`
Expected: PASS (4 passing).

**Step 5: Commit**

```bash
git add app/components/chat/ChatMessages.tsx tests/unit/app/components/chat/ChatMessages.test.tsx
git commit -m "refactor(chat): extract ChatMessages renderer from chat page"
```

---

## Task 6: Session sidebar — `ChatSessionSidebar.tsx`

Lists the user's sessions (browser client, RLS-scoped), subscribes to Realtime so new/renamed sessions appear live, highlights the active one, and offers a "New chat" button.

**Files:**

- Create: `app/components/chat/ChatSessionSidebar.tsx`
- Test: `tests/unit/app/components/chat/ChatSessionSidebar.test.tsx`

**Component contract:**

```ts
interface ChatSessionSidebarProps {
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}
```

Internally: on mount, `select('*').order('updated_at', { ascending: false })` from `n8n_chat_sessions`; store rows in state; open a Realtime channel filtered to the signed-in user and re-fetch (or upsert into state) on any change; clean up the channel on unmount.

**Step 1: Write the failing test**

```tsx
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockOrder = jest.fn();
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
};
const mockRemoveChannel = jest.fn();
// Capture the Realtime callback so a test can fire a change event.
const realtime: { cb?: () => void } = {};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
    from: () => ({ select: () => ({ order: mockOrder }) }),
    channel: () => ({
      on: (_e: string, _f: unknown, cb: () => void) => {
        realtime.cb = cb;
        return mockChannel;
      },
      subscribe: () => mockChannel,
    }),
    removeChannel: mockRemoveChannel,
  }),
}));

import { ChatSessionSidebar } from '@/app/components/chat/ChatSessionSidebar';

function row(session_id: string, name: string) {
  return {
    id: `id-${session_id}`,
    session_id,
    user_id: 'user-123',
    name,
    created_at: '2026-06-04T00:00:00Z',
    updated_at: '2026-06-04T00:00:00Z',
  };
}

describe('ChatSessionSidebar', () => {
  beforeEach(() => {
    mockOrder.mockReset();
    mockRemoveChannel.mockReset();
    realtime.cb = undefined;
  });

  it('renders the session list from the browser client', async () => {
    mockOrder.mockResolvedValue({
      data: [row('s1', 'First chat'), row('s2', 'Second chat')],
      error: null,
    });

    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );

    expect(await screen.findByText('First chat')).toBeInTheDocument();
    expect(screen.getByText('Second chat')).toBeInTheDocument();
  });

  it('calls onSelectSession when a session is clicked', async () => {
    mockOrder.mockResolvedValue({
      data: [row('s1', 'First chat')],
      error: null,
    });
    const onSelect = jest.fn();

    render(
      <ChatSessionSidebar
        activeSessionId="other"
        onSelectSession={onSelect}
        onNewChat={jest.fn()}
      />
    );

    await screen.findByText('First chat');
    await userEvent.click(screen.getByText('First chat'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('marks the active session with aria-current', async () => {
    mockOrder.mockResolvedValue({
      data: [row('s1', 'First chat')],
      error: null,
    });

    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );

    const item = await screen.findByText('First chat');
    expect(item.closest('[aria-current="true"]')).not.toBeNull();
  });

  it('calls onNewChat when the New chat button is clicked', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const onNewChat = jest.fn();

    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={onNewChat}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /new chat/i }));
    expect(onNewChat).toHaveBeenCalled();
  });

  it('re-fetches the list when a Realtime change fires', async () => {
    mockOrder
      .mockResolvedValueOnce({ data: [row('s1', 'First chat')], error: null })
      .mockResolvedValueOnce({
        data: [row('s2', 'Brand new chat'), row('s1', 'First chat')],
        error: null,
      });

    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );

    await screen.findByText('First chat');
    await waitFor(() => expect(realtime.cb).toBeDefined());
    act(() => realtime.cb!());
    expect(await screen.findByText('Brand new chat')).toBeInTheDocument();
  });

  it('removes the Realtime channel on unmount', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const { unmount } = render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );
    await waitFor(() => expect(realtime.cb).toBeDefined());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test tests/unit/app/components/chat/ChatSessionSidebar.test.tsx`
Expected: FAIL ("Cannot find module").

**Step 3: Implement**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/types/supabase';

interface ChatSessionSidebarProps {
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatSessionSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
}: ChatSessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;

    async function load() {
      const { data } = await supabase
        .from('n8n_chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      setSessions(data ?? []);
    }

    async function subscribe() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      channel = supabase
        .channel('n8n_chat_sessions_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'n8n_chat_sessions',
            filter: user ? `user_id=eq.${user.id}` : undefined,
          },
          () => {
            void load();
          }
        )
        .subscribe();
    }

    void load();
    void subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside className="flex w-64 flex-col gap-2 border-r border-border p-3">
      <Button
        onClick={onNewChat}
        className="w-full justify-start"
        variant="outline"
      >
        <Plus />
        New chat
      </Button>
      <nav
        className="flex-1 space-y-1 overflow-y-auto"
        aria-label="Chat sessions"
      >
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No saved chats yet.
          </p>
        ) : (
          sessions.map((session) => {
            const isActive = session.session_id === activeSessionId;
            return (
              <button
                key={session.id}
                type="button"
                aria-current={isActive}
                onClick={() => onSelectSession(session.session_id)}
                className={cn(
                  'w-full truncate rounded-md px-3 py-2 text-left text-sm',
                  isActive
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60'
                )}
              >
                {session.name}
              </button>
            );
          })
        )}
      </nav>
    </aside>
  );
}
```

> Note: the `filter` accepts a string; passing `undefined` when there's no user keeps the channel unfiltered (RLS still scopes server-side). If TypeScript complains about `undefined`, fall back to building the options object conditionally.

**Step 4: Run test to verify it passes**

Run: `npm test tests/unit/app/components/chat/ChatSessionSidebar.test.tsx`
Expected: PASS (6 passing).

**Step 5: Commit**

```bash
git add app/components/chat/ChatSessionSidebar.tsx tests/unit/app/components/chat/ChatSessionSidebar.test.tsx
git commit -m "feat(chat): add session sidebar with realtime updates"
```

---

## Task 7: Wire the sidebar + session switching into `/chat`

Make `sessionId` stateful, render the sidebar beside the chat pane, load history when switching sessions, and reset for "New chat".

**Files:**

- Modify: `app/chat/page.tsx`
- Modify: `tests/unit/app/chat-page.test.tsx`

**Step 1: Update/extend the page test**

Add mocks for the browser client (sidebar uses it) and history loading. The existing `@ai-sdk/react` mock must expose `setMessages` now:

```tsx
const mockSetMessages = jest.fn();
jest.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: mockChatState.messages,
    sendMessage: mockSendMessage,
    setMessages: mockSetMessages,
    status: mockChatState.status,
    error: mockChatState.error,
  }),
}));
```

Extend the existing browser-client mock so the sidebar can load (replace the minimal one in this file):

```tsx
const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockHistoryOrder = jest.fn().mockResolvedValue({ data: [], error: null });
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: (table: string) => ({
      select: () => ({
        order: table === 'n8n_chat_sessions' ? mockOrder : mockHistoryOrder,
        eq: () => ({ order: mockHistoryOrder }),
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
    }),
    removeChannel: jest.fn(),
  }),
}));
```

Add a new behavior test:

```tsx
it('renders the session sidebar with a New chat button', async () => {
  render(<ChatPage />);
  expect(
    await screen.findByRole('button', { name: /new chat/i })
  ).toBeInTheDocument();
});
```

> The existing rendering tests still pass because `ChatMessages` (used by the page) renders the same markup. Keep them.

**Step 2: Run test to verify the new one fails**

Run: `npm test tests/unit/app/chat-page.test.tsx`
Expected: FAIL (no "New chat" button yet).

**Step 3: Implement the page**

Rewrite `app/chat/page.tsx` to:

- keep `sessionId` in state (still seeded with `crypto.randomUUID()`), and rebuild the transport with `useMemo` keyed on `sessionId`;
- destructure `setMessages` from `useChat`;
- render `<ChatSessionSidebar>` to the left and `<ChatMessages>` in the pane (replacing the inlined bubble JSX);
- `handleSelectSession(id)`: set `sessionId`, fetch history via the browser client (`from('n8n_chat_histories').select('*').eq('session_id', id).order('id')`), map with `historyToUiMessages`, and `setMessages(...)`;
- `handleNewChat()`: set a fresh `crypto.randomUUID()` and `setMessages([])`.

Sketch (preserve existing `PageShell`/`PageHero`/form markup; only the structure around the message area changes):

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageHero } from '../components/PageHero';
import { PageShell } from '../components/PageShell';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatSessionSidebar } from '../components/chat/ChatSessionSidebar';
import { createClient } from '@/lib/supabase/client';
import { historyToUiMessages } from '@/lib/chat-history';

export default function ChatPage() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({ api: '/api/chat', body: { sessionId } }),
    [sessionId]
  );
  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });
  const [input, setInput] = useState('');

  const isBusy = status === 'submitted' || status === 'streaming';

  async function handleSelectSession(id: string) {
    setSessionId(id);
    const supabase = createClient();
    const { data } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .eq('session_id', id)
      .order('id', { ascending: true });
    setMessages(historyToUiMessages(data ?? []));
  }

  function handleNewChat() {
    setSessionId(crypto.randomUUID());
    setMessages([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput('');
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="AI Chat"
        title={/* unchanged */ null}
        subtitle={/* unchanged */ null}
      />
      <div className="flex gap-4">
        <ChatSessionSidebar
          activeSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
        <Card className="flex h-[70vh] flex-1 flex-col border-2 border-foreground rounded-2xl shadow-hard">
          <CardContent className="flex-1 overflow-y-auto space-y-4 pt-6">
            <ChatMessages messages={messages} status={status} error={error} />
          </CardContent>
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={isBusy}
                aria-label="Message"
              />
              <Button type="submit" disabled={isBusy || !input.trim()}>
                <Send />
                Send
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
```

> Keep the original `PageHero` `title`/`subtitle` JSX from the current file verbatim. Keep the page under 300 lines (it will be ~90).
> `setMessages(historyToUiMessages(...))` — `UiMessage` matches the AI SDK UI message shape (`role` + `parts`). If the AI SDK's type is stricter, cast via `setMessages(historyToUiMessages(data ?? []) as never)` and leave a short comment.

**Step 4: Run the page tests**

Run: `npm test tests/unit/app/chat-page.test.tsx`
Expected: PASS (existing + new "sidebar" test).

**Step 5: Commit**

```bash
git add app/chat/page.tsx tests/unit/app/chat-page.test.tsx
git commit -m "feat(chat): multi-session sidebar and history loading on /chat"
```

---

## Task 8: Documentation

**Files:**

- Modify: `docs/integrations/n8n.md`
- Modify: `SUPABASE_SETUP.md`

**Step 1: Document the n8n session contract** in `docs/integrations/n8n.md`

Add a "Chat sessions (history sidebar)" section covering:

- The route now forwards `userId` in the webhook body (alongside `message`, `sessionId`, `messages`).
- On the first message of a new `sessionId`, the n8n workflow must **upsert** a row into `n8n_chat_sessions` with: `session_id` (from `{{ $json.body.sessionId }}`), `user_id` (from `{{ $json.body.userId }}`), and a descriptive `name` (e.g. an LLM-generated title from the first message). Insert with the service-role/Postgres connection so it bypasses RLS.
- The app reads `n8n_chat_sessions` (list) and `n8n_chat_histories` (history) directly via the RLS-scoped browser client; n8n only writes.

**Step 2: Document the schema change** in `SUPABASE_SETUP.md`

Note the new migration (`20260604000000_n8n_chat_sessions_and_history.sql`): the `n8n_chat_sessions` and `n8n_chat_histories` tables, both with RLS (history has an ownership-scoped read policy), and `n8n_chat_sessions` added to the `supabase_realtime` publication. Mention that this project also keeps its pre-existing unrelated `chat_sessions`/`chat_messages` tables, which this feature does not use.

**Step 3: Commit**

```bash
git add docs/integrations/n8n.md SUPABASE_SETUP.md
git commit -m "docs: document n8n_chat_sessions contract and history RLS"
```

---

## Finalization

**Step 1: Full validation**

Run: `npm run validate` (type-check + lint) — expect 0 errors.
Run: `npm test` — expect all suites green.
Run: `npm run test:coverage` — expect ≥ 80% across the board.

**Step 2: Manual smoke test** (requires a real n8n workflow that inserts into `n8n_chat_sessions`)

- Sign in, open `/chat`, send a message → reply streams.
- Within a moment the new session appears in the sidebar with its n8n-generated name (Realtime).
- Click "New chat", send a different message → a second session appears.
- Click the first session → its history replays in the pane.
- Sign in as a different user → confirm none of the first user's sessions or messages are visible (RLS).

**Step 3: Final commit / branch wrap-up** — see superpowers:finishing-a-development-branch.

---

## Notes & risks

- **`useChat` + changing transport:** rebuilding the transport via `useMemo` on `sessionId` is the switch mechanism; pair every switch with `setMessages(...)`. If the AI SDK version ignores a changed transport reference mid-session, fall back to keying the whole `useChat`-owning subtree with `key={sessionId}` (lift the chat pane into a child component that takes `sessionId` as a prop).
- **History message shape:** `historyToUiMessages` emits `{ id, role, parts:[{type:'text',text}] }`, matching the live `useChat` message shape so `ChatMessages` renders both identically. Multi-run replies stored as separate `ai` rows naturally become separate bubbles (no separator needed for history).
- **Realtime must be enabled** on the Supabase project (the migration adds `n8n_chat_sessions` to the `supabase_realtime` publication; Realtime is on by default for Supabase projects).
- **n8n owns naming.** If n8n hasn't inserted the session row yet, the sidebar simply won't show it until the Realtime insert event fires — expected.
