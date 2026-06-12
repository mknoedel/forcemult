import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Supabase client for use inside Client Components (`'use client'`).
 *
 * Use this for browser-initiated auth flows (OAuth sign-in, reading the current
 * user in the nav, signing out from the client). It reads the cookies the
 * server set, so it shares the same session.
 *
 * This is a factory (not a module-level singleton) so nothing is instantiated
 * at import time — the app still builds without Supabase env vars present.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
