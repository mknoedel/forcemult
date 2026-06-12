import { z } from 'zod';
import { logger } from '@/lib/logger';

// Error reports posted by the client-side error boundaries (app/error.tsx,
// app/global-error.tsx via lib/report-client-error). Kept permissive — a crash
// report should never be rejected for a missing optional field.
const clientErrorSchema = z.object({
  message: z.string().min(1),
  stack: z.string().optional(),
  digest: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
});

/**
 * Receives client-side crash reports and records them server-side via the
 * structured logger, so errors that only happen in the browser (hydration,
 * render crashes) still leave a trace in the server logs. Returns 204 on
 * success, 400 for a malformed body.
 */
export async function POST(request: Request): Promise<Response> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }

  const parsed = clientErrorSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }

  logger.error('client error', { ...parsed.data });
  return new Response(null, { status: 204 });
}
