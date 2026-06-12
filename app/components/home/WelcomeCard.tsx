import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const quickStart = [
  <>Replace this page with your app&rsquo;s home in app/page.tsx.</>,
  <>
    Add components under{' '}
    <code className="rounded bg-muted px-1">app/components</code>.
  </>,
  <>
    Compose UI from <code className="rounded bg-muted px-1">components/ui</code>{' '}
    primitives.
  </>,
  <>
    Create API routes in <code className="rounded bg-muted px-1">app/api</code>.
  </>,
  <>
    Tune <code className="rounded bg-muted px-1">CLAUDE.md</code> to steer your
    AI assistant.
  </>,
];

export function WelcomeCard() {
  return (
    <Card className="rounded-2xl border-2 border-foreground bg-card shadow-hard">
      <CardContent className="pt-8">
        <span className="mb-4 inline-flex rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold-foreground">
          Quick start
        </span>
        <h2 className="font-display text-3xl font-extrabold tracking-tight">
          Northwestern MMM &amp; MPD2 Starter Template
        </h2>
        <p className="mb-6 mt-3 text-muted-foreground">
          Welcome to your Next.js starter project! This is a &ldquo;shell&rdquo;
          app that you&rsquo;ll replace with your own amazing idea.
        </p>

        <ol className="mb-8 space-y-px overflow-hidden rounded-xl border-2 border-foreground">
          {quickStart.map((step, i) => (
            <li key={i} className="flex gap-4 bg-background px-4 py-3 text-sm">
              <span className="font-display font-extrabold text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="rounded-xl border-2 border-foreground bg-teal/10 p-5">
          <p className="font-display font-bold text-foreground">
            Database integration example
          </p>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            This template includes a working{' '}
            <strong>Supabase database example</strong> showing full CRUD
            operations with row-level security.
          </p>
          <Button
            asChild
            className="rounded-full border-2 border-foreground bg-teal font-bold text-teal-foreground shadow-hard-sm hover:bg-teal/90"
          >
            <Link href="/tasks">View Tasks Example →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
