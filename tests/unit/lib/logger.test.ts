import { logger } from '@/lib/logger';

describe('logger', () => {
  let out: jest.SpyInstance;
  let err: jest.SpyInstance;

  beforeEach(() => {
    out = jest.spyOn(console, 'log').mockImplementation(() => {});
    err = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.LOG_LEVEL;
  });

  it('writes info to stdout as structured JSON with a timestamp', () => {
    logger.info('hello', { userId: '1' });

    expect(out).toHaveBeenCalledTimes(1);
    const entry = JSON.parse(out.mock.calls[0][0] as string);
    expect(entry).toMatchObject({
      level: 'info',
      message: 'hello',
      userId: '1',
    });
    expect(typeof entry.time).toBe('string');
  });

  it('routes error and warn to stderr, not stdout', () => {
    logger.error('boom');
    logger.warn('careful');

    expect(err).toHaveBeenCalledTimes(2);
    expect(out).not.toHaveBeenCalled();
  });

  it('suppresses messages below the configured LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'warn';

    logger.info('quiet');
    logger.debug('quiet');
    expect(out).not.toHaveBeenCalled();

    logger.error('loud');
    expect(err).toHaveBeenCalledTimes(1);
  });
});
