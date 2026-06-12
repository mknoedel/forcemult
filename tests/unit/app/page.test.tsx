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

import HomePage from '../../../app/page';

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', {
      name: /northwestern mmm & mpd2 starter template/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it('renders the welcome message', () => {
    render(<HomePage />);
    const message = screen.getByText(
      /welcome to your next.js starter project/i
    );
    expect(message).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<HomePage />);
    const tasksLinks = screen.getAllByRole('link', { name: /tasks example/i });
    const testDashboardLinks = screen.getAllByRole('link', {
      name: /test dashboard/i,
    });

    expect(tasksLinks.length).toBeGreaterThan(0);
    expect(tasksLinks[0]).toHaveAttribute('href', '/tasks');

    expect(testDashboardLinks.length).toBeGreaterThan(0);
    expect(testDashboardLinks[0]).toHaveAttribute('href', '/test-dashboard');
  });

  it('renders the TDD framework section', () => {
    render(<HomePage />);
    const tddSection = screen.getByText(
      /test-driven development \(tdd\) framework/i
    );
    expect(tddSection).toBeInTheDocument();
  });

  it('renders the AI coding assistant section', () => {
    render(<HomePage />);
    const aiSection = screen.getByText(/ai coding assistant instructions/i);
    expect(aiSection).toBeInTheDocument();
  });

  it('renders the database integration callout', () => {
    render(<HomePage />);
    const dbCallout = screen.getByText(/database integration example/i);
    expect(dbCallout).toBeInTheDocument();
    expect(screen.getByText(/supabase database example/i)).toBeInTheDocument();
  });

  it('renders link to Supabase tasks example', () => {
    render(<HomePage />);
    const tasksExampleLinks = screen.getAllByRole('link', {
      name: /view tasks example/i,
    });
    expect(tasksExampleLinks.length).toBeGreaterThan(0);
    expect(tasksExampleLinks[0]).toHaveAttribute('href', '/tasks');
  });
});
