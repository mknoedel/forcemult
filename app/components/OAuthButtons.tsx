'use client';

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Provider = 'google' | 'github';

/**
 * Social sign-in buttons. OAuth must be initiated from the browser because it
 * redirects the user to the provider and back to /auth/callback.
 *
 * Enable the Google/GitHub providers in your Supabase dashboard for these to
 * work (see SUPABASE_SETUP.md).
 */
export default function OAuthButtons() {
  async function signInWith(provider: Provider) {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => signInWith('google')}
      >
        Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => signInWith('github')}
      >
        Continue with GitHub
      </Button>
    </div>
  );
}
