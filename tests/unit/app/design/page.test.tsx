import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// The page renders the shared Navigation (a client component that calls
// Supabase). Stub it so this test focuses on the educational design content.
jest.mock('@/app/components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="nav" />,
}));

import DesignPage from '@/app/design/page';

describe('Design System page', () => {
  beforeEach(() => {
    render(<DesignPage />);
  });

  it('has a single page title and explains what a design system is', () => {
    expect(
      screen.getByRole('heading', { level: 1, name: /design system/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/what is a design system\?/i)).toBeInTheDocument();
    // shadcn/ui is explained in plain language (appears in more than one place).
    expect(screen.getAllByText(/shadcn\/ui/i).length).toBeGreaterThan(0);
  });

  it('shows color tokens with their Tailwind class and CSS variable', () => {
    expect(
      screen.getByRole('heading', { name: /color tokens/i })
    ).toBeInTheDocument();
    expect(screen.getByText('--primary')).toBeInTheDocument();
    expect(screen.getAllByText('bg-primary').length).toBeGreaterThan(0);
  });

  it('reads each color value live from the rendered theme', () => {
    expect(screen.getByText(/read live from your/i)).toBeInTheDocument();
  });

  it('points to more shadcn components you can add', () => {
    expect(screen.getByText(/what else you can add/i)).toBeInTheDocument();
    expect(screen.getByText('Dialog')).toBeInTheDocument();
    const browse = screen.getByRole('link', { name: /browse all components/i });
    expect(browse).toHaveAttribute(
      'href',
      expect.stringContaining('ui.shadcn.com')
    );
  });

  it('shows the typography & shape section', () => {
    expect(
      screen.getByRole('heading', { name: /typography/i })
    ).toBeInTheDocument();
  });

  it('shows the component gallery with real shadcn primitives', () => {
    expect(
      screen.getByRole('heading', { name: /building blocks/i })
    ).toBeInTheDocument();
    // A real <Button variant="destructive"> is rendered, not a picture of one.
    expect(
      screen.getByRole('button', { name: 'Destructive' })
    ).toBeInTheDocument();
  });

  it('frames the problem first — "Frankenstein" UI without a system', () => {
    expect(
      screen.getByRole('heading', { name: /without a design system/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/frankenstein/i).length).toBeGreaterThan(0);
  });

  it('credits the open DESIGN.md format from Google Labs and links to it', () => {
    expect(
      screen.getByRole('heading', { name: /design\.md/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/google labs/i).length).toBeGreaterThan(0);
    const repoLink = screen.getByRole('link', {
      name: /design\.md on github/i,
    });
    expect(repoLink).toHaveAttribute(
      'href',
      expect.stringContaining('github.com/google-labs-code/design.md')
    );
  });

  it('explains how enforcement prevents Frankenstein UI', () => {
    expect(screen.getAllByText(/eslint/i).length).toBeGreaterThan(0);
  });

  it('teaches how to add a new component with the shadcn CLI', () => {
    expect(
      screen.getByRole('heading', { name: /adding a new component/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/npx shadcn@latest add/i)).toBeInTheDocument();
  });
});
