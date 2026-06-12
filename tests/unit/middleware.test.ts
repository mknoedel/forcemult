/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

const mockGetUser = jest.fn();

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({ auth: { getUser: mockGetUser } })),
}));

import { updateSession } from '@/lib/supabase/middleware';

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
});

beforeEach(() => {
  mockGetUser.mockReset();
});

function request(path: string) {
  return new NextRequest(`http://localhost:3000${path}`);
}

describe('updateSession', () => {
  it('redirects unauthenticated users from a protected page to /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request('/tasks'));

    expect(res.headers.get('location')).toContain('/login');
  });

  it('lets unauthenticated users reach /login', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request('/login'));

    expect(res.headers.get('location')).toBeNull();
  });

  it('lets unauthenticated users reach /auth/* routes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const res = await updateSession(request('/auth/callback'));

    expect(res.headers.get('location')).toBeNull();
  });

  it('lets authenticated users reach protected pages', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });

    const res = await updateSession(request('/tasks'));

    expect(res.headers.get('location')).toBeNull();
  });
});
