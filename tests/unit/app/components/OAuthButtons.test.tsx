import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockSignInWithOAuth = jest.fn();
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOAuth: mockSignInWithOAuth } }),
}));

import OAuthButtons from '@/app/components/OAuthButtons';

describe('OAuthButtons', () => {
  beforeEach(() => mockSignInWithOAuth.mockReset());

  it('signs in with Google', async () => {
    const user = userEvent.setup();
    render(<OAuthButtons />);

    await user.click(
      screen.getByRole('button', { name: /continue with google/i })
    );

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        options: expect.objectContaining({
          redirectTo: expect.stringContaining('/auth/callback'),
        }),
      })
    );
  });

  it('signs in with GitHub', async () => {
    const user = userEvent.setup();
    render(<OAuthButtons />);

    await user.click(
      screen.getByRole('button', { name: /continue with github/i })
    );

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'github' })
    );
  });
});
