'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { historyToUiMessages } from '@/lib/chat-history';
import { generateId } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { PageHero } from '../components/PageHero';
import { PageShell } from '../components/PageShell';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatSessionSidebar } from '../components/chat/ChatSessionSidebar';
import { ChatContextPanel } from '../components/chat/ChatContextPanel';

export default function ChatPage() {
  // Stable id for the active chat session so the n8n agent can keep memory
  // across turns. Switching sessions (or starting a new chat) swaps this id.
  const [sessionId, setSessionId] = useState(() => generateId());
  const [input, setInput] = useState('');
  // Bumped after each completed turn so the memory panel refetches — Zep updates
  // the user's long-term summary once recordChatTurn writes the turn.
  const [contextRefresh, setContextRefresh] = useState(0);
  // Re-create the transport whenever the session changes so /api/chat receives
  // the current sessionId in its body.
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({ api: '/api/chat', body: { sessionId } }),
    [sessionId]
  );
  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });

  const isBusy = status === 'submitted' || status === 'streaming';
  // The most recent user message drives the panel's query-relevant graph search.
  const latestQuestion = useMemo(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return '';
    return lastUser.parts
      .map((p) => (p.type === 'text' ? p.text : ''))
      .join(' ')
      .trim();
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text });
    setInput('');
  }

  async function handleSelectSession(id: string) {
    setSessionId(id);
    const supabase = createClient();
    // No `.order()` here — historyToUiMessages sorts rows by their serial id.
    const { data, error } = await supabase
      .from('n8n_chat_histories')
      .select('*')
      .eq('session_id', id);
    if (error) {
      logger.warn('Failed to load chat history', {
        sessionId: id,
        error: error.message,
      });
    }
    setMessages(historyToUiMessages(data ?? []));
  }

  function handleNewChat() {
    setSessionId(generateId());
    setMessages([]);
  }

  // Refresh the memory panel on the falling edge of `isBusy` (a turn just
  // finished streaming), since that is when the user's Zep memory may change.
  const wasBusyRef = useRef(false);
  useEffect(() => {
    if (wasBusyRef.current && !isBusy) {
      setContextRefresh((n) => n + 1);
    }
    wasBusyRef.current = isBusy;
  }, [isBusy]);

  return (
    <PageShell>
      <PageHero
        eyebrow="AI Chat"
        title={
          <>
            LLM Agent{' '}
            <span className="font-serif font-normal italic text-primary">
              Chat
            </span>
          </>
        }
        subtitle={
          <>
            Streams a response from{' '}
            <code className="rounded bg-muted px-1">/api/chat</code>. Connect
            your n8n agent via{' '}
            <code className="rounded bg-muted px-1">N8N_WEBHOOK_URL</code> —
            until then a placeholder reply streams back.
          </>
        }
      />
      <div className="flex gap-4">
        <ChatSessionSidebar
          activeSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
        />
        <Card className="flex h-[70vh] flex-1 flex-col border-2 border-foreground rounded-2xl shadow-hard">
          <CardContent className="flex-1 overflow-y-auto space-y-4 pt-6">
            <ChatMessages messages={messages} status={status} error={error} />
          </CardContent>

          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={isBusy}
                aria-label="Message"
              />
              <Button type="submit" disabled={isBusy || !input.trim()}>
                <Send />
                Send
              </Button>
            </form>
          </div>
        </Card>
        <ChatContextPanel
          refreshSignal={contextRefresh}
          question={latestQuestion}
        />
      </div>
    </PageShell>
  );
}
