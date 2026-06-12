import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { ChatContextPanel } from '@/app/components/chat/ChatContextPanel';

function mockFetchOnce(body: unknown, ok = true) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: async () => body,
  });
}

describe('ChatContextPanel', () => {
  beforeEach(() => {
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('auto-loads the user memory on mount and renders the summary', async () => {
    mockFetchOnce({
      data: { summary: 'John is an MMM student.', hasSummary: true },
    });

    render(<ChatContextPanel />);

    expect(global.fetch).toHaveBeenCalledWith('/api/memory/summary');
    expect(
      await screen.findByText('John is an MMM student.')
    ).toBeInTheDocument();
  });

  it('shows an empty state when there is no summary yet', async () => {
    mockFetchOnce({ data: { summary: '', hasSummary: false } });

    render(<ChatContextPanel />);

    expect(
      await screen.findByText(/no long-term memory yet/i)
    ).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    mockFetchOnce({ error: 'Memory service not configured.' }, false);

    render(<ChatContextPanel />);

    expect(
      await screen.findByText('Memory service not configured.')
    ).toBeInTheDocument();
  });

  it('refetches when the manual refresh button is clicked', async () => {
    mockFetchOnce({ data: { summary: 'First.', hasSummary: true } });
    render(<ChatContextPanel />);
    await screen.findByText('First.');

    mockFetchOnce({ data: { summary: 'Second.', hasSummary: true } });
    await userEvent.click(screen.getByRole('button', { name: /refresh/i }));

    expect(await screen.findByText('Second.')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('refetches when the refreshSignal prop changes', async () => {
    mockFetchOnce({ data: { summary: 'Turn one.', hasSummary: true } });
    const { rerender } = render(<ChatContextPanel refreshSignal={0} />);
    await screen.findByText('Turn one.');

    mockFetchOnce({ data: { summary: 'Turn two.', hasSummary: true } });
    rerender(<ChatContextPanel refreshSignal={1} />);

    expect(await screen.findByText('Turn two.')).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  // --- "Relevant to your question" section (query-driven graph search) ---

  function mockFetchByUrl(handlers: {
    summary?: { body: unknown; ok?: boolean };
    search?: { body: unknown; ok?: boolean };
  }) {
    global.fetch = jest.fn((url: string) => {
      if (url === '/api/memory/summary' && handlers.summary) {
        return Promise.resolve({
          ok: handlers.summary.ok ?? true,
          json: async () => handlers.summary!.body,
        });
      }
      if (url === '/api/memory/search' && handlers.search) {
        return Promise.resolve({
          ok: handlers.search.ok ?? true,
          json: async () => handlers.search!.body,
        });
      }
      return Promise.reject(new Error('unexpected fetch: ' + url));
    }) as unknown as typeof fetch;
  }

  const searchResult = (context: string) => ({
    data: { context, facts: [], entities: [], episodes: [] },
  });

  it('renders both a "Who you are" and a "Relevant to your question" section', async () => {
    mockFetchByUrl({
      summary: { body: { data: { summary: 'profile', hasSummary: true } } },
      search: { body: searchResult('Presto clients dataset.') },
    });
    render(<ChatContextPanel question="which dataset do I use?" />);

    expect(await screen.findByText(/who you are/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/relevant to your question/i)
    ).toBeInTheDocument();
  });

  it('runs a graph search for the latest question and shows the relevant context', async () => {
    mockFetchByUrl({
      summary: { body: { data: { summary: 'profile', hasSummary: true } } },
      search: { body: searchResult('Presto clients dataset.') },
    });
    render(<ChatContextPanel question="which dataset do I use?" />);

    expect(
      await screen.findByText('Presto clients dataset.')
    ).toBeInTheDocument();

    const searchCall = (global.fetch as jest.Mock).mock.calls.find(
      (c) => c[0] === '/api/memory/search'
    );
    expect(searchCall).toBeTruthy();
    expect(searchCall![1].method).toBe('POST');
    expect(JSON.parse(searchCall![1].body).query).toBe(
      'which dataset do I use?'
    );
  });

  it('does not search and shows a hint when there is no question yet', async () => {
    mockFetchByUrl({
      summary: { body: { data: { summary: 'profile', hasSummary: true } } },
    });
    render(<ChatContextPanel question="" />);
    await screen.findByText('profile');

    const searchCall = (global.fetch as jest.Mock).mock.calls.find(
      (c) => c[0] === '/api/memory/search'
    );
    expect(searchCall).toBeUndefined();
    expect(screen.getByText(/ask a question to see/i)).toBeInTheDocument();
  });

  it('re-searches when the question changes', async () => {
    mockFetchByUrl({
      summary: { body: { data: { summary: 'profile', hasSummary: true } } },
      search: { body: searchResult('first answer') },
    });
    const { rerender } = render(<ChatContextPanel question="q1" />);
    await screen.findByText('first answer');

    mockFetchByUrl({
      summary: { body: { data: { summary: 'profile', hasSummary: true } } },
      search: { body: searchResult('second answer') },
    });
    rerender(<ChatContextPanel question="q2" />);

    expect(await screen.findByText('second answer')).toBeInTheDocument();
  });
});
