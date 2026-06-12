import { reportClientError } from '@/lib/report-client-error';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('reportClientError', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 204 });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('logs locally and POSTs the error payload to /api/client-errors', () => {
    const error = Object.assign(new Error('kaboom'), { digest: 'd1' });
    reportClientError(error, 'app/error');

    expect(logger.error).toHaveBeenCalledWith(
      'client error boundary',
      expect.objectContaining({ source: 'app/error', message: 'kaboom' })
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/client-errors');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      message: 'kaboom',
      digest: 'd1',
      source: 'app/error',
    });
  });

  it('never throws when fetch reporting fails', () => {
    fetchMock.mockImplementation(() => {
      throw new Error('network down');
    });
    expect(() =>
      reportClientError(new Error('boom'), 'app/global-error')
    ).not.toThrow();
    // The local log still happened even though the report failed.
    expect(logger.error).toHaveBeenCalled();
  });
});
