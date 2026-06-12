import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockGetUser = jest.fn();
const mockUnsubscribe = jest.fn();
// Capture the auth-state-change callback so a test can fire it.
const mockAuthListener: { cb?: (event: string, session: unknown) => void } = {};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        mockAuthListener.cb = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
    },
  }),
}));

import Navigation from '@/app/components/Navigation';

describe('Navigation', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockUnsubscribe.mockReset();
    mockAuthListener.cb = undefined;
  });

  it('shows the email and a Sign Out form when signed in', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { email: 'student@example.com' } },
    });

    render(<Navigation />);

    expect(await screen.findByText('student@example.com')).toBeInTheDocument();
    const signOut = screen.getByRole('button', { name: /sign out/i });
    expect(signOut.closest('form')).toHaveAttribute('action', '/auth/signout');
  });

  it('hides Sign Out when signed out', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(<Navigation />);

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: /sign out/i })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByRole('link', { name: /^tasks$/i })).toBeInTheDocument();
  });

  it('updates the email when auth state changes', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    render(<Navigation />);
    await waitFor(() => expect(mockAuthListener.cb).toBeDefined());

    act(() => {
      mockAuthListener.cb!('SIGNED_IN', { user: { email: 'new@example.com' } });
    });

    expect(await screen.findByText('new@example.com')).toBeInTheDocument();
  });

  it('unsubscribes on unmount', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const { unmount } = render(<Navigation />);
    await waitFor(() => expect(mockAuthListener.cb).toBeDefined());
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
