'use client';

import { useState } from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { UserMemory } from '@/lib/zep/graph-search';

type Status = 'idle' | 'loading' | 'done' | 'error';

/**
 * Interactive: fetches the signed-in student's long-term memory (their Zep
 * user-node summary) from /api/memory/summary and shows it. Read-only and
 * scoped server-side to the caller, so there's nothing to configure here.
 */
export function UserSummaryCard() {
  const [status, setStatus] = useState<Status>('idle');
  const [memory, setMemory] = useState<UserMemory | null>(null);
  const [error, setError] = useState<string>('');

  const isLoading = status === 'loading';

  async function handleFetch() {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/memory/summary');
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Something went wrong.');
        setStatus('error');
        return;
      }
      setMemory(body.data as UserMemory);
      setStatus('done');
    } catch {
      setError('Could not reach the server. Are you online?');
      setStatus('error');
    }
  }

  return (
    <Card className="border-2 border-foreground rounded-2xl shadow-hard">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Brain className="h-5 w-5 text-primary" aria-hidden />
          Your long-term memory
        </CardTitle>
        <CardDescription>
          This is the rolling summary Zep keeps about you — built from your
          chats. Fetch it to see what the AI remembers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          onClick={handleFetch}
          disabled={isLoading}
          className="rounded-full font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Fetching…
            </>
          ) : (
            'Fetch my summary'
          )}
        </Button>

        {status === 'error' ? (
          <p className="rounded-lg border-2 border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {status === 'done' && memory ? (
          memory.hasSummary ? (
            <blockquote className="rounded-lg border-l-4 border-primary bg-muted/40 px-4 py-3 text-sm text-foreground">
              {memory.summary}
            </blockquote>
          ) : (
            <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              No long-term memory yet. Head to the{' '}
              <a className="underline" href="/chat">
                Chat
              </a>{' '}
              page and tell the assistant about yourself — Zep builds your
              summary from those conversations.
            </p>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
