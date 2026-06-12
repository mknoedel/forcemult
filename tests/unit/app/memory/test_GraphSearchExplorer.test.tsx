import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { GraphSearchExplorer } from '@/app/memory/components/GraphSearchExplorer';

function mockFetchOnce(body: unknown, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GraphSearchExplorer', () => {
  it('offers sample queries that fill the search box when clicked', async () => {
    render(<GraphSearchExplorer />);
    const samples = screen.getAllByTestId('sample-query');
    expect(samples.length).toBeGreaterThan(0);

    await userEvent.click(samples[0]);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value.length).toBeGreaterThan(0);
  });

  it('posts the query and renders the auto-search context block plus facts', async () => {
    mockFetchOnce({
      data: {
        context: 'Dana decided to pursue a freemium pricing model.',
        facts: [{ uuid: 'e1', fact: 'Dana prefers freemium', name: 'PREFERS' }],
        entities: [
          { uuid: 'n1', name: 'Freemium', summary: 'A pricing model.' },
        ],
        episodes: [],
      },
      metadata: { query: 'pricing', scope: 'auto' },
    });
    render(<GraphSearchExplorer />);

    await userEvent.type(screen.getByRole('textbox'), 'pricing');
    await userEvent.click(screen.getByRole('button', { name: /^search$/i }));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/memory/search',
      expect.objectContaining({ method: 'POST' })
    );
    await waitFor(() =>
      expect(screen.getByText(/freemium pricing model/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/Dana prefers freemium/)).toBeInTheDocument();
    expect(screen.getByText('Freemium')).toBeInTheDocument();
  });

  it('shows an empty-state when nothing comes back', async () => {
    mockFetchOnce({
      data: { context: '', facts: [], entities: [], episodes: [] },
      metadata: { query: 'unknown', scope: 'auto' },
    });
    render(<GraphSearchExplorer />);

    await userEvent.type(screen.getByRole('textbox'), 'unknown');
    await userEvent.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/nothing came back|no results/i)
      ).toBeInTheDocument()
    );
  });

  it('shows an error message when the request fails', async () => {
    mockFetchOnce({ error: 'Memory service not configured' }, false, 503);
    render(<GraphSearchExplorer />);

    await userEvent.type(screen.getByRole('textbox'), 'pricing');
    await userEvent.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() =>
      expect(screen.getByText(/not configured/i)).toBeInTheDocument()
    );
  });

  it('does not search when the input is empty', async () => {
    mockFetchOnce({ data: {} });
    render(<GraphSearchExplorer />);

    await userEvent.click(screen.getByRole('button', { name: /^search$/i }));

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
