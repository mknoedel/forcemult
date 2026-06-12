'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/**
 * Email/password sign-in. Called as a form action from /login.
 * On success the session cookie is set and the user lands on the home page.
 */
export async function login(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Email/password sign-up. Called as a form action from /signup.
 * If "Confirm email" is enabled in Supabase, the user must click the emailed
 * link (handled by /auth/confirm) before a session exists.
 */
export async function signup(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: String(formData.get('email')),
    password: String(formData.get('password')),
    options: {
      emailRedirectTo: `${siteUrl()}/auth/confirm`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/');
}
