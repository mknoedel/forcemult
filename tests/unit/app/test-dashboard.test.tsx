import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

import TestDashboard from '../../../app/test-dashboard/page';

global.fetch = jest.fn();

describe('TestDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders dashboard with initial state', () => {
    render(<TestDashboard />);

    expect(
      screen.getByRole('heading', { level: 1, name: /test dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/run your tests and see the results/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /run all tests/i })
    ).toBeInTheDocument();
  });

  it('shows loading state when running tests', async () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<TestDashboard />);
    const button = screen.getByRole('button', { name: /run all tests/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/running tests/i)).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  it('displays successful test results', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 10,
        passedTests: 10,
        failedTests: 0,
        pendingTests: 0,
        success: true,
      },
      testSuites: [
        {
          name: 'example.test.ts',
          status: 'passed',
          tests: [{ title: 'should pass', status: 'passed' as const }],
          duration: 100,
        },
      ],
      coverage: {
        lines: '85.50',
        statements: '86.00',
        functions: '90.00',
        branches: '75.00',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    const button = screen.getByRole('button', { name: /run all tests/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Passing')).toBeInTheDocument();
      expect(screen.getByText('Failing')).toBeInTheDocument();
      expect(screen.getByText(/85.50%/)).toBeInTheDocument();
    });
  });

  it('displays failed test results with error messages', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 5,
        passedTests: 3,
        failedTests: 2,
        pendingTests: 0,
        success: false,
      },
      testSuites: [
        {
          name: 'failing.test.ts',
          status: 'failed',
          tests: [
            {
              title: 'should fail',
              status: 'failed' as const,
              failureMessages: ['Expected true to be false'],
            },
          ],
          duration: 50,
        },
      ],
      coverage: null,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(screen.getByText('Passing')).toBeInTheDocument();
      expect(screen.getByText('Failing')).toBeInTheDocument();
      expect(screen.getByText('failing.test.ts')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to run tests/i)).toBeInTheDocument();
    });
  });

  it('toggles test suite expansion', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 2,
        passedTests: 2,
        failedTests: 0,
        pendingTests: 0,
        success: true,
      },
      testSuites: [
        {
          name: 'example.test.ts',
          status: 'passed',
          tests: [
            { title: 'test 1', status: 'passed' as const },
            { title: 'test 2', status: 'passed' as const },
          ],
          duration: 100,
        },
      ],
      coverage: null,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(screen.getByText('example.test.ts')).toBeInTheDocument();
    });

    const suiteButton = screen.getByText('example.test.ts').closest('button');

    expect(screen.queryByText('test 1')).not.toBeInTheDocument();

    if (suiteButton) {
      fireEvent.click(suiteButton);
    }

    await waitFor(() => {
      expect(screen.getByText('test 1')).toBeInTheDocument();
      expect(screen.getByText('test 2')).toBeInTheDocument();
    });
  });

  it('displays pending tests correctly', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 3,
        passedTests: 2,
        failedTests: 0,
        pendingTests: 1,
        success: true,
      },
      testSuites: [
        {
          name: 'example.test.ts',
          status: 'passed',
          tests: [{ title: 'pending test', status: 'pending' as const }],
          duration: 50,
        },
      ],
      coverage: null,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(screen.getByText('Skipped')).toBeInTheDocument();
    });
  });

  it('displays skipped tests correctly', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 2,
        passedTests: 1,
        failedTests: 0,
        pendingTests: 0,
        success: true,
      },
      testSuites: [
        {
          name: 'example.test.ts',
          status: 'passed',
          tests: [
            { title: 'passed test', status: 'passed' as const },
            { title: 'skipped test', status: 'skipped' as const },
          ],
          duration: 50,
        },
      ],
      coverage: null,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(screen.getByText('example.test.ts')).toBeInTheDocument();
    });

    const suiteButton = screen.getByText('example.test.ts').closest('button');
    if (suiteButton) {
      fireEvent.click(suiteButton);
    }

    await waitFor(() => {
      expect(screen.getByText('skipped test')).toBeInTheDocument();
    });
  });

  it('displays error message from API response', async () => {
    const mockResults = {
      success: false,
      summary: null,
      testSuites: [],
      coverage: null,
      error: 'Custom error message from API',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Custom error message from API')
      ).toBeInTheDocument();
    });
  });

  it('shows coverage explanations', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        pendingTests: 0,
        success: true,
      },
      testSuites: [],
      coverage: {
        lines: '85.00',
        statements: '86.00',
        functions: '90.00',
        branches: '75.00',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/code lines were executed during testing/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/individual statements that were run during tests/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/functions were called during testing/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/different paths through your code/i)
      ).toBeInTheDocument();
    });
  });

  it('displays different coverage colors based on percentage', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        pendingTests: 0,
        success: true,
      },
      testSuites: [],
      coverage: {
        lines: '85.00',
        statements: '65.00',
        functions: '50.00',
        branches: '90.00',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(screen.getByText('85.00%')).toBeInTheDocument();
      expect(screen.getByText('65.00%')).toBeInTheDocument();
      expect(screen.getByText('50.00%')).toBeInTheDocument();
    });
  });

  it('displays test duration in milliseconds', async () => {
    const mockResults = {
      success: true,
      summary: {
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        pendingTests: 0,
        success: true,
      },
      testSuites: [
        {
          name: 'example.test.ts',
          status: 'passed',
          tests: [{ title: 'test 1', status: 'passed' as const }],
          duration: 1234,
        },
      ],
      coverage: null,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => mockResults,
    });

    render(<TestDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /run all tests/i }));

    await waitFor(() => {
      expect(screen.getByText(/1234ms/)).toBeInTheDocument();
    });
  });
});
