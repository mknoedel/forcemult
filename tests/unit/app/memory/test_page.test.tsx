import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// The page renders the shared Navigation (a client component that calls
// Supabase). Stub it so this test focuses on the educational memory content.
jest.mock('@/app/components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="nav" />,
}));

import MemoryPage from '@/app/memory/page';

describe('Memory & Knowledge Graphs page', () => {
  beforeEach(() => {
    render(<MemoryPage />);
  });

  it('has a single page title about how AI remembers you', () => {
    expect(
      screen.getByRole('heading', { level: 1, name: /remembers? you/i })
    ).toBeInTheDocument();
  });

  it('explains what long-term memory is for an AI agent', () => {
    expect(
      screen.getByRole('heading', { name: /long-term memory/i })
    ).toBeInTheDocument();
  });

  it('explains knowledge graphs in plain language (nodes, edges, episodes)', () => {
    expect(
      screen.getByRole('heading', { name: /what is a knowledge graph/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/nodes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/edges/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/episodes/i).length).toBeGreaterThan(0);
  });

  it('explains how this app uses Zep for chat memory', () => {
    expect(screen.getAllByText(/zep/i).length).toBeGreaterThan(0);
  });

  it('includes the interactive "fetch my long-term memory" tool', () => {
    expect(
      screen.getByRole('button', { name: /summary|memory/i })
    ).toBeInTheDocument();
  });

  it('includes the interactive graph search explorer', () => {
    expect(
      screen.getByRole('heading', { name: /search the knowledge graph/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /^search$/i })
    ).toBeInTheDocument();
  });
});
