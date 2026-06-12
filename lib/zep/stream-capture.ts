import { logger } from '@/lib/logger';

/**
 * A pass-through transform that accumulates the streamed assistant text and,
 * when the stream closes, hands the full reply to `onComplete`. Used to log a
 * chat turn to Zep after the reply has streamed to the client. `onComplete`
 * runs in flush(); its failure is logged and never surfaces to the client
 * stream, and the await keeps the function alive until the write finishes.
 */
export function createCaptureStream(
  onComplete: (assistantText: string) => Promise<void>
): TransformStream<string, string> {
  let buffer = '';
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      buffer += chunk;
      controller.enqueue(chunk);
    },
    async flush() {
      try {
        await onComplete(buffer);
      } catch (error) {
        logger.error('Zep capture onComplete failed', { error: String(error) });
      }
    },
  });
}
