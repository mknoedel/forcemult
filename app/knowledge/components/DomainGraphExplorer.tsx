'use client';

import { useState } from 'react';
import { Loader2, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import type { DomainGraphSearchResult } from '@/lib/zep/domain-graph';
import { DOMAIN_SAMPLE_QUERIES } from './sample-queries';

type Status = 'idle' | 'loading' | 'done' | 'error';

/**
 * Read-only window into the SHARED domain graph (the agent's second brain).
 * Runs the same kind of search the agent's graph-query subagent performs, so
 * you can see exactly which facts ground its answers.
 */
export function DomainGraphExplorer() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<DomainGraphSearchResult | null>(null);
  const [error, setError] = useState('');

  const isLoading = status === 'loading';
  const isEmpty =
    result !== null &&
    result.facts.length === 0 &&
    result.entities.length === 0 &&
    result.episodes.length === 0;

  async function runSearch(q: string) {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/graph/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong.');
        setStatus('error');
        return;
      }
      setResult(body.data as DomainGraphSearchResult);
      setStatus('done');
    } catch {
      setError('Could not reach the server. Are you online?');
      setStatus('error');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    void runSearch(trimmed);
  }

  return (
    <Card className="border-2 border-foreground rounded-2xl shadow-hard">
      <CardHeader>
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold leading-none tracking-tight">
          <Network className="h-5 w-5 text-primary" aria-hidden />
          Explore the shared graph
        </h2>
        <CardDescription>
          This searches the <strong>same knowledge graph the agent uses</strong>{' '}
          to answer in chat and over email — facts (edges), entities (nodes),
          and source episodes. Ingest something above, then look it up here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {DOMAIN_SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              data-testid="domain-sample-query"
              onClick={() => setQuery(q)}
              className="rounded-full border-2 border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the second brain… e.g. who founded Jiobit?"
            maxLength={400}
            aria-label="Domain graph query"
          />
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-full font-semibold sm:w-32"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Searching…
              </>
            ) : (
              'Search'
            )}
          </Button>
        </form>

        {status === 'error' && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        {isEmpty && (
          <p className="text-sm text-muted-foreground">
            Nothing in the graph matches that yet — ingest a document above and
            try again.
          </p>
        )}

        {result && !isEmpty && (
          <div className="space-y-4" data-testid="graph-results">
            {result.facts.length > 0 && (
              <div>
                <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Facts (relationships)
                </h3>
                <ul className="space-y-2">
                  {result.facts.map((fact) => (
                    <li
                      key={fact.uuid}
                      className="rounded-xl border-2 border-border p-3 text-sm"
                    >
                      <span className="mr-2 font-mono text-xs font-semibold text-primary">
                        [{fact.name}]
                      </span>
                      {fact.fact}
                      {fact.validAt && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          since {String(fact.validAt).slice(0, 10)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.entities.length > 0 && (
              <div>
                <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Entities (nodes)
                </h3>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {result.entities.map((entity) => (
                    <li
                      key={entity.uuid}
                      className="rounded-xl border-2 border-border p-3"
                    >
                      <p className="font-semibold">{entity.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {entity.labels.filter((l) => l !== 'Entity').join(', ')}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {entity.summary}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.episodes.length > 0 && (
              <div>
                <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Source episodes
                </h3>
                <ul className="space-y-2">
                  {result.episodes.map((episode) => (
                    <li
                      key={episode.uuid}
                      className="rounded-xl border-2 border-border p-3 text-sm text-muted-foreground"
                    >
                      {episode.content.slice(0, 280)}
                      {episode.content.length > 280 ? '…' : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
