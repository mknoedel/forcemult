'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/types/supabase';

interface ChatSessionSidebarProps {
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatSessionSidebar({
  activeSessionId,
  onSelectSession,
  onNewChat,
}: ChatSessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from('n8n_chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
      setSessions(data ?? []);
    }

    void load();

    // Create + subscribe synchronously (no `await` first) so the cleanup below
    // always has a channel to tear down. Under React Strict Mode the effect
    // mounts, unmounts, then re-mounts; if channel creation sat behind an await,
    // cleanup would run before the channel existed, leaving it subscribed — and
    // the re-mount would reuse that same-topic channel and throw "cannot add
    // postgres_changes callbacks ... after subscribe()". RLS on n8n_chat_sessions
    // already scopes these events to the signed-in user, so no per-user filter is
    // needed here.
    const channel = supabase
      .channel('n8n_chat_sessions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'n8n_chat_sessions' },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <aside className="flex w-64 flex-col gap-2 border-r border-border p-3">
      <Button
        onClick={onNewChat}
        className="w-full justify-start"
        variant="outline"
      >
        <Plus />
        New chat
      </Button>
      <nav
        className="flex-1 space-y-1 overflow-y-auto"
        aria-label="Chat sessions"
      >
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No saved chats yet.
          </p>
        ) : (
          sessions.map((session) => {
            const isActive = session.session_id === activeSessionId;
            return (
              <button
                key={session.id}
                type="button"
                aria-current={isActive}
                onClick={() => onSelectSession(session.session_id)}
                className={cn(
                  'w-full truncate rounded-md px-3 py-2 text-left text-sm',
                  isActive
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60'
                )}
              >
                {session.name}
              </button>
            );
          })
        )}
      </nav>
    </aside>
  );
}
