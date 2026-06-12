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
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-123', email: 'j@e.com', user_metadata: {} } },
      }),
    },
  });
});
afterEach(() => {
  process.env = originalEnv;
  global.fetch = originalFetch;
});

describe('POST /api/chat — Zep memory', () => {
  it('forwards the full payload to n8n: prompt, Zep context, sessionId, userId, and messages', async () => {
    (getZepClient as jest.Mock).mockReturnValue({ __zep: true });
    (retrieveUserContext as jest.Mock).mockResolvedValue(
      '<USER_SUMMARY>frequent buyer</USER_SUMMARY>'
    );
    (recordChatTurn as jest.Mock).mockResolvedValue(undefined);
    const fetchMock = streamingFetchMock('reply');
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(makeRequest(body));

    const sentBody = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );

    // Everything n8n needs in one envelope.
    expect(sentBody).toEqual(
      expect.objectContaining({
        message: 'ping', // the user prompt
        context: '<USER_SUMMARY>frequent buyer</USER_SUMMARY>', // Zep user context
        sessionId: 'sess-1',
        userId: 'user-123',
        messages: body.messages, // full UI message history
      })
    );
  });

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
      'user-123',
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

    // The retrieved context must never reach the write path (no feedback loop).
    const recordArg = (recordChatTurn as jest.Mock).mock.calls[0][1];
    expect(recordArg).not.toHaveProperty('context');
    expect(JSON.stringify(recordArg)).not.toContain('USER CONTEXT BLOCK');
  });

  it('does not record a turn when the user text is blank', async () => {
    (getZepClient as jest.Mock).mockReturnValue({ __zep: true });
    (retrieveUserContext as jest.Mock).mockResolvedValue('CTX');
    (recordChatTurn as jest.Mock).mockResolvedValue(undefined);
    global.fetch = streamingFetchMock('reply') as unknown as typeof fetch;

    const res = await POST(
      makeRequest({
        sessionId: 'sess-1',
        messages: [{ role: 'user', parts: [{ type: 'text', text: '' }] }],
      })
    );
    await res.text();

    expect(recordChatTurn).not.toHaveBeenCalled();
  });

  it('does not record a turn when the assistant reply is blank', async () => {
    (getZepClient as jest.Mock).mockReturnValue({ __zep: true });
    (retrieveUserContext as jest.Mock).mockResolvedValue('CTX');
    (recordChatTurn as jest.Mock).mockResolvedValue(undefined);
    global.fetch = streamingFetchMock('   ') as unknown as typeof fetch;

    const res = await POST(
      makeRequest({
        sessionId: 'sess-1',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'ping' }] }],
      })
    );
    await res.text();

    expect(recordChatTurn).not.toHaveBeenCalled();
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
