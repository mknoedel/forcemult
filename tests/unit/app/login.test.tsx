import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// The pages import server actions, which pull in next/cache + next/navigation
// and the @supabase/ssr server client. Mock those so the pages import cleanly
// in jsdom (we're only asserting the rendered form here).
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }));
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }));
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signInWithOAuth: jest.fn() } }),
}));

import LoginPage from '@/app/login/page';
import SignupPage from '@/app/signup/page';

describe('LoginPage', () => {
  it('renders the sign-in form, OAuth buttons, and a signup link', async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^sign in$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue with google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue with github/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/signup'
    );
  });

  it('shows an error message from searchParams', async () => {
    render(
      await LoginPage({
        searchParams: Promise.resolve({ error: 'Invalid login credentials' }),
      })
    );
    expect(screen.getByText('Invalid login credentials')).toBeInTheDocument();
  });
});

describe('SignupPage', () => {
  it('renders the sign-up form and a login link', async () => {
    render(await SignupPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^sign up$/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('shows an error message from searchParams', async () => {
    render(
      await SignupPage({
        searchParams: Promise.resolve({ error: 'User already registered' }),
      })
    );
    expect(screen.getByText('User already registered')).toBeInTheDocument();
  });
});
