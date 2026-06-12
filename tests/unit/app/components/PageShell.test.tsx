import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Navigation reads Supabase auth state — stub it.
jest.mock('@/app/components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="nav" />,
}));

import { PageShell } from '@/app/components/PageShell';

describe('PageShell', () => {
  it('renders the navigation and its children', () => {
    render(
      <PageShell>
        <p>page content</p>
      </PageShell>
    );
    expect(screen.getByTestId('nav')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('wraps children in the canonical content frame', () => {
    render(
      <PageShell>
        <p>x</p>
      </PageShell>
    );
    const main = screen.getByRole('main');
    expect(main).toHaveClass('max-w-content');
    expect(main).toHaveClass('px-6');
    expect(main).toHaveClass('md:px-9');
    expect(main).toHaveClass('py-12');
  });
});
