import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const claudeContains = [
  ['Project architecture', 'Tech stack, dependencies, and structure'],
  ['TDD requirements', 'Mandatory test-first development (80% coverage)'],
  ['Coding standards', 'TypeScript, React, and Next.js best practices'],
  ['Security rules', 'Input validation and authentication patterns'],
  ['API design', 'RESTful conventions and response formats'],
  ['Performance', 'Optimization strategies and budgets'],
];

export function AiInstructionsCard() {
  return (
    <Card className="rounded-2xl border-2 border-foreground bg-card shadow-hard">
      <CardHeader>
        <CardTitle className="font-display">
          AI Coding Assistant Instructions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-muted-foreground">
          The{' '}
          <code className="rounded bg-primary/10 px-2 py-1 font-mono text-primary">
            CLAUDE.md
          </code>{' '}
          file is your command center. It holds the rules any AI agent follows
          when helping you build.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {claudeContains.map(([title, desc]) => (
            <div
              key={title}
              className="rounded-xl border-2 border-border bg-background p-4 transition-colors hover:border-foreground"
            >
              <p className="font-display text-sm font-bold">{title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border-l-4 border-gold bg-gold/10 p-4">
          <p className="text-sm text-foreground">
            <strong>Pro tip:</strong> as you build, keep{' '}
            <code className="rounded bg-muted px-1">CLAUDE.md</code> current
            with your API endpoints, business logic, schema decisions, and UI
            conventions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
