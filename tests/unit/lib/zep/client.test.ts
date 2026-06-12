/** @jest-environment node */
import { getZepClient } from '@/lib/zep/client';

describe('getZepClient', () => {
  const original = process.env;
  beforeEach(() => {
    process.env = { ...original };
  });
  afterEach(() => {
    process.env = original;
  });

  it('returns null when ZEP_API_KEY is not set', () => {
    delete process.env.ZEP_API_KEY;
    expect(getZepClient()).toBeNull();
  });

  it('returns a client instance when ZEP_API_KEY is set', () => {
    process.env.ZEP_API_KEY = 'z_test_key';
    const client = getZepClient();
    expect(client).not.toBeNull();
    expect(client?.thread).toBeDefined();
  });
});
