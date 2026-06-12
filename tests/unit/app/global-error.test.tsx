import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockReport = jest.fn();
jest.mock('@/lib/report-client-error', () => ({
  reportClientError: (...args: unknown[]) => mockReport(...args),
}));

import GlobalError from '@/app/global-error';

// GlobalError renders its own <html>/<body> (it replaces the root layout). React
// 19 hoists those singletons onto the existing jsdom document, so we render into
// the document root rather than RTL's default <div> container (which can't nest
// an <html>).
function renderGlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return render(<GlobalError {...props} />, {
    container: document.documentElement,
    baseElement: document.documentElement,
  });
}

describe('app/global-error.tsx global error boundary', () => {
  // Rendering <html>/<body> into jsdom triggers React's DOM-nesting warning.
  // The render still succeeds; the component's own error reporting goes through
  // the mocked reportClientError (not the console), so silencing console.error
  // here only suppresses that expected jsdom noise.
  let consoleError: jest.SpyInstance;
  beforeAll(() => {
    consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => consoleError.mockRestore());

  beforeEach(() => mockReport.mockClear());

  it('renders a friendly fallback message', () => {
    renderGlobalError({ error: new Error('boom'), reset: jest.fn() });
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('reports the error on mount with its source', () => {
    const error = new Error('boom');
    renderGlobalError({ error, reset: jest.fn() });
    expect(mockReport).toHaveBeenCalledWith(error, 'app/global-error');
  });

  it('calls reset when the retry button is clicked', async () => {
    const reset = jest.fn();
    renderGlobalError({ error: new Error('boom'), reset });
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalled();
  });
});
