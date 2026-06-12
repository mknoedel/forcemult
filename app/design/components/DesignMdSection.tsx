import { FileCode2, MessageSquareText, BookMarked, Quote } from 'lucide-react';

/**
 * Explains the open DESIGN.md format that this template's design system is
 * written in, and credits Google Labs (who created it for their Stitch tool and
 * open-sourced it). Teaches the "tokens + prose" idea: exact values plus the
 * reasoning behind them, so an AI agent builds on-brand instead of guessing.
 */
export function DesignMdSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Where this comes from: the DESIGN.md format
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          The{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">
            DESIGN.md
          </code>{' '}
          file at the root of this project isn&apos;t something we invented. It
          follows an open standard from <strong>Google Labs</strong>, originally
          built for their AI design tool <strong>Stitch</strong> and{' '}
          open-sourced so any coding agent — Claude, Cursor, Copilot — can read
          a project&apos;s brand the same way. It gives the AI a{' '}
          <em>persistent, structured understanding</em> of how your app should
          look.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          icon={<FileCode2 className="h-5 w-5 text-primary" />}
          title="Tokens — the what"
          body="Machine-readable values at the top of the file: this exact purple, this font, this corner radius. The AI gets precise numbers, never a guess."
        />
        <Card
          icon={<MessageSquareText className="h-5 w-5 text-primary" />}
          title="Prose — the why"
          body="Plain-English notes below explain why those values exist and when to use them. Intent travels with the values, so the AI applies them the way you meant."
        />
      </div>

      <figure className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-hard">
        <Quote className="h-6 w-6 text-primary" aria-hidden />
        <blockquote className="mt-3 max-w-3xl font-display text-lg italic leading-snug">
          &ldquo;Tokens give agents exact values. Prose tells them why those
          values exist and how to apply them… The quality of a generated design
          is determined less by the precision of its values than by how clearly
          the intent is described.&rdquo;
        </blockquote>
        <figcaption className="mt-3 text-sm text-muted-foreground">
          — Google Labs, the DESIGN.md specification &amp; philosophy
        </figcaption>
      </figure>

      <p className="max-w-3xl text-muted-foreground">
        That&apos;s the whole reason this template ships a DESIGN.md: instead of
        guessing intent, the AI building your app knows exactly what each color
        is for and can even check its choices against accessibility (WCAG
        contrast) rules. It stays on-brand by default — which is what keeps the
        Frankenstein problem from creeping back in.
      </p>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
        <BookMarked className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        <span>
          DESIGN.md is an open, Apache-2.0 format. Read the spec, see more
          examples, or contribute:
        </span>
        <a
          href="https://github.com/google-labs-code/design.md"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
        >
          DESIGN.md on GitHub
        </a>
      </div>
    </section>
  );
}

function Card({
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
