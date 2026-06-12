/**
 * @jest-environment node
 */

const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
    },
  })),
}));
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
// redirect() halts execution by throwing in Next; emulate that so we can assert
// the destination and stop the action there.
jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { login, signup } from '@/app/login/actions';

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('login action', () => {
  it('redirects home on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    await expect(
      login(form({ email: 'a@b.com', password: 'secret' }))
    ).rejects.toThrow('REDIRECT:/');
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
    });
  });

  it('redirects back to /login with the error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });
    await expect(
      login(form({ email: 'a@b.com', password: 'wrong' }))
    ).rejects.toThrow('REDIRECT:/login?error=Invalid%20login%20credentials');
  });
});

describe('signup action', () => {
  it('redirects home on success', async () => {
    mockSignUp.mockResolvedValue({ error: null });
    await expect(
      signup(form({ email: 'new@b.com', password: 'secret1' }))
    ).rejects.toThrow('REDIRECT:/');
  });

  it('redirects back to /signup with the error message on failure', async () => {
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered' },
    });
    await expect(
      signup(form({ email: 'new@b.com', password: 'secret1' }))
    ).rejects.toThrow('REDIRECT:/signup?error=User%20already%20registered');
  });
});
