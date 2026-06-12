/**
 * @jest-environment node
 */

const mockCreateServerClient = jest.fn(() => ({ auth: {} }));
const mockCreateBrowserClient = jest.fn(() => ({ auth: {} }));

jest.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateServerClient,
  createBrowserClient: mockCreateBrowserClient,
}));

const mockGetAll = jest.fn(() => []);
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ getAll: mockGetAll, set: jest.fn() })),
}));

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('server createClient', () => {
  it('awaits cookies() and creates a server client with the env URL + key', async () => {
    const { createClient } = require('@/lib/supabase/server');
    const { cookies } = require('next/headers');

    await createClient();

    expect(cookies).toHaveBeenCalled();
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'anon-key',
      expect.objectContaining({ cookies: expect.any(Object) })
    );
  });
});

describe('browser createClient', () => {
  it('creates a browser client with the env URL + key', () => {
    const { createClient } = require('@/lib/supabase/client');

    createClient();

    expect(mockCreateBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'anon-key'
    );
  });
});
