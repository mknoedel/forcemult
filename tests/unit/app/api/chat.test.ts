/**
 * @jest-environment node
 */

import { POST } from '@/app/api/chat/route';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const userMessage = {
  messages: [{ role: 'user', parts: [{ type: 'text', text: 'Hello there' }] }],
};

const mockGetUser = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: () => mockGetUser() },
  }),
}));

describe('POST /api/chat', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.N8N_WEBHOOK_URL;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    (logger.error as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('streams a placeholder text response when no webhook is configured', async () => {
    const res = await POST(makeRequest(userMessage));

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/plain/);

    const text = await res.text();
    expect(text).toContain('Placeholder response');
    expect(text).toContain('Hello there');
  });

  it('returns 400 when the body has no messages', async () => {
    const res = await POST(makeRequest({ foo: 'bar' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: '{not json',
      })
    );
    expect(res.status).toBe(400);
  });

  function streamingFetchMock(text = 'hi from n8n'): jest.Mock {
    const encoder = new TextEncoder();
    const upstreamBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(text));
        controller.close();
      },
    });
    return jest
      .fn()
      .mockResolvedValue(new Response(upstreamBody, { status: 200 }));
  }

  function lastFetchBody(fetchMock: jest.Mock): Record<string, unknown> {
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    return JSON.parse(init.body as string);
  }

  it('proxies to the n8n webhook when N8N_WEBHOOK_URL is set', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';

    const fetchMock = streamingFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(
      makeRequest({
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'ping' }] }],
      })
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://n8n.example/webhook/agent',
      expect.objectContaining({ method: 'POST' })
    );
    const text = await res.text();
    expect(text).toContain('hi from n8n');
  });

  it('sends the API_KEY header when N8N_WEBHOOK_SECRET is set', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';
    process.env.N8N_WEBHOOK_SECRET = 'super-secret-value';

    const fetchMock = streamingFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(makeRequest(userMessage));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.API_KEY).toBe('super-secret-value');
    // The secret must never be sent as a bearer token.
    expect(headers.Authorization).toBeUndefined();
  });

  it('omits the API_KEY header when no secret is configured', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';
    delete process.env.N8N_WEBHOOK_SECRET;

    const fetchMock = streamingFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(makeRequest(userMessage));

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers.API_KEY).toBeUndefined();
  });

  it('forwards a client-provided sessionId to n8n', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';

    const fetchMock = streamingFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(
      makeRequest({
        sessionId: 'session-abc-123',
        messages: [{ role: 'user', parts: [{ type: 'text', text: 'ping' }] }],
      })
    );

    expect(lastFetchBody(fetchMock).sessionId).toBe('session-abc-123');
  });

  it('generates a sessionId when the client omits one', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';

    const fetchMock = streamingFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(makeRequest(userMessage));

    const sessionId = lastFetchBody(fetchMock).sessionId;
    expect(typeof sessionId).toBe('string');
    expect((sessionId as string).length).toBeGreaterThan(0);
  });

  it('parses n8n NDJSON streaming chunks into plain reply text', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';

    const ndjson =
      '{"type":"begin","metadata":{}}\n' +
      '{"type":"item","content":"2 ","metadata":{}}\n' +
      '{"type":"item","content":"+ 2 equals 4.","metadata":{}}\n' +
      '{"type":"end","metadata":{}}\n';
    global.fetch = streamingFetchMock(ndjson) as unknown as typeof fetch;

    const res = await POST(makeRequest(userMessage));
    const text = await res.text();

    expect(text).toBe('2 + 2 equals 4.');
    // The raw JSON envelopes must not leak into the reply.
    expect(text).not.toContain('"type"');
  });

  it('forwards the signed-in user id to n8n', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';
    const fetchMock = streamingFetchMock();
    global.fetch = fetchMock as unknown as typeof fetch;

    await POST(makeRequest(userMessage));

    expect(lastFetchBody(fetchMock).userId).toBe('user-123');
  });

  it('returns 502 when the n8n webhook errors', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response('nope', { status: 500 })
      ) as unknown as typeof fetch;

    const res = await POST(makeRequest(userMessage));
    expect(res.status).toBe(502);
  });

  it('logs server-side when the n8n webhook returns a non-ok status', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';
    global.fetch = jest
      .fn()
      .mockResolvedValue(
        new Response('nope', { status: 500 })
      ) as unknown as typeof fetch;

    await POST(makeRequest(userMessage));

    expect(logger.error).toHaveBeenCalledTimes(1);
    const [msg, meta] = (logger.error as jest.Mock).mock.calls[0];
    expect(msg).toMatch(/n8n webhook/i);
    expect(meta).toMatchObject({ status: 500 });
  });

  it('logs server-side when the n8n webhook is unreachable', async () => {
    process.env.N8N_WEBHOOK_URL = 'https://n8n.example/webhook/agent';
    global.fetch = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;

    const res = await POST(makeRequest(userMessage));

    expect(res.status).toBe(502);
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect((logger.error as jest.Mock).mock.calls[0][0]).toMatch(
      /n8n webhook/i
    );
  });
});
