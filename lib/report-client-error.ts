import { logger } from '@/lib/logger';

/**
 * The error shape an App Router error boundary receives: a standard `Error`
 * plus the optional `digest` Next.js attaches to server-thrown errors.
 */
interface ReportableError {
  message?: string;
  stack?: string;
  digest?: string;
}

/**
 * Report a client-side crash caught by an error boundary. Logs locally (browser
 * console, for dev visibility) and best-effort POSTs the error to
 * `/api/client-errors` so production crashes leave a server-side trace. Never
 * throws — an error boundary must not error while reporting an error.
 */
export function reportClientError(
  error: ReportableError,
  source: string
): void {
  const message = error.message ?? 'Unknown error';

  logger.error('client error boundary', { source, message });

  try {
    void fetch('/api/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        stack: error.stack,
        digest: error.digest,
        source,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
      // Survive a page teardown so the report still flushes.
      keepalive: true,
    });
  } catch {
    // Reporting is best-effort; swallow any failure so the fallback UI renders.
  }
}
