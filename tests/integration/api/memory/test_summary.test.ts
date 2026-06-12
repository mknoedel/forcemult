/** @jest-environment node */
import { GET } from '@/app/api/memory/summary/route';
import { createClient } from '@/lib/supabase/server';
import { getZepClient } from '@/lib/zep/client';

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/zep/client', () => ({ getZepClient: jest.fn() }));

const mockGetUser = jest.fn();
const mockGetNode = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockGetUser },
  });
  (getZepClient as jest.Mock).mockReturnValue({
    user: { getNode: mockGetNode },
  });
});

describe('GET /api/memory/summary', () => {
  it('returns the user-node summary scoped to the signed-in user', async () => {
    mockGetNode.mockResolvedValue({
      node: { summary: 'Dana is a fintech founder building in payments.' },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      summary: 'Dana is a fintech founder building in payments.',
      hasSummary: true,
    });
    // Never trust a client-supplied id — the route uses the session user id.
    expect(mockGetNode).toHaveBeenCalledWith('user-123');
  });

  it('returns hasSummary=false when no summary exists yet', async () => {
    mockGetNode.mockResolvedValue({ node: { summary: '' } });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual({ summary: '', hasSummary: false });
  });

  it('returns 401 when there is no signed-in user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();
    expect(response.status).toBe(401);
    expect(mockGetNode).not.toHaveBeenCalled();
  });

  it('returns 503 when Zep is not configured', async () => {
    (getZepClient as jest.Mock).mockReturnValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not configured/i);
  });

  it('returns 502 when the Zep call fails', async () => {
    mockGetNode.mockRejectedValue(new Error('zep boom'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBeDefined();
  });
});
