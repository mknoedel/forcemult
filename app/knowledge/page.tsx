import type { Metadata } from 'next';
import { PageShell } from '../components/PageShell';
import { PageHero } from '../components/PageHero';
import { IngestPanel } from './components/IngestPanel';
import { DomainGraphExplorer } from './components/DomainGraphExplorer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Workflow } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Knowledge Ingestion',
  description:
    'Feed documents into the agent’s second brain: an n8n pipeline extracts entities and relationships into a shared Zep knowledge graph, transparently.',
};

const PIPELINE_STEPS: { step: string; detail: string }[] = [
  {
    step: '1 · Submit',
    detail:
      'You paste text (or upload a .txt/.md file) here. The app forwards it server-side to the n8n ingestion webhook with a shared secret.',
  },
  {
    step: '2 · Guardrails',
    detail:
      'The pipeline rejects documents containing secret keys or credentials before any model sees them.',
  },
  {
    step: '3 · Extraction subagent',
    detail:
      'An LLM subagent pulls out entities (people, orgs, products, concepts…) and typed relationships (FOUNDED, ACQUIRED, TEACHES…) as structured JSON.',
  },
  {
    step: '4 · Dedupe / upsert',
    detail:
      'Each entity is searched against the existing graph; name matches reuse the existing node UUID (merged), new ones are created — the same upsert problem as a task list, applied to graph nodes.',
  },
  {
    step: '5 · Write to Zep',
    detail:
      'Relationships land as fact triples; the raw text is stored as episodes, where Zep keeps extracting asynchronously.',
  },
  {
    step: '6 · Transparent report',
    detail:
      'The pipeline answers with exactly what it extracted and wrote — entities, relationships, merge decisions — rendered below. No black box.',
  },
];

export default function KnowledgePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Second Brain"
        title={
          <>
            Teach the agent{' '}
            <span className="font-serif font-normal italic text-primary">
              new knowledge.
            </span>
          </>
        }
        subtitle="This is the ingestion side of the capstone: documents go in, a multi-step n8n pipeline extracts entities and relationships, and they land in a shared Zep knowledge graph — the same graph the agent queries when it answers in chat or over email."
      />

      <section className="space-y-6">
        <Card className="border-2 border-foreground rounded-2xl shadow-hard">
          <CardHeader>
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold leading-none tracking-tight">
              <Workflow className="h-5 w-5 text-primary" aria-hidden />
              How the pipeline works
            </h2>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PIPELINE_STEPS.map(({ step, detail }) => (
                <li
                  key={step}
                  className="rounded-xl border-2 border-border p-3"
                >
                  <p className="text-sm font-semibold">{step}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <IngestPanel />
        <DomainGraphExplorer />
      </section>
    </PageShell>
  );
}
