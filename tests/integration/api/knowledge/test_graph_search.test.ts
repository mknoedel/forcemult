/** @jest-environment node */
import { POST } from '@/app/api/graph/search/route';
import { createClient } from '@/lib/supabase/server';
import { getZepClient } from '@/lib/zep/client';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/zep/client', () => ({ getZepClient: jest.fn() }));

const mockGetUser = jest.fn();
const mockSearch = jest.fn();

function request(body: unknown): Request {
  return new Request('http://localhost:3000/api/graph/search', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.ZEP_GRAPH_ID;
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockGetUser },
  });
  (getZepClient as jest.Mock).mockReturnValue({
    graph: { search: mockSearch },
  });
});

describe('POST /api/graph/search', () => {
  it('searches the shared domain graph and returns normalized results', async () => {
    mockSearch.mockResolvedValue({
      context: 'FACTS: John Renaldi founded Jiobit.',
      edges: [{ uuid: 'e1', fact: 'John Renaldi founded Jiobit.', name: 'FOUNDED' }],
      nodes: [{ uuid: 'n1', name: 'Jiobit', summary: 'Startup.', labels: ['Entity'] }],
      episodes: [],
    });

    const response = await POST(request({ query: 'who founded Jiobit?' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.facts).toHaveLength(1);
    expect(body.data.entities).toHaveLength(1);
    expect(body.metadata.graphId).toBe('capstone-kg');
    // Must hit the SHARED graph (graphId), never a per-user graph.
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ graphId: 'capstone-kg', scope: 'auto' })
    );
    expect(mockSearch).toHaveBeenCalledWith(
      expect.not.objectContaining({ userId: expect.anything() })
    );
  });

  it('rejects an empty query with 400', async () => {
    const response = await POST(request({ query: '  ' }));
    expect(response.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON with 400', async () => {
    const response = await POST(request('{nope'));
    expect(response.status).toBe(400);
  });

  it('returns 401 when not signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const response = await POST(request({ query: 'q' }));
    expect(response.status).toBe(401);
  });

  it('returns 503 when Zep is not configured', async () => {
    (getZepClient as jest.Mock).mockReturnValue(null);
    const response = await POST(request({ query: 'q' }));
    expect(response.status).toBe(503);
  });

  it('returns 502 when the graph search fails', async () => {
    mockSearch.mockRejectedValue(new Error('boom'));
    const response = await POST(request({ query: 'q' }));
    expect(response.status).toBe(502);
  });
});
