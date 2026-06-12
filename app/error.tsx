'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { reportClientError } from '@/lib/report-client-error';

/**
 * Route-level error boundary. Next.js renders this when a Server/Client
 * Component below the root layout throws during render. It reports the crash
 * (server-side trace + local log) and offers the user a way to retry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, 'app/error');
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred while loading this page. You can try again
        — if it keeps happening, refresh or come back in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
