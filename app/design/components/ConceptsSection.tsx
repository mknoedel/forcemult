import { ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Plain-language explanation of what a design system is, what shadcn/ui is, and
 * how the pieces of this template's "design harness" fit together. Written for
 * first-time coders who have never seen these terms.
 */
export function ConceptsSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Start here: the big idea
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          You don&apos;t need to be a designer to build a good-looking app. This
          template comes with a <strong>design system</strong> — a small set of
          shared choices that keep every screen looking like one product. Here
          is what that means in plain language.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">
              What is a design system?
            </CardTitle>
            <CardDescription>
              The rulebook for how your app looks
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            It&apos;s one agreed set of colors, fonts, spacing, and ready-made
            building blocks (buttons, cards, inputs). Instead of inventing a new
            shade of purple on every page, you — and the AI — reuse the same
            named choices. The result looks intentional, not stitched together.
          </CardContent>
        </Card>

        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">What is shadcn/ui?</CardTitle>
            <CardDescription>Your ready-made building blocks</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <strong>shadcn/ui</strong> is a collection of polished, accessible
            React components — buttons, cards, inputs, and more — that live
            right inside your project so you own them. They&apos;re already
            wired to your colors, so they match your brand automatically.
          </CardContent>
        </Card>

        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">What is a token?</CardTitle>
            <CardDescription>A named design decision</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            A <strong>token</strong> is a name for a choice — for example,{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              primary
            </code>{' '}
            is your main brand color. You use the name (
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">
              bg-primary
            </code>
            ), never the raw color. Change the name&apos;s value once and the
            whole app updates.
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/40 border-2 border-foreground rounded-2xl shadow-hard">
        <CardHeader>
          <CardTitle className="font-display text-base">
            How it all fits together
          </CardTitle>
          <CardDescription>
            Each piece feeds the next — your colors flow from one source out to
            every screen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium">
            <FlowStep label="DESIGN.md" note="the documented system" />
            <FlowArrow />
            <FlowStep label="globals.css" note="the live color tokens" />
            <FlowArrow />
            <FlowStep
              label="Tailwind classes"
              note="bg-primary, text-foreground"
            />
            <FlowArrow />
            <FlowStep label="shadcn components" note="Button, Card, Input…" />
            <FlowArrow />
            <FlowStep label="your pages" note="what users see" />
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

function FlowStep({ label, note }: { label: string; note: string }) {
  return (
    <li className="rounded-md border bg-background px-3 py-2">
      <span className="block">{label}</span>
      <span className="block text-xs font-normal text-muted-foreground">
        {note}
      </span>
    </li>
  );
}

function FlowArrow() {
  return (
    <li aria-hidden className="text-muted-foreground">
      <ArrowRight className="h-4 w-4" />
    </li>
  );
}
