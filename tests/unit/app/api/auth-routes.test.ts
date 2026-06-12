/**
 * @jest-environment node
 */

const mockExchange = jest.fn();
const mockVerifyOtp = jest.fn();
const mockSignOut = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      exchangeCodeForSession: mockExchange,
      verifyOtp: mockVerifyOtp,
      signOut: mockSignOut,
    },
  })),
}));

import { GET as callbackGET } from '@/app/auth/callback/route';
import { GET as confirmGET } from '@/app/auth/confirm/route';
import { POST as signoutPOST } from '@/app/auth/signout/route';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /auth/callback', () => {
  it('exchanges the code and redirects to `next`', async () => {
    mockExchange.mockResolvedValue({ error: null });

    const res = await callbackGET(
      new Request('http://localhost:3000/auth/callback?code=abc123&next=/tasks')
    );

    expect(mockExchange).toHaveBeenCalledWith('abc123');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/tasks');
  });

  it('redirects to /login when there is no code', async () => {
    const res = await callbackGET(
      new Request('http://localhost:3000/auth/callback')
    );
    expect(res.headers.get('location')).toContain('/login');
  });
});

describe('GET /auth/confirm', () => {
  it('verifies the OTP and redirects', async () => {
    mockVerifyOtp.mockResolvedValue({ error: null });

    const res = await confirmGET(
      new Request(
        'http://localhost:3000/auth/confirm?token_hash=h&type=email&next=/'
      )
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      type: 'email',
      token_hash: 'h',
    });
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('redirects to /login when params are missing', async () => {
    const res = await confirmGET(
      new Request('http://localhost:3000/auth/confirm')
    );
    expect(res.headers.get('location')).toContain('/login');
  });
});

describe('POST /auth/signout', () => {
  it('signs out and 303-redirects to /login', async () => {
    const res = await signoutPOST(
      new Request('http://localhost:3000/auth/signout', { method: 'POST' })
    );

    expect(mockSignOut).toHaveBeenCalled();
    expect(res.status).toBe(303);
    expect(res.headers.get('location')).toContain('/login');
  });
});
