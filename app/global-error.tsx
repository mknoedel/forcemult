'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/report-client-error';

/**
 * Global error boundary. Catches errors thrown in the root layout itself, where
 * the normal error boundary (app/error.tsx) cannot render. It must provide its
 * own `<html>`/`<body>` because it replaces the root layout. Styling is kept
 * minimal and token-based so it renders even if the app shell failed to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, 'app/global-error');
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-muted-foreground">
            The application hit an unexpected error. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border-2 border-foreground bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
