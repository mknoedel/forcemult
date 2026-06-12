'use client';

import { useState } from 'react';
import { FileUp, Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';

type Status = 'idle' | 'loading' | 'done' | 'error';

interface IngestEntity {
  name: string;
  type: string;
  summary: string;
  status: 'new' | 'merged';
  uuid: string | null;
}

interface IngestRelationship {
  relation: string;
  fact: string;
  source: string | null;
  target: string | null;
  uuid: string;
}

interface IngestReport {
  ok: boolean;
  graphId: string;
  title: string;
  entities: IngestEntity[];
  relationships: IngestRelationship[];
  episodes: string[];
  stats: {
    entities: number;
    created: number;
    merged: number;
    relationships: number;
    episodes: number;
    failedWrites: number;
  };
  message: string;
}

const MAX_CHARS = 60_000;

/**
 * The ingestion front-end: submit a document (paste or .txt/.md upload), send
 * it through the n8n pipeline via /api/ingest, and render the pipeline's
 * transparent report — which entities and relationships were extracted, and
 * which were merged with existing graph nodes vs created fresh.
 */
export function IngestPanel() {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [report, setReport] = useState<IngestReport | null>(null);

  const isLoading = status === 'loading';

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setText(String(reader.result ?? '').slice(0, MAX_CHARS));
      if (!title) setTitle(file.name.replace(/\.(txt|md|markdown)$/i, ''));
    };
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (text.trim().length < 20) {
      setError('Add at least 20 characters of text first.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setError('');
    setReport(null);
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || undefined, text }),
      });
      const body = await res.json();
      if (!res.ok || body.ok === false) {
        setError(body.message ?? body.error ?? 'Ingestion failed.');
        setStatus('error');
        return;
      }
      setReport(body as IngestReport);
      setStatus('done');
    } catch {
      setError('Could not reach the server. Are you online?');
      setStatus('error');
    }
  }

  return (
    <Card className="border-2 border-foreground rounded-2xl shadow-hard">
      <CardHeader>
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold leading-none tracking-tight">
          <UploadCloud className="h-5 w-5 text-primary" aria-hidden />
          Ingest a document
        </h2>
        <CardDescription>
          Paste text or upload a <code>.txt</code>/<code>.md</code> file. It
          flows through the n8n pipeline — guardrails, extraction subagent,
          dedupe — and lands in the shared Zep graph. The full extraction
          report appears below.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title (e.g. Instructor Bio)"
              maxLength={120}
              aria-label="Document title"
            />
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border-2 border-border px-4 py-2 text-sm font-medium transition-colors hover:border-foreground">
              <FileUp className="h-4 w-4" aria-hidden />
              Upload file
              <input
                type="file"
                accept=".txt,.md,.markdown,text/plain,text/markdown"
                onChange={handleFile}
                className="hidden"
                aria-label="Upload a text or markdown file"
              />
            </label>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Paste the document text here…"
            rows={8}
            aria-label="Document text"
            className="w-full rounded-xl border-2 border-border bg-background p-3 text-sm focus:border-foreground focus:outline-none"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}{' '}
              characters
            </p>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-full font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Running pipeline…
                </>
              ) : (
                'Ingest into graph'
              )}
            </Button>
          </div>
        </form>

        {status === 'error' && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {report && (
          <div className="space-y-4" data-testid="ingest-report">
            <p className="text-sm font-medium">{report.message}</p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {report.stats.entities} entities
              </Badge>
              <Badge variant="secondary">{report.stats.created} new</Badge>
              <Badge variant="secondary">{report.stats.merged} merged</Badge>
              <Badge variant="secondary">
                {report.stats.relationships} relationships
              </Badge>
              <Badge variant="secondary">
                {report.stats.episodes} episode(s)
              </Badge>
            </div>

            <div>
              <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Entities extracted
              </h3>
              <ul className="grid gap-2 sm:grid-cols-2">
                {report.entities.map((entity) => (
                  <li
                    key={`${entity.name}-${entity.uuid ?? 'new'}`}
                    className="rounded-xl border-2 border-border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{entity.name}</p>
                      <Badge
                        variant={
                          entity.status === 'merged' ? 'default' : 'outline'
                        }
                      >
                        {entity.status === 'merged'
                          ? 'merged with existing'
                          : 'new node'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entity.type}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {entity.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Relationships written
              </h3>
              <ul className="space-y-2">
                {report.relationships.map((rel) => (
                  <li
                    key={rel.uuid}
                    className="rounded-xl border-2 border-border p-3 text-sm"
                  >
                    <p className="font-mono text-xs">
                      {rel.source}{' '}
                      <span className="font-semibold text-primary">
                        —{rel.relation}→
                      </span>{' '}
                      {rel.target}
                    </p>
                    <p className="mt-1 text-muted-foreground">{rel.fact}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
