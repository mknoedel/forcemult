/** @jest-environment node */
import { createCaptureStream } from '@/lib/zep/stream-capture';

async function drain(stream: ReadableStream<string>): Promise<string[]> {
  const reader = stream.getReader();
  const out: string[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out.push(value);
  }
  return out;
}

function sourceOf(chunks: string[]): ReadableStream<string> {
  return new ReadableStream<string>({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

describe('createCaptureStream', () => {
  it('passes every chunk through unchanged', async () => {
    const cap = createCaptureStream(async () => {});
    const out = await drain(sourceOf(['Hel', 'lo ', 'world']).pipeThrough(cap));
    expect(out.join('')).toBe('Hello world');
  });

  it('calls onComplete once with the full accumulated text after the stream ends', async () => {
    const onComplete = jest.fn().mockResolvedValue(undefined);
    const cap = createCaptureStream(onComplete);
    await drain(sourceOf(['a', 'b', 'c']).pipeThrough(cap));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('abc');
  });

  it('does not reject the stream when onComplete throws', async () => {
    const cap = createCaptureStream(async () => {
      throw new Error('zep write failed');
    });
    await expect(drain(sourceOf(['x']).pipeThrough(cap))).resolves.toEqual([
      'x',
    ]);
  });
});
