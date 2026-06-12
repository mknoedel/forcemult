import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const phases = [
  {
    dot: 'bg-coral',
    title: 'Red — write failing tests',
    blurb: 'Start with tests that define what success looks like.',
    lines: [
      ['c', '# create the test file first'],
      ['p', 'tests/unit/app/api/users/route.test.ts'],
      ['bad', 'npm test → ❌ FAIL (0 passing, 3 failing)'],
    ],
  },
  {
    dot: 'bg-teal',
    title: 'Green — make tests pass',
    blurb: 'Write the simplest code that turns the suite green.',
    lines: [
      ['c', '# now create the implementation'],
      ['p', 'app/api/users/route.ts'],
      ['ok', 'npm test → ✓ PASS (3 passing)'],
    ],
  },
  {
    dot: 'bg-primary',
    title: 'Refactor — optimize',
    blurb: 'Clean up while keeping the suite green.',
    lines: [
      ['c', '# refactor, re-run after each change'],
      ['ok', 'npm test → ✓ still passing'],
      ['p', 'npm run test:coverage → 85% ✓'],
    ],
  },
];

const lineColor: Record<string, string> = {
  c: 'text-muted-foreground',
  p: 'text-primary',
  ok: 'text-teal',
  bad: 'text-coral',
};

export function TddFrameworkCard() {
  return (
    <Card className="rounded-2xl border-2 border-foreground bg-card shadow-hard">
      <CardHeader>
        <CardTitle className="font-display">
          Test-Driven Development (TDD) Framework
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-muted-foreground">
          This template enforces TDD. Every feature starts with a test — the git
          hooks make sure of it.
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          {phases.map((phase) => (
            <div
              key={phase.title}
              className="rounded-xl border-2 border-foreground bg-background p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${phase.dot}`} />
                <h4 className="font-display text-sm font-bold">
                  {phase.title}
                </h4>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                {phase.blurb}
              </p>
              <div className="space-y-1 rounded-lg bg-foreground/5 p-3 font-mono text-xs">
                {phase.lines.map((line, i) => (
                  <div key={i} className={lineColor[line[0]]}>
                    {line[1]}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border-l-4 border-coral bg-coral/10 p-4">
          <p className="text-sm text-foreground">
            <strong>Important:</strong> the AI assistant refuses to write
            implementation code until tests exist first — so you always have a
            safety net and a clear spec.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button
            asChild
            className="rounded-full border-2 border-foreground font-bold shadow-hard-sm"
          >
            <Link href="/test-dashboard">Open Test Dashboard →</Link>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full font-mono"
          >
            npm test
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full font-mono"
          >
            npm run test:coverage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
