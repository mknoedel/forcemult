import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Navigation (rendered by this page) reads auth state from the Supabase
// browser client — stub it so it doesn't create a real client.
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  }),
}));

// Recharts' ResponsiveContainer relies on ResizeObserver, absent in jsdom.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

import ChartsPage from '@/app/charts/page';

describe('ChartsPage', () => {
  it('renders the page heading and chart section titles', () => {
    render(<ChartsPage />);

    expect(
      screen.getByRole('heading', { name: /charts example/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Monthly Sign-ups')).toBeInTheDocument();
    expect(screen.getByText('Growth Trend')).toBeInTheDocument();
    expect(screen.getByText('Why Recharts?')).toBeInTheDocument();
  });

  it('links to the shadcn/ui charts gallery', () => {
    render(<ChartsPage />);
    expect(
      screen.getByRole('link', { name: /shadcn\/ui charts gallery/i })
    ).toHaveAttribute('href', 'https://ui.shadcn.com/charts');
  });
});
