/**
 * @jest-environment node
 */

import { POST } from '@/app/api/client-errors/route';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

function makeRequest(body: unknown, raw?: string): Request {
  return new Request('http://localhost/api/client-errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ?? JSON.stringify(body),
  });
}

describe('POST /api/client-errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs the reported error server-side and returns 204', async () => {
    const res = await POST(
      makeRequest({
        message: 'boom on the client',
        source: 'app/error',
        url: 'http://localhost/chat',
        digest: 'abc123',
      })
    );

    expect(res.status).toBe(204);
    expect(logger.error).toHaveBeenCalledTimes(1);
    const [msg, meta] = (logger.error as jest.Mock).mock.calls[0];
    expect(msg).toBe('client error');
    expect(meta).toMatchObject({
      message: 'boom on the client',
      source: 'app/error',
      digest: 'abc123',
    });
  });

  it('returns 400 and does not log when message is missing', async () => {
    const res = await POST(makeRequest({ source: 'app/error' }));
    expect(res.status).toBe(400);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid JSON', async () => {
    const res = await POST(makeRequest(undefined, '{not json'));
    expect(res.status).toBe(400);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
