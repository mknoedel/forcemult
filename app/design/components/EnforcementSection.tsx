import { Check, X, FileText, ShieldCheck, ScanLine } from 'lucide-react';

/**
 * Explains, for non-technical students, why hard-coded styles create
 * "Frankenstein" UI and how this template automatically prevents it — guidance
 * the AI reads, an ESLint check that blocks bad colors, and a design checker on
 * push. The do/don't code samples are JSX text (not string literals) so this
 * page passes the very color rule it describes.
 */
export function EnforcementSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Guardrails that keep it consistent
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Knowing the rules isn&apos;t enough — the &ldquo;Frankenstein&rdquo;
          drift from the top of this page creeps back the moment someone (you or
          the AI) pastes a one-off color. So this template enforces the one rule
          that matters automatically: always use a <strong>token</strong>, never
          a raw value.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <X className="h-4 w-4" /> Don&apos;t — a raw color
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs text-foreground">
            <code>&lt;div className=&quot;bg-[#7C3AED]&quot;&gt;</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            A pasted color code. Change your brand later and this spot is left
            behind — the start of a patchwork.
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Check className="h-4 w-4" /> Do — a token
          </p>
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs text-foreground">
            <code>&lt;div className=&quot;bg-primary&quot;&gt;</code>
          </pre>
          <p className="text-sm text-muted-foreground">
            The named choice. Update the token once and every screen follows —
            the whole app stays in sync.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Three layers keep it consistent</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Layer
            icon={<FileText className="h-5 w-5 text-primary" />}
            title="1. Guidance"
            body="Rules in .claude/rules and DESIGN.md tell the AI to use tokens and reuse components before building new ones."
          />
          <Layer
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            title="2. Automatic check (ESLint)"
            body="A hard-coded color is a build error — ESLint blocks it before it can be committed, so mistakes can't sneak in."
          />
          <Layer
            icon={<ScanLine className="h-5 w-5 text-primary" />}
            title="3. Design checker"
            body="On every push, design:lint reviews DESIGN.md for drift and broken references (a warning, never a blocker)."
          />
        </div>
      </div>

      <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">
          You don&apos;t have to memorize this.
        </strong>{' '}
        If you use a token, it just works. If you (or the AI) paste a raw color,
        ESLint stops you and names the token to use instead.
      </p>
    </section>
  );
}

function Layer({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border-2 border-foreground bg-card p-4 shadow-hard">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-medium">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
