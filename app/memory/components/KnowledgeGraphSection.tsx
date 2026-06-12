import { ArrowRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Explains a knowledge graph in plain language: instead of storing chat logs as
 * a wall of text, Zep pulls out the *who/what* (nodes), the *facts that connect
 * them* (edges), and keeps the *original messages* (episodes) as receipts.
 */
export function KnowledgeGraphSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold">
          What is a knowledge graph?
        </h2>
        <p className="max-w-3xl text-muted-foreground">
          Storing memory as a giant pile of old messages is hard to search and
          easy to get wrong. A <strong>knowledge graph</strong> stores memory as
          connected facts instead — like a mind map the AI builds about you. It
          has three simple building blocks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">Nodes</CardTitle>
            <CardDescription>The people, places &amp; things</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <strong>Nodes</strong> are the entities the AI notices — you, your
            startup, a class, a city. Each node collects a short summary of
            everything known about it. Think of them as the nouns.
          </CardContent>
        </Card>

        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">Edges</CardTitle>
            <CardDescription>The facts that connect them</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <strong>Edges</strong> are the relationships and facts between nodes
            — &ldquo;Dana <em>is building</em> a fintech app&rdquo;, &ldquo;Dana{' '}
            <em>studies at</em> Northwestern&rdquo;. They&apos;re the verbs, and
            each one is time-stamped so it can change later.
          </CardContent>
        </Card>

        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <CardTitle className="font-display">Episodes</CardTitle>
            <CardDescription>The original receipts</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <strong>Episodes</strong> are the raw source messages a fact came
            from. They let the AI (and you) trace any fact back to exactly what
            was said, so memory stays grounded instead of made up.
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/40 border-2 border-foreground rounded-2xl shadow-hard">
        <CardHeader>
          <CardTitle className="font-display text-base">
            From a sentence to a graph
          </CardTitle>
          <CardDescription>
            One message becomes nodes connected by an edge — and the message is
            kept as the episode behind it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-3 text-sm font-medium">
            <GraphPiece label="Dana" note="node (a person)" />
            <li aria-hidden className="text-muted-foreground">
              <span className="rounded-full border-2 border-foreground px-2 py-1 text-xs">
                is building
              </span>
            </li>
            <GraphPiece label="Fintech App" note="node (a project)" />
            <li aria-hidden className="text-muted-foreground">
              <ArrowRight className="h-4 w-4" />
            </li>
            <GraphPiece
              label="that edge = a fact"
              note="time-stamped &amp; updatable"
            />
          </ol>
        </CardContent>
      </Card>
    </section>
  );
}

function GraphPiece({ label, note }: { label: string; note: string }) {
  return (
    <li className="rounded-md border bg-background px-3 py-2">
      <span className="block">{label}</span>
      <span className="block text-xs font-normal text-muted-foreground">
        {note}
      </span>
    </li>
  );
}
