/** @jest-environment node */
import { POST } from '@/app/api/ingest/route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));

const mockGetUser = jest.fn();
const realFetch = global.fetch;
const mockFetch = jest.fn();

function request(body: unknown): Request {
  return new Request('http://localhost:3000/api/ingest', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const VALID_BODY = {
  title: 'Instructor Bio',
  text: 'John Renaldi founded Jiobit, which Life360 acquired in 2021.',
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.N8N_INGEST_WEBHOOK_URL = 'https://n8n.example/webhook/capstone-ingest';
  process.env.N8N_WEBHOOK_SECRET = 'shhh';
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'student@example.com' } },
  });
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockGetUser },
  });
  global.fetch = mockFetch as unknown as typeof fetch;
});

afterEach(() => {
  global.fetch = realFetch;
  delete process.env.N8N_INGEST_WEBHOOK_URL;
  delete process.env.N8N_WEBHOOK_SECRET;
});

describe('POST /api/ingest', () => {
  it('forwards the document to the n8n pipeline with the shared secret and relays the report', async () => {
    const report = {
      ok: true,
      stats: { entities: 3, created: 3, merged: 0, relationships: 2, episodes: 1, failedWrites: 0 },
      entities: [],
      relationships: [],
      episodes: ['ep1'],
      message: 'Ingested.',
    };
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify(report), { status: 200 })
    );

    const response = await POST(request(VALID_BODY));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.stats.entities).toBe(3);

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://n8n.example/webhook/capstone-ingest');
    expect(init.headers.API_KEY).toBe('shhh');
    const sent = JSON.parse(init.body);
    expect(sent.title).toBe('Instructor Bio');
    expect(sent.source).toContain('student@example.com');
  });

  it('passes guardrail blocks through with their original status', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ ok: false, error: 'guardrail_blocked', message: 'Secret key detected.' }),
        { status: 422 }
      )
    );

    const response = await POST(request(VALID_BODY));
    const body = await response.json();
    expect(response.status).toBe(422);
    expect(body.error).toBe('guardrail_blocked');
  });

  it('rejects too-short text with 400 without calling n8n', async () => {
    const response = await POST(request({ text: 'too short' }));
    expect(response.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 401 when not signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(request(VALID_BODY));
    expect(response.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('returns 503 when the pipeline is not configured', async () => {
    delete process.env.N8N_INGEST_WEBHOOK_URL;
    const response = await POST(request(VALID_BODY));
    expect(response.status).toBe(503);
  });

  it('returns 502 when n8n is unreachable', async () => {
    mockFetch.mockRejectedValue(new Error('connect ECONNREFUSED'));
    const response = await POST(request(VALID_BODY));
    expect(response.status).toBe(502);
  });

  it('returns 502 when n8n answers with non-JSON', async () => {
    mockFetch.mockResolvedValue(new Response('<html>boom</html>', { status: 500 }));
    const response = await POST(request(VALID_BODY));
    expect(response.status).toBe(502);
  });
});
