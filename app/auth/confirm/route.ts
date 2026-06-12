import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Email confirmation / magic-link handler. Supabase emails a link containing a
 * `token_hash` and `type`; we verify it to establish a session, then redirect.
 *
 * For local dev you can disable "Confirm email" in Supabase to skip this step
 * (see SUPABASE_SETUP.md).
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not confirm email`);
}
