import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { UserSummaryCard } from '@/app/memory/components/UserSummaryCard';

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

describe('UserSummaryCard', () => {
  it('fetches and shows the user summary when the button is clicked', async () => {
    mockFetchOnce({
      data: { summary: 'Dana is a fintech founder.', hasSummary: true },
    });
    render(<UserSummaryCard />);

    await userEvent.click(
      screen.getByRole('button', { name: /summary|memory/i })
    );

    expect(global.fetch).toHaveBeenCalledWith('/api/memory/summary');
    await waitFor(() =>
      expect(
        screen.getByText(/Dana is a fintech founder\./)
      ).toBeInTheDocument()
    );
  });

  it('shows an empty-state message when there is no summary yet', async () => {
    mockFetchOnce({ data: { summary: '', hasSummary: false } });
    render(<UserSummaryCard />);

    await userEvent.click(
      screen.getByRole('button', { name: /summary|memory/i })
    );

    await waitFor(() =>
      expect(
        screen.getByText(/no .*memory yet|nothing yet/i)
      ).toBeInTheDocument()
    );
  });

  it('shows an error message when the request fails', async () => {
    mockFetchOnce({ error: 'Memory service not configured' }, false, 503);
    render(<UserSummaryCard />);

    await userEvent.click(
      screen.getByRole('button', { name: /summary|memory/i })
    );

    await waitFor(() =>
      expect(screen.getByText(/not configured/i)).toBeInTheDocument()
    );
  });
});
