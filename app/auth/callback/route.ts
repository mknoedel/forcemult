import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * OAuth / PKCE callback. The provider redirects here with a `?code=...` which
 * we exchange for a session (setting the auth cookies), then send the user on.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not sign in`);
}
