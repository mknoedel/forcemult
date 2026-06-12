import { ZepClient } from '@getzep/zep-cloud';

/**
 * Returns a Zep client when ZEP_API_KEY is set, otherwise null so the chat
 * memory feature stays dormant. Factory (no module-level instantiation), like
 * the Supabase clients, so the app builds without the key configured.
 */
export function getZepClient(): ZepClient | null {
  const apiKey = process.env.ZEP_API_KEY;
  if (!apiKey) return null;
  // ZEP_BASE_URL points the SDK at a stand-in server (the local mock harness
  // in scripts/mocks). Leave unset in production to talk to Zep Cloud.
  const baseUrl = process.env.ZEP_BASE_URL;
  return new ZepClient(baseUrl ? { apiKey, environment: baseUrl } : { apiKey });
}
