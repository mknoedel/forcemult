import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

/**
 * Supabase client for use on the server: Server Components, Route Handlers, and
 * Server Actions. It reads/writes the session from cookies, so queries run as
 * the signed-in user and Row Level Security applies.
 *
 * `cookies()` is async in Next.js 16, so this factory is async — always
 * `await createClient()`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. This is safe to ignore: the proxy refreshes the
            // session cookie on every request instead.
          }
        },
      },
    }
  );
}
