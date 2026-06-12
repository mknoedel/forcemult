import React from 'react';
import Link from 'next/link';
import ExampleComponent from './components/ExampleComponent';
import Navigation from './components/Navigation';
import { WelcomeCard } from './components/home/WelcomeCard';
import { AiInstructionsCard } from './components/home/AiInstructionsCard';
import { TddFrameworkCard } from './components/home/TddFrameworkCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { studioCardHover } from '@/lib/utils';

const features = [
  {
    href: '/tasks',
    badge: '▦',
    accent: 'bg-primary text-primary-foreground',
    title: 'Tasks & CRUD',
    description:
      'A Supabase example with per-user row-level security, scoped automatically.',
  },
  {
    href: '/charts',
    badge: '◔',
    accent: 'bg-gold text-gold-foreground',
    title: 'Charts',
    description:
      'Recharts through the shadcn wrapper — typed, themeable, responsive.',
  },
  {
    href: '/chat',
    badge: '✦',
    accent: 'bg-coral text-coral-foreground',
    title: 'Streaming chat',
    description: 'An n8n LLM agent streamed token-by-token via a server proxy.',
  },
  {
    href: '/test-dashboard',
    badge: '✓',
    accent: 'bg-teal text-teal-foreground',
    title: 'Test dashboard',
    description: 'Live Jest results and coverage rendered right in the app.',
  },
  {
    href: '/design',
    badge: '◈',
    accent: 'bg-primary text-primary-foreground',
    title: 'Design system',
    description:
      'Tokens, a type scale, and a live component gallery to extend.',
  },
];

const stats = [
  { k: '16', l: 'Next.js' },
  { k: '80%', l: 'Coverage gate' },
  { k: 'RLS', l: 'Secure by default' },
  { k: 'TDD', l: 'Tests first' },
];

const resources = [
  {
    href: 'https://nextjs.org/docs',
    title: 'Next.js',
    description: 'The React framework for the web',
  },
  {
    href: 'https://ui.shadcn.com/docs',
    title: 'shadcn/ui',
    description: 'Accessible component building blocks',
  },
  {
    href: 'https://tailwindcss.com/docs',
    title: 'Tailwind CSS',
    description: 'Utility-first CSS framework',
  },
  {
    href: 'https://supabase.com/docs',
    title: 'Supabase',
    description: 'Auth, database, and storage',
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navigation />

      <main className="mx-auto w-full max-w-content flex-1 px-6 md:px-9">
        {/* Hero */}
        <section className="relative overflow-hidden py-20">
          <span className="pointer-events-none absolute right-6 top-10 -z-0 hidden h-44 w-44 rounded-full bg-gold md:block" />
          <span className="pointer-events-none absolute right-44 top-28 -z-0 hidden h-28 w-28 rounded-[60px_60px_60px_0] bg-coral md:block" />
          <span className="pointer-events-none absolute right-28 top-6 -z-0 hidden h-24 w-24 rounded-full border-[14px] border-primary md:block" />

          <div className="relative z-10 max-w-3xl">
            <span className="mb-7 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-background">
              ● Next.js 16 Starter
            </span>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Build something{' '}
              <span className="font-serif font-normal italic text-primary">
                worth
              </span>{' '}
              shipping.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              A design-forward Next.js foundation for MMM &amp; MPD² students —
              Supabase, a test-first framework, and an AI assistant that already
              knows the house rules. Make it yours.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="rounded-full border-2 border-foreground text-base font-bold shadow-hard transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg"
              >
                <a href="#whats-in-the-box">Start building →</a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full border-2 border-foreground text-base font-bold hover:bg-gold hover:text-gold-foreground"
              >
                <Link href="/tasks">See an example</Link>
              </Button>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.l}
                  className="rounded-2xl border-2 border-foreground bg-card p-5"
                >
                  <div className="font-display text-3xl font-extrabold leading-none text-primary">
                    {s.k}
                  </div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section id="whats-in-the-box" className="scroll-mt-20 py-12">
          <h2 className="font-display text-4xl font-extrabold tracking-tight">
            What&rsquo;s in the box
          </h2>
          <p className="mb-10 mt-2 text-lg text-muted-foreground">
            Working examples — delete what you don&rsquo;t need, learn from the
            rest.
          </p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Link key={f.href} href={f.href} className="group block">
                <div className={`h-full bg-card p-7 ${studioCardHover}`}>
                  <span
                    className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-foreground text-xl ${f.accent}`}
                  >
                    {f.badge}
                  </span>
                  <h3 className="font-display text-xl font-bold tracking-tight">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {f.description}
                  </p>
                  <span className="mt-5 inline-block text-sm font-bold text-primary">
                    Open example →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Getting started + AI / TDD depth */}
        <section className="space-y-8 py-12">
          <WelcomeCard />
          <AiInstructionsCard />
          <TddFrameworkCard />

          <Card className={`bg-card ${studioCardHover}`}>
            <CardHeader>
              <CardTitle className="font-display">Example component</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                A small interactive component to show the structure. Modify or
                delete it.
              </p>
              <ExampleComponent />
            </CardContent>
          </Card>

          <Card className={`bg-card ${studioCardHover}`}>
            <CardHeader>
              <CardTitle className="font-display">Helpful resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {resources.map((resource) => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border-2 border-border p-4 transition-colors hover:border-foreground hover:shadow-hard-sm"
                  >
                    <h4 className="font-display font-bold">{resource.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {resource.description}
                    </p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t-2 border-foreground bg-card">
        <div className="mx-auto flex w-full max-w-content flex-col gap-2 px-6 py-8 sm:flex-row sm:items-center sm:justify-between md:px-9">
          <p className="text-sm font-semibold text-muted-foreground">
            Northwestern MMM &amp; MPD² Starter
          </p>
          <p className="text-sm text-muted-foreground">
            Next.js 16 · TypeScript · Tailwind · shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
