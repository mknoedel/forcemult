import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockReport = jest.fn();
jest.mock('@/lib/report-client-error', () => ({
  reportClientError: (...args: unknown[]) => mockReport(...args),
}));

import ErrorBoundary from '@/app/error';

describe('app/error.tsx route error boundary', () => {
  beforeEach(() => mockReport.mockClear());

  it('renders a friendly fallback message', () => {
    render(<ErrorBoundary error={new Error('boom')} reset={jest.fn()} />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('reports the error on mount with its source', () => {
    const error = new Error('boom');
    render(<ErrorBoundary error={error} reset={jest.fn()} />);
    expect(mockReport).toHaveBeenCalledWith(error, 'app/error');
  });

  it('calls reset when the retry button is clicked', async () => {
    const reset = jest.fn();
    render(<ErrorBoundary error={new Error('boom')} reset={reset} />);
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalled();
  });
});
