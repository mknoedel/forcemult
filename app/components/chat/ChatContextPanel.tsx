'use client';

import { useCallback, useEffect, useState } from 'react';
import { Brain, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserMemory, GraphSearchResult } from '@/lib/zep/graph-search';

type LoadStatus = 'idle' | 'loading' | 'done' | 'error';

interface ChatContextPanelProps {
  // Bump to refetch the summary — the chat page increments this after each turn.
  refreshSignal?: number;
  // The latest user message; drives the query-relevant graph search.
  question?: string;
}

/**
 * Right-hand panel with two views of the user's Zep memory:
 *  - "Who you are": the stable user-node summary (/api/memory/summary) — the same
 *    <USER_SUMMARY> the agent receives. Refreshes after each turn.
 *  - "Relevant to your question": a graph search (/api/memory/search) keyed to the
 *    latest message, so it changes with what's being asked. Both are read-only and
 *    scoped server-side to the signed-in user.
 */
export function ChatContextPanel({
  refreshSignal = 0,
  question = '',
}: ChatContextPanelProps) {
  const [summaryStatus, setSummaryStatus] = useState<LoadStatus>('loading');
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [summaryError, setSummaryError] = useState('');
  const [searchStatus, setSearchStatus] = useState<LoadStatus>('idle');
  const [result, setResult] = useState<GraphSearchResult | null>(null);
  const [searchError, setSearchError] = useState('');

  const trimmedQuestion = question.trim();
  const isBusy = summaryStatus === 'loading' || searchStatus === 'loading';

  const loadSummary = useCallback(async () => {
    setSummaryStatus('loading');
    setSummaryError('');
    try {
      const res = await fetch('/api/memory/summary');
      const body = await res.json();
      if (!res.ok) {
        setSummaryError(body.error ?? 'Something went wrong.');
        setSummaryStatus('error');
        return;
      }
      setMemory(body.data as UserMemory);
      setSummaryStatus('done');
    } catch {
      setSummaryError('Could not reach the server. Are you online?');
      setSummaryStatus('error');
    }
  }, []);

  const runSearch = useCallback(async (q: string) => {
    setSearchStatus('loading');
    setSearchError('');
    try {
      const res = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      const body = await res.json();
      if (!res.ok) {
        setSearchError(body.error ?? 'Something went wrong.');
        setSearchStatus('error');
        return;
      }
      setResult(body.data as GraphSearchResult);
      setSearchStatus('done');
    } catch {
      setSearchError('Could not reach the server.');
      setSearchStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary, refreshSignal]);

  useEffect(() => {
    if (trimmedQuestion) void runSearch(trimmedQuestion);
  }, [runSearch, trimmedQuestion]);

  function handleRefresh() {
    void loadSummary();
    if (trimmedQuestion) void runSearch(trimmedQuestion);
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 rounded-2xl border-2 border-foreground p-4 shadow-hard lg:flex">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
          <Brain className="h-4 w-4 text-primary" aria-hidden />
          Memory context
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isBusy}
          aria-label="Refresh memory context"
        >
          <RefreshCw
            className={isBusy ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
            aria-hidden
          />
        </Button>
      </div>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Who you are
        </h3>
        <SummaryBody
          status={summaryStatus}
          memory={memory}
          error={summaryError}
        />
      </section>

      <section className="space-y-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          Relevant to your question
        </h3>
        <RelevantBody
          status={searchStatus}
          result={result}
          error={searchError}
          hasQuestion={Boolean(trimmedQuestion)}
        />
      </section>
    </aside>
  );
}

function Spinner({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      {label}
    </p>
  );
}

function ErrorNote({ error }: { error: string }) {
  return (
    <p className="rounded-lg border-2 border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {error}
    </p>
  );
}

function SummaryBody({
  status,
  memory,
  error,
}: {
  status: LoadStatus;
  memory: UserMemory | null;
  error: string;
}) {
  if (status === 'loading') return <Spinner label="Loading…" />;
  if (status === 'error') return <ErrorNote error={error} />;
  if (status === 'done' && memory) {
    return memory.hasSummary ? (
      <blockquote className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border-l-4 border-primary bg-muted/40 px-3 py-2 text-sm text-foreground">
        {memory.summary}
      </blockquote>
    ) : (
      <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        No long-term memory yet. Tell the assistant about yourself — Zep builds
        this summary from your conversations.
      </p>
    );
  }
  return null;
}

function RelevantBody({
  status,
  result,
  error,
  hasQuestion,
}: {
  status: LoadStatus;
  result: GraphSearchResult | null;
  error: string;
  hasQuestion: boolean;
}) {
  if (!hasQuestion) {
    return (
      <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        Ask a question to see what Zep retrieves as relevant from your memory.
      </p>
    );
  }
  if (status === 'loading') return <Spinner label="Searching your memory…" />;
  if (status === 'error') return <ErrorNote error={error} />;
  if (status === 'done' && result) {
    return result.context.trim() ? (
      <blockquote className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg border-l-4 border-primary bg-muted/40 px-3 py-2 text-sm text-foreground">
        {result.context}
      </blockquote>
    ) : (
      <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        No relevant memory for this question yet.
      </p>
    );
  }
  return null;
}
