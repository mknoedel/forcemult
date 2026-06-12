# Zep Chat Memory Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire `/api/chat` into a Zep knowledge graph — retrieve the user's long-term context before calling n8n (passed in as a `context` body field), and record each turn (user + assistant) to the user's Zep graph after the reply.

**Architecture:** Env-gated (`ZEP_API_KEY`) feature, active only in the n8n-connected branch. One timeout-guarded Zep read (`getUserContext`) sits on the critical path before the n8n fetch; the streamed reply is tee'd through a pass-through `TransformStream` that accumulates the assistant text and, in its `flush()`, writes the turn to Zep. Every Zep call is best-effort and can never delay a visible token or break the stream. The retrieved context is **never** written back (no feedback loop).

**Tech Stack:** Next.js 16 Route Handler, Web Streams API, `@getzep/zep-cloud` v3, Supabase server client, Jest (node env), TypeScript strict.

**Design reference:** [docs/plans/2026-06-04-zep-chat-memory-design.md](2026-06-04-zep-chat-memory-design.md)

**Implementation note (refinement of the design):** the design mentioned Next's `after()` for the write. We instead write inside the capture stream's awaited `flush()` — testable under a direct `POST()` call, guaranteed to complete before function teardown, and still off the visible-token path (only the stream-close event is delayed by the write).

---

## Conventions for every task

- **TDD is the law:** write the failing test, run it RED, implement minimally, run GREEN, commit.
- Test files mirror source: `lib/zep/x.ts` → `tests/unit/lib/zep/x.test.ts` (the colocation hook expects a matching basename).
- Lib/route tests use `/** @jest-environment node */` (top of file) — these touch Web Streams / Request / Response.
- Run a single test file with `npm test <path>`.
- Pre-commit hooks run lint-staged + secret/size/colocation checks + doc regen. Let them run.

---

## Task 0: Dependency + env scaffolding

**Files:**

- Modify: `package.json` (via npm)
- Modify: `.env.example`

**Step 1: Install the Zep SDK**

Run: `npm install @getzep/zep-cloud@^3.23.0`
Expected: `package.json` dependencies gain `@getzep/zep-cloud`, install succeeds.

**Step 2: Add the env var to `.env.example`**

Append to `.env.example`:

```bash

# Zep knowledge-graph memory (optional) — used by app/api/chat to retrieve the
# user's long-term context before calling n8n and to record each turn back to
# the user's graph. Server-side only; never exposed to the browser. The chat
# works normally when this is unset (the feature stays dormant).
# Get a key from https://app.getzep.com (Project Settings).
# ZEP_API_KEY=your_zep_api_key
```

**Step 3: Verify type-check still passes**

Run: `npm run type-check`
Expected: PASS (no usages yet).

**Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore(zep): add @getzep/zep-cloud dep and ZEP_API_KEY env placeholder"
```

---

## Task 1: `lib/zep/client.ts` — env-gated client factory

**Files:**

- Create: `lib/zep/client.ts`
- Test: `tests/unit/lib/zep/client.test.ts`

**Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { getZepClient } from '@/lib/zep/client';

describe('getZepClient', () => {
  const original = process.env;
  beforeEach(() => {
    process.env = { ...original };
  });
  afterEach(() => {
    process.env = original;
  });

  it('returns null when ZEP_API_KEY is not set', () => {
    delete process.env.ZEP_API_KEY;
    expect(getZepClient()).toBeNull();
  });

  it('returns a client instance when ZEP_API_KEY is set', () => {
    process.env.ZEP_API_KEY = 'z_test_key';
    const client = getZepClient();
    expect(client).not.toBeNull();
    expect(client?.thread).toBeDefined();
  });
});
```

**Step 2: Run it RED**

Run: `npm test tests/unit/lib/zep/client.test.ts`
Expected: FAIL — cannot find module `@/lib/zep/client`.

**Step 3: Implement minimally**

Create `lib/zep/client.ts`:

```ts
import { ZepClient } from '@getzep/zep-cloud';

/**
 * Returns a Zep client when ZEP_API_KEY is set, otherwise null so the chat
 * memory feature stays dormant. Factory (no module-level instantiation), like
 * the Supabase clients, so the app builds without the key configured.
 */
export function getZepClient(): ZepClient | null {
  const apiKey = process.env.ZEP_API_KEY;
  if (!apiKey) return null;
  return new ZepClient({ apiKey });
}
```

**Step 4: Run it GREEN**

Run: `npm test tests/unit/lib/zep/client.test.ts`
Expected: PASS (both cases).

**Step 5: Commit**

```bash
git add lib/zep/client.ts tests/unit/lib/zep/client.test.ts
git commit -m "feat(zep): env-gated Zep client factory"
```

---

## Task 2: `lib/zep/identity.ts` — Supabase user → Zep user mapping

**Files:**

- Create: `lib/zep/identity.ts`
- Test: `tests/unit/lib/zep/identity.test.ts`

**Step 1: Write the failing test**

```ts
/** @jest-environment node */
import type { User } from '@supabase/supabase-js';
import { toZepUser, displayName } from '@/lib/zep/identity';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-123',
    email: 'jane@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  } as User;
}

describe('toZepUser', () => {
  it('maps id and email', () => {
    const z = toZepUser(makeUser());
    expect(z.userId).toBe('user-123');
    expect(z.email).toBe('jane@example.com');
  });

  it('splits a full name from metadata into first/last', () => {
    const z = toZepUser(
      makeUser({ user_metadata: { full_name: 'Jane Q Doe' } } as Partial<User>)
    );
    expect(z.firstName).toBe('Jane');
    expect(z.lastName).toBe('Q Doe');
  });

  it('handles a single-word name (no last name)', () => {
    const z = toZepUser(
      makeUser({ user_metadata: { name: 'Madonna' } } as Partial<User>)
    );
    expect(z.firstName).toBe('Madonna');
    expect(z.lastName).toBeUndefined();
  });

  it('omits names when no metadata name is present', () => {
    const z = toZepUser(makeUser());
    expect(z.firstName).toBeUndefined();
    expect(z.lastName).toBeUndefined();
  });
});

describe('displayName', () => {
  it('prefers the metadata name', () => {
    expect(
      displayName(
        makeUser({ user_metadata: { full_name: 'Jane Doe' } } as Partial<User>)
      )
    ).toBe('Jane Doe');
  });
  it('falls back to email then a generic label', () => {
    expect(displayName(makeUser())).toBe('jane@example.com');
    expect(displayName(makeUser({ email: undefined } as Partial<User>))).toBe(
      'User'
    );
  });
});
```

**Step 2: Run it RED**

Run: `npm test tests/unit/lib/zep/identity.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement minimally**

Create `lib/zep/identity.ts`:

```ts
import type { User } from '@supabase/supabase-js';

export interface ZepUserFields {
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

function metadataName(user: User): string | undefined {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = meta.full_name ?? meta.name;
  return typeof name === 'string' && name.trim() ? name.trim() : undefined;
}

/** Map a Supabase user to the fields Zep's user.add expects. */
export function toZepUser(user: User): ZepUserFields {
  const name = metadataName(user);
  const parts = name ? name.split(/\s+/) : [];
  const firstName = parts.shift();
  const lastName = parts.length ? parts.join(' ') : undefined;
  return {
    userId: user.id,
    email: user.email ?? undefined,
    firstName: firstName || undefined,
    lastName,
  };
}

/** Human label for the message `name` field on user messages. */
export function displayName(user: User): string {
  return metadataName(user) ?? user.email ?? 'User';
}
```

**Step 4: Run it GREEN**

Run: `npm test tests/unit/lib/zep/identity.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/zep/identity.ts tests/unit/lib/zep/identity.test.ts
git commit -m "feat(zep): map Supabase user to Zep user fields"
```

---

## Task 3: `lib/zep/chat-memory.ts` — `retrieveUserContext`

**Files:**

- Create: `lib/zep/chat-memory.ts`
- Test: `tests/unit/lib/zep/chat-memory.test.ts`

**Step 1: Write the failing test**

```ts
/** @jest-environment node */
import type { ZepClient } from '@getzep/zep-cloud';
import { retrieveUserContext } from '@/lib/zep/chat-memory';

function fakeClient(getUserContext: jest.Mock): ZepClient {
  return {
    thread: { getUserContext, create: jest.fn(), addMessages: jest.fn() },
    user: { add: jest.fn() },
  } as unknown as ZepClient;
}

describe('retrieveUserContext', () => {
  it('returns the context string from getUserContext', async () => {
    const client = fakeClient(
      jest.fn().mockResolvedValue({ context: 'USER SUMMARY + FACTS' })
    );
    await expect(retrieveUserContext(client, 'thread-1')).resolves.toBe(
      'USER SUMMARY + FACTS'
    );
  });

  it('returns empty string when getUserContext throws', async () => {
    const client = fakeClient(jest.fn().mockRejectedValue(new Error('boom')));
    await expect(retrieveUserContext(client, 'thread-1')).resolves.toBe('');
  });

  it('returns empty string when getUserContext exceeds the timeout', async () => {
    const client = fakeClient(jest.fn().mockReturnValue(new Promise(() => {}))); // never resolves
    await expect(retrieveUserContext(client, 'thread-1', 20)).resolves.toBe('');
  });
});
```

**Step 2: Run it RED**

Run: `npm test tests/unit/lib/zep/chat-memory.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement minimally**

Create `lib/zep/chat-memory.ts`:

```ts
import type { ZepClient } from '@getzep/zep-cloud';
import { logger } from '@/lib/logger';

const DEFAULT_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Zep request timed out')),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Fetch the user's long-term context block for a thread. Best-effort: on any
 * failure or timeout it returns '' so the chat proceeds without context.
 */
export async function retrieveUserContext(
  client: ZepClient,
  threadId: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  try {
    const result = await withTimeout(
      client.thread.getUserContext(threadId),
      timeoutMs
    );
    return result?.context ?? '';
  } catch (error) {
    logger.warn('Zep getUserContext failed; proceeding without context', {
      error: String(error),
    });
    return '';
  }
}
```

**Step 4: Run it GREEN**

Run: `npm test tests/unit/lib/zep/chat-memory.test.ts`
Expected: PASS (3 cases). The timeout test should finish in well under a second.

**Step 5: Commit**

```bash
git add lib/zep/chat-memory.ts tests/unit/lib/zep/chat-memory.test.ts
git commit -m "feat(zep): timeout-guarded retrieveUserContext"
```

---

## Task 4: `lib/zep/chat-memory.ts` — `recordChatTurn`

**Files:**

- Modify: `lib/zep/chat-memory.ts`
- Test: `tests/unit/lib/zep/chat-memory.test.ts` (add a describe block)

**Step 1: Write the failing tests** (append to the existing test file)

```ts
import { recordChatTurn } from '@/lib/zep/chat-memory';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';
import type { User } from '@supabase/supabase-js';

function fakeWriteClient() {
  const add = jest.fn().mockResolvedValue(undefined);
  const create = jest.fn().mockResolvedValue(undefined);
  const addMessages = jest.fn().mockResolvedValue(undefined);
  const client = {
    user: { add },
    thread: { create, addMessages, getUserContext: jest.fn() },
  } as unknown as ZepClient;
  return { client, add, create, addMessages };
}

const supabaseUser = {
  id: 'user-123',
  email: 'jane@example.com',
  user_metadata: {},
} as User;

describe('recordChatTurn', () => {
  it('adds the user, creates the thread, and writes both messages in order', async () => {
    const { client, add, create, addMessages } = fakeWriteClient();
    await recordChatTurn(client, {
      supabaseUser,
      threadId: 'thread-1',
      userText: 'hello',
      assistantText: 'hi there',
    });
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123' })
    );
    expect(create).toHaveBeenCalledWith({
      threadId: 'thread-1',
      userId: 'user-123',
    });
    const [threadId, payload] = addMessages.mock.calls[0];
    expect(threadId).toBe('thread-1');
    expect(payload.messages).toEqual([
      expect.objectContaining({ role: 'user', content: 'hello' }),
      expect.objectContaining({ role: 'assistant', content: 'hi there' }),
    ]);
  });

  it('does NOT include any retrieved context — only the raw turn text (no feedback loop)', async () => {
    const { client, addMessages } = fakeWriteClient();
    await recordChatTurn(client, {
      supabaseUser,
      threadId: 'thread-1',
      userText: 'what is my plan?',
      assistantText: 'Your plan is Pro.',
    });
    const payload = addMessages.mock.calls[0][1];
    const contents = payload.messages.map(
      (m: { content: string }) => m.content
    );
    expect(contents).toEqual(['what is my plan?', 'Your plan is Pro.']);
  });

  it('joins multi-run separators in the assistant text into blank lines', async () => {
    const { client, addMessages } = fakeWriteClient();
    await recordChatTurn(client, {
      supabaseUser,
      threadId: 'thread-1',
      userText: 'q',
      assistantText: `let me check${N8N_RUN_SEPARATOR}the answer is 42`,
    });
    const payload = addMessages.mock.calls[0][1];
    expect(payload.messages[1].content).toBe(
      'let me check\n\nthe answer is 42'
    );
  });

  it('swallows "already exists" errors from user.add / thread.create and still writes messages', async () => {
    const { client, add, create, addMessages } = fakeWriteClient();
    add.mockRejectedValueOnce(new Error('user already exists'));
    create.mockRejectedValueOnce(new Error('thread already exists'));
    await recordChatTurn(client, {
      supabaseUser,
      threadId: 'thread-1',
      userText: 'hi',
      assistantText: 'yo',
    });
    expect(addMessages).toHaveBeenCalledTimes(1);
  });

  it('never throws when addMessages fails', async () => {
    const { client, addMessages } = fakeWriteClient();
    addMessages.mockRejectedValue(new Error('zep down'));
    await expect(
      recordChatTurn(client, {
        supabaseUser,
        threadId: 't',
        userText: 'a',
        assistantText: 'b',
      })
    ).resolves.toBeUndefined();
  });
});
```

**Step 2: Run it RED**

Run: `npm test tests/unit/lib/zep/chat-memory.test.ts`
Expected: FAIL — `recordChatTurn` not exported.

**Step 3: Implement** — append to `lib/zep/chat-memory.ts`:

```ts
import type { Message } from '@getzep/zep-cloud/api';
import type { User } from '@supabase/supabase-js';
import { toZepUser, displayName } from '@/lib/zep/identity';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';

export interface ChatTurn {
  supabaseUser: User;
  threadId: string;
  userText: string;
  assistantText: string;
}

// user.add / thread.create reject if the entity already exists — expected on
// every turn after the first — so swallow their errors and continue.
async function ignoreErrors(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch {
    /* already exists or transient — best-effort */
  }
}

// The inter-run separator is a UI-only marker; turn it into blank lines for the
// stored reply. Never contains the retrieved context (not passed to this fn).
function cleanAssistantText(text: string): string {
  return text.split(N8N_RUN_SEPARATOR).join('\n\n').trim();
}

/**
 * Record one chat turn to the user's Zep graph: ensure the user + thread exist,
 * then append the user message and assistant reply. Best-effort — never throws,
 * so a Zep failure can't affect the chat response.
 */
export async function recordChatTurn(
  client: ZepClient,
  turn: ChatTurn
): Promise<void> {
  const zepUser = toZepUser(turn.supabaseUser);
  try {
    await ignoreErrors(() => client.user.add({ ...zepUser }));
    await ignoreErrors(() =>
      client.thread.create({ threadId: turn.threadId, userId: zepUser.userId })
    );
    const messages: Message[] = [
      {
        role: 'user',
        name: displayName(turn.supabaseUser),
        content: turn.userText,
      },
      {
        role: 'assistant',
        name: 'Assistant',
        content: cleanAssistantText(turn.assistantText),
      },
    ];
    await client.thread.addMessages(turn.threadId, { messages });
  } catch (error) {
    logger.error('Zep recordChatTurn failed', { error: String(error) });
  }
}
```

> Note: move the `import type { ZepClient }` to remain at the top with the other imports (don't duplicate). If TS complains about the `Message` shape, the required fields are `role`, `content`, and optional `name` — adjust the literal to satisfy the SDK's exported type.

**Step 4: Run it GREEN**

Run: `npm test tests/unit/lib/zep/chat-memory.test.ts`
Expected: PASS (all retrieve + record cases).

**Step 5: Verify the file is under 300 lines**

Run: `node scripts/check-file-sizes.js`
Expected: no violation for `lib/zep/chat-memory.ts`.

**Step 6: Commit**

```bash
git add lib/zep/chat-memory.ts tests/unit/lib/zep/chat-memory.test.ts
git commit -m "feat(zep): recordChatTurn writes turns to the user graph (no context echo)"
```

---

## Task 5: `lib/zep/stream-capture.ts` — pass-through accumulator

**Files:**

- Create: `lib/zep/stream-capture.ts`
- Test: `tests/unit/lib/zep/stream-capture.test.ts`

**Step 1: Write the failing test**

```ts
/** @jest-environment node */
import { createCaptureStream } from '@/lib/zep/stream-capture';

async function drain(stream: ReadableStream<string>): Promise<string[]> {
  const reader = stream.getReader();
  const out: string[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.push(value);
  }
  return out;
}

function sourceOf(chunks: string[]): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

describe('createCaptureStream', () => {
  it('passes every chunk through unchanged', async () => {
    const cap = createCaptureStream(async () => {});
    const out = await drain(sourceOf(['Hel', 'lo ', 'world']).pipeThrough(cap));
    expect(out.join('')).toBe('Hello world');
  });

  it('calls onComplete once with the full accumulated text after the stream ends', async () => {
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const cap = createCaptureStream(onComplete);
    await drain(sourceOf(['a', 'b', 'c']).pipeThrough(cap));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('abc');
  });

  it('does not reject the stream when onComplete throws', async () => {
    const cap = createCaptureStream(async () => {
      throw new Error('zep write failed');
    });
    await expect(drain(sourceOf(['x']).pipeThrough(cap))).resolves.toEqual([
      'x',
    ]);
  });
});
```

**Step 2: Run it RED**

Run: `npm test tests/unit/lib/zep/stream-capture.test.ts`
Expected: FAIL — module not found.

**Step 3: Implement minimally**

Create `lib/zep/stream-capture.ts`:

```ts
import { logger } from '@/lib/logger';

/**
 * A pass-through transform that accumulates the streamed assistant text and,
 * when the stream closes, hands the full reply to `onComplete`. Used to log a
 * chat turn to Zep after the reply has streamed to the client. `onComplete`
 * runs in flush(); its failure is logged and never surfaces to the client
 * stream, and the await keeps the function alive until the write finishes.
 */
export function createCaptureStream(
  onComplete: (assistantText: string) => Promise<void>
): TransformStream<string, string> {
  let buffer = '';
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      controller.enqueue(chunk);
    },
    async flush() {
      try {
        await onComplete(buffer);
      } catch (error) {
        logger.error('Zep capture onComplete failed', { error: String(error) });
      }
    },
  });
}
```

**Step 4: Run it GREEN**

Run: `npm test tests/unit/lib/zep/stream-capture.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add lib/zep/stream-capture.ts tests/unit/lib/zep/stream-capture.test.ts
git commit -m "feat(zep): pass-through stream capture for assistant reply"
```

---

## Task 6: Wire Zep into `app/api/chat/route.ts`

**Files:**

- Modify: `app/api/chat/route.ts`
- Test: `tests/integration/api/test_chat_zep.test.ts`

**Step 1: Write the failing integration test**

```ts
/** @jest-environment node */
import { POST } from '@/app/api/chat/route';
import { getZepClient } from '@/lib/zep/client';
import { retrieveUserContext, recordChatTurn } from '@/lib/zep/chat-memory';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/zep/client', () => ({ getZepClient: jest.fn() }));
jest.mock('@/lib/zep/chat-memory', () => ({
  retrieveUserContext: jest.fn(),
  recordChatTurn: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function streamingFetchMock(text = 'hi from n8n'): jest.Mock {
  const encoder = new TextEncoder();
  return jest.fn().mockResolvedValue(
    new Response(
      new ReadableStream<Uint8Array>({
        start(c) {
          c.enqueue(encoder.encode(text));
          c.close();
        },
      }),
      { status: 200 }
    )
  );
}

const body = {
  sessionId: 'sess-1',
  messages: [{ role: 'user', parts: [{ type: 'text', text: 'ping' }] }],
};
const originalEnv = process.env;
const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  process.env = {
    ...originalEnv,
    N8N_WEBHOOK_URL: 'https://n8n.example/webhook/agent',
  };
  (createClient as jest.Mock).mockResolvedValue({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({
          data: {
            user: { id: 'user-123', email: 'j@e.com', user_metadata: {} },
          },
        }),
    },
  });
});
afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
});

describe('POST /api/chat — Zep memory', () => {
  it('retrieves context, includes it in the n8n body, and records the turn', async () => {
    (getZepClient as jest.Mock).mockReturnValue({ __zep: true });
    (retrieveUserContext as jest.Mock).mockResolvedValue('USER CONTEXT BLOCK');
    (recordChatTurn as jest.Mock).mockResolvedValue(undefined);
    const fetchMock = streamingFetchMock('hello back');
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(makeRequest(body));
    const text = await res.text(); // drains the stream → triggers flush → recordChatTurn

    expect(retrieveUserContext).toHaveBeenCalledWith(
      expect.anything(),
      'sess-1',
      expect.anything()
    );
    const sentBody = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(sentBody.context).toBe('USER CONTEXT BLOCK');
    expect(text).toContain('hello back');
    expect(recordChatTurn).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        threadId: 'sess-1',
        userText: 'ping',
        assistantText: 'hello back',
      })
    );
  });

  it('does not touch Zep when the key is unset (getZepClient → null)', async () => {
    (getZepClient as jest.Mock).mockReturnValue(null);
    const fetchMock = streamingFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(makeRequest(body));
    const text = await res.text();

    expect(retrieveUserContext).not.toHaveBeenCalled();
    expect(recordChatTurn).not.toHaveBeenCalled();
    const sentBody = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(sentBody.context ?? '').toBe('');
    expect(text).toContain('hi from n8n');
  });
});
```

**Step 2: Run it RED**

Run: `npm test tests/integration/api/test_chat_zep.test.ts`
Expected: FAIL — `context` not in body / `retrieveUserContext` not called (route not wired yet).

**Step 3: Implement** — modify `app/api/chat/route.ts`:

Add imports near the top:

```ts
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getZepClient } from '@/lib/zep/client';
import { retrieveUserContext, recordChatTurn } from '@/lib/zep/chat-memory';
import { createCaptureStream } from '@/lib/zep/stream-capture';
```

Add a helper (near the other top-level helpers):

```ts
async function getSignedInUser(): Promise<User | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
```

In the n8n branch, **before** the `fetch(webhookUrl, ...)` call, add:

```ts
const zep = getZepClient();
// Kick off the user lookup concurrently; only awaited in the capture flush.
const userPromise = zep
  ? getSignedInUser()
  : Promise.resolve<User | null>(null);
const context = zep ? await retrieveUserContext(zep, sessionId) : '';
```

Add `context` to the n8n request body (alongside `message` / `sessionId` / `messages`):

```ts
        body: JSON.stringify({
          message: userText,
          context,
          sessionId,
          messages: parsed.data.messages,
        }),
```

Replace the textStream construction + return at the end of the n8n branch with:

```ts
const baseTextStream = upstream.body
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(createN8nTextStream());

// When Zep is active, tee the clean reply through a capture stream that logs
// the turn after it finishes streaming. The retrieved `context` is NOT passed
// here — only the raw user/assistant text — so it's never re-ingested.
const textStream = zep
  ? baseTextStream.pipeThrough(
      createCaptureStream(async (assistantText) => {
        const user = await userPromise;
        if (user) {
          await recordChatTurn(zep, {
            supabaseUser: user,
            threadId: sessionId,
            userText,
            assistantText,
          });
        }
      })
    )
  : baseTextStream;

return createTextStreamResponse({ textStream });
```

> If `POST` grows unwieldy, extract the entire n8n branch into a `handleN8nChat(...)` helper returning `Promise<Response>`. Keep the file under 300 lines (`node scripts/check-file-sizes.js`).

**Step 4: Run the new test GREEN**

Run: `npm test tests/integration/api/test_chat_zep.test.ts`
Expected: PASS (both cases).

**Step 5: Run the existing chat route test (regression)**

Run: `npm test tests/unit/app/api/chat.test.ts`
Expected: PASS — placeholder + n8n proxy + NDJSON parsing unchanged. (The added `context: ''` field doesn't break the existing body assertions.)

**Step 6: Commit**

```bash
git add app/api/chat/route.ts tests/integration/api/test_chat_zep.test.ts
git commit -m "feat(chat): retrieve Zep context for n8n and log each turn to the user graph"
```

---

## Task 7: Docs + full suite + coverage

**Files:**

- Modify: `docs/integrations/zep.md`
- Modify: `docs/getting-started.md`

**Step 1: Document the app integration** — add a section to `docs/integrations/zep.md`:

```markdown
## 3. App integration: chat memory

When `ZEP_API_KEY` is set, the chat scaffold (`app/api/chat/route.ts`) uses Zep in
the **n8n-connected path** (not placeholder mode):

- **Before** calling n8n it fetches the signed-in user's long-term context with
  `thread.getUserContext(sessionId)` and adds it to the n8n request body as
  `context`. Wire it into your agent prompt with `{{ $json.body.context }}`.
- **After** the reply streams back it records the turn (user message + assistant
  reply) to the user's Zep thread (`sessionId`), ingesting both into the
  user-level knowledge graph.

The retrieved `context` is passed to n8n only — it is **never** written back to
Zep, so already-extracted facts aren't re-ingested. Every Zep call is best-effort:
if the key is unset or Zep is unavailable, the chat works exactly as before. Set
`ZEP_API_KEY` in `.env.local` (server-side only).
```

**Step 2: Mention the env var in `docs/getting-started.md`** — in the optional Zep step (Step 9), add to the CLI bullet:

```markdown
Set `ZEP_API_KEY` in `.env.local` to also enable chat memory (the `/chat`
agent retrieves the user's long-term context and logs each turn to their
Zep graph; see [`docs/integrations/zep.md`](integrations/zep.md)).
```

**Step 3: Run the full suite**

Run: `npm test`
Expected: PASS — all suites.

**Step 4: Check coverage gate**

Run: `npm run test:coverage`
Expected: ≥ 80% global (branches/functions/lines/statements). The route changes live in `app/**` (counted); if the new n8n-branch branches dip coverage, add a case to `tests/integration/api/test_chat_zep.test.ts` (e.g. n8n 502 with Zep active, or signed-out user → `recordChatTurn` not called).

**Step 5: Validate types + lint**

Run: `npm run validate`
Expected: PASS (0 errors).

**Step 6: Commit**

```bash
git add docs/integrations/zep.md docs/getting-started.md CLAUDE.md
git commit -m "docs(zep): document chat-memory integration and ZEP_API_KEY"
```

---

## Done criteria

- [ ] `@getzep/zep-cloud` installed; `ZEP_API_KEY` placeholder in `.env.example`.
- [ ] `lib/zep/{client,identity,chat-memory,stream-capture}.ts` created, each with a mirrored test.
- [ ] `/api/chat` retrieves context (timeout-guarded), sends it as `context`, and logs each turn after the reply — only in the n8n + key-set path.
- [ ] Retrieved context never written back (asserted by test).
- [ ] Chat unaffected when `ZEP_API_KEY` unset or Zep failing (asserted by tests).
- [ ] `npm test` green, coverage ≥ 80%, `npm run validate` clean.
- [ ] Docs updated; CLAUDE.md AUTO sections regenerated by the hook.

```

```
