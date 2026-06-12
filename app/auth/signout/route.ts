import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Signs the user out and sends them to /login. Called by the Sign Out form in
 * the navigation (POST so it isn't triggered by prefetch/GET).
 */
export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // 303 so the browser follows with a GET to /login.
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
