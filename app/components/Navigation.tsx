'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/charts', label: 'Charts' },
  { href: '/chat', label: 'Chat' },
  { href: '/test-dashboard', label: 'Tests' },
  { href: '/design', label: 'Design' },
  { href: '/memory', label: 'Memory' },
];

function LogoMark() {
  return (
    <span className="relative block h-7 w-7 shrink-0" aria-hidden="true">
      <span className="absolute left-0 h-7 w-3.5 rounded-l-full bg-primary" />
      <span className="absolute right-0 top-0 h-3.5 w-3.5 bg-coral" />
      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-br-full bg-gold" />
    </span>
  );
}

export default function Navigation() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b-2 border-foreground bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between gap-4 px-6 md:px-9">
        <Link
          href="/"
          className="flex items-center gap-3 font-display text-lg font-extrabold tracking-tight transition-opacity hover:opacity-80"
        >
          <LogoMark />
          MMM · MPD² Studio
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {email && (
            <div className="flex items-center gap-2 border-l-2 border-border pl-2">
              <span className="hidden text-sm text-muted-foreground xl:inline">
                {email}
              </span>
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  className="rounded-full font-semibold"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
