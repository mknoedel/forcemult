import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

// Paths that do NOT require authentication. Everything else redirects to
// /login when there is no signed-in user.
const PUBLIC_PATHS = ['/login', '/signup', '/auth'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );
}

/**
 * Refreshes the Supabase auth session on every request and gates access.
 *
 * Called from the root `proxy.ts`. It must:
 *  1. Refresh the session token by calling `auth.getUser()`.
 *  2. Return the exact response object that carries the refreshed cookies.
 *  3. Redirect unauthenticated users away from protected pages.
 */
export async function updateSession(
  request: NextRequest
): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to the request (so downstream sees the refreshed token) and
          // to the response (so the browser receives the updated cookies).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  // getUser() revalidates the token and triggers the cookie refresh above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
