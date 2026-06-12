/** @jest-environment node */
import { POST } from '@/app/api/memory/search/route';
import { createClient } from '@/lib/supabase/server';
import { getZepClient } from '@/lib/zep/client';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/zep/client', () => ({ getZepClient: jest.fn() }));

const mockGetUser = jest.fn();
const mockSearch = jest.fn();

function request(body: unknown): Request {
  return new Request('http://localhost:3000/api/memory/search', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockGetUser },
  });
  (getZepClient as jest.Mock).mockReturnValue({
    graph: { search: mockSearch },
  });
});

describe('POST /api/memory/search', () => {
  it('runs an auto graph search scoped to the user and returns normalized results', async () => {
    mockSearch.mockResolvedValue({
      context: 'Dana decided to pursue a freemium model.',
      edges: [{ uuid: 'e1', fact: 'Dana prefers freemium', name: 'PREFERS' }],
      nodes: [{ uuid: 'n1', name: 'Freemium', summary: 'A pricing model.' }],
      episodes: [],
    });

    const response = await POST(request({ query: 'pricing strategy' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.context).toContain('freemium');
    expect(body.data.facts).toHaveLength(1);
    expect(body.data.entities).toHaveLength(1);
    expect(body.metadata.query).toBe('pricing strategy');
    // Search must be scoped to the session user, with auto scope.
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        scope: 'auto',
        returnRawResults: true,
      })
    );
  });

  it('rejects an empty query with 400', async () => {
    const response = await POST(request({ query: '   ' }));
    expect(response.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('rejects a query over 400 characters with 400', async () => {
    const response = await POST(request({ query: 'x'.repeat(401) }));
    expect(response.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('rejects a missing query field with 400', async () => {
    const response = await POST(request({}));
    expect(response.status).toBe(400);
  });

  it('returns 400 on invalid JSON', async () => {
    const response = await POST(request('{not json'));
    expect(response.status).toBe(400);
  });

  it('returns 401 when there is no signed-in user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await POST(request({ query: 'pricing' }));
    expect(response.status).toBe(401);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('returns 503 when Zep is not configured', async () => {
    (getZepClient as jest.Mock).mockReturnValue(null);

    const response = await POST(request({ query: 'pricing' }));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not configured/i);
  });

  it('returns 502 when the Zep search fails', async () => {
    mockSearch.mockRejectedValue(new Error('zep boom'));

    const response = await POST(request({ query: 'pricing' }));
    expect(response.status).toBe(502);
  });
});
