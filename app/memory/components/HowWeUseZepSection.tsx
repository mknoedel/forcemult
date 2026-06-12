import { ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Grounds the concepts in *this* app: how the chat page uses Zep to remember
 * the student across conversations — retrieve context before answering, then
 * record the new turn into the graph afterward.
 */
export function HowWeUseZepSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          How this app uses Zep
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          This template uses <strong>Zep</strong> — a knowledge-graph memory
          service — to give the{' '}
          <a className="underline" href="/chat">
            Chat
          </a>{' '}
          page a long-term memory. Every time you chat, two things happen around
          your message.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">
              1. Before the AI answers
            </CardTitle>
            <CardDescription>It looks you up</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The app asks Zep for your long-term context — your{' '}
            <strong>user summary</strong> plus the most relevant facts from your
            graph — and quietly adds it to the prompt. That&apos;s how the
            assistant already knows your project without you re-explaining it.
          </CardContent>
        </Card>

        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">
              2. After the AI answers
            </CardTitle>
            <CardDescription>It updates the graph</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your new message is sent back to Zep, which extracts fresh nodes and
            edges and folds them into your graph. (Only <em>your</em> words are
            ingested, not the AI&apos;s replies — so facts stay attributed to
            you.) Next time, step 1 is a little smarter.
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/40 border-2 border-foreground rounded-2xl shadow-hard">
        <CardHeader>
          <CardTitle className="font-display text-base">
            The memory loop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium">
            <FlowStep label="You send a message" note="on the Chat page" />
            <FlowArrow />
            <FlowStep
              label="Retrieve context"
              note="summary + facts from Zep"
            />
            <FlowArrow />
            <FlowStep label="AI answers" note="grounded in your memory" />
            <FlowArrow />
            <FlowStep
              label="Record the turn"
              note="graph learns more about you"
            />
          </ol>
        </CardContent>
      </Card>

      <p className="max-w-3xl text-sm text-muted-foreground">
        The two tools below talk to <strong>your own</strong> Zep graph. The
        first reads your user summary; the second searches your graph directly.
        Both only work once{' '}
        <code className="rounded bg-muted px-1 py-0.5 text-foreground">
          ZEP_API_KEY
        </code>{' '}
        is set and you&apos;ve chatted enough for Zep to learn something.
      </p>
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
