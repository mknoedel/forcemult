import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Frames the problem first: a plain chatbot forgets everything the moment a
 * conversation ends. Long-term memory is what lets an AI remember you across
 * sessions. Written for students who aren't engineers.
 */
export function WhatIsMemorySection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          Why AI needs long-term memory
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          A normal chatbot has <strong>short-term memory only</strong>. It can
          see the current conversation, but the moment you close the tab it
          forgets you completely — your name, your project, what you decided
          last week. Every chat starts from zero.{' '}
          <strong>Long-term memory</strong> fixes that: the assistant remembers
          who you are and what matters to you, across every conversation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">
              Without long-term memory
            </CardTitle>
            <CardDescription>The goldfish problem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              &ldquo;Hi, I&apos;m building a fintech app for students.&rdquo;
            </p>
            <p className="text-foreground">→ Great, tell me more!</p>
            <p className="pt-2 italic">…the next day…</p>
            <p>&ldquo;Any ideas for my app?&rdquo;</p>
            <p className="text-foreground">→ Sure! What kind of app is it?</p>
          </CardContent>
        </Card>

        <Card className="bg-muted/40 border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">
              With long-term memory
            </CardTitle>
            <CardDescription>It remembers you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              &ldquo;Hi, I&apos;m building a fintech app for students.&rdquo;
            </p>
            <p className="text-foreground">→ Great, tell me more!</p>
            <p className="pt-2 italic">…the next day…</p>
            <p>&ldquo;Any ideas for my app?&rdquo;</p>
            <p className="text-foreground">
              → For your student fintech app, you could…
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
