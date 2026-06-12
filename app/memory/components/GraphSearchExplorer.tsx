'use client';

import { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import type { GraphSearchResult } from '@/lib/zep/graph-search';
import { SAMPLE_QUERIES } from './sample-queries';

type Status = 'idle' | 'loading' | 'done' | 'error';

/**
 * Interactive: runs an auto graph search over the student's own Zep graph via
 * /api/memory/search and renders what comes back — the composed context block
 * Zep would hand an LLM, plus the raw facts, entities, and episodes behind it.
 * Sample queries give students a starting point.
 */
export function GraphSearchExplorer() {
  const [query, setQuery] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<GraphSearchResult | null>(null);
  const [error, setError] = useState<string>('');

  const isLoading = status === 'loading';
  const isEmpty =
    result !== null &&
    !result.context &&
    result.facts.length === 0 &&
    result.entities.length === 0 &&
    result.episodes.length === 0;

  async function runSearch(q: string) {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/memory/search', {
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
      setResult(body.data as GraphSearchResult);
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
          <Search className="h-5 w-5 text-primary" aria-hidden />
          Search the knowledge graph
        </h2>
        <CardDescription>
          Ask a question and Zep&apos;s <strong>auto search</strong> composes
          the most relevant memory across facts, entities, and episodes into one
          context block — the same block it would feed an AI. Try a sample:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              data-testid="sample-query"
              onClick={() => setQuery(q)}
              className="rounded-full border-2 border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about yourself… e.g. what are my goals?"
            maxLength={400}
            aria-label="Knowledge graph query"
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

        {status === 'error' ? (
          <p className="rounded-lg border-2 border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {status === 'done' && isEmpty ? (
          <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Nothing came back for that. Your graph may be empty — chat a bit
            first — or try a broader question.
          </p>
        ) : null}

        {status === 'done' && result && !isEmpty ? (
          <SearchResults result={result} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function SearchResults({ result }: { result: GraphSearchResult }) {
  return (
    <div className="space-y-5">
      {result.context ? (
        <div className="space-y-1">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Context block (what the AI would see)
          </h3>
          <pre className="whitespace-pre-wrap rounded-lg border-2 border-foreground bg-muted/40 p-4 text-sm text-foreground">
            {result.context}
          </pre>
        </div>
      ) : null}

      {result.facts.length > 0 ? (
        <ResultGroup title="Facts (edges)">
          <ul className="space-y-1">
            {result.facts.map((f) => (
              <li
                key={f.uuid}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {f.fact}
                {f.validAt ? (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({f.validAt.slice(0, 10)})
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </ResultGroup>
      ) : null}

      {result.entities.length > 0 ? (
        <ResultGroup title="Entities (nodes)">
          <ul className="grid gap-2 sm:grid-cols-2">
            {result.entities.map((n) => (
              <li
                key={n.uuid}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <span className="font-semibold">{n.name}</span>
                {n.summary ? (
                  <span className="block text-xs text-muted-foreground">
                    {n.summary}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </ResultGroup>
      ) : null}

      {result.episodes.length > 0 ? (
        <ResultGroup title="Episodes (source messages)">
          <ul className="space-y-1">
            {result.episodes.map((ep) => (
              <li
                key={ep.uuid}
                className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground"
              >
                {ep.content}
              </li>
            ))}
          </ul>
        </ResultGroup>
      ) : null}
    </div>
  );
}

function ResultGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}
