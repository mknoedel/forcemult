'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';

interface ChatMessagesProps {
  messages: Array<{
    id: string;
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>;
  status: string;
  error: unknown;
}

export function ChatMessages({ messages, status, error }: ChatMessagesProps) {
  return (
    <>
      {messages.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          Ask anything to see a streamed response.
        </p>
      ) : (
        messages.map((message) => {
          const isUser = message.role === 'user';
          const text = message.parts
            .map((p) => (p.type === 'text' ? p.text : ''))
            .join('');
          // An agent may answer in several runs (e.g. an interim "let me
          // check our docs" reply, then the final answer). The route marks
          // run boundaries with N8N_RUN_SEPARATOR; show one bubble per run.
          const runs = text
            .split(N8N_RUN_SEPARATOR)
            .filter((run) => run.trim() !== '');
          const segments = runs.length > 0 ? runs : [''];
          return (
            <div key={message.id} className="space-y-2">
              {segments.map((segment, i) => (
                <div
                  key={`${message.id}-${i}`}
                  className={isUser ? 'text-right' : 'text-left'}
                >
                  <div
                    className={`inline-block rounded-lg px-4 py-2 max-w-[85%] text-left ${
                      isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    <div
                      className={`prose prose-sm max-w-none prose-p:my-1 prose-pre:my-2 prose-hr:my-3 prose-headings:mt-3 prose-headings:mb-2 ${
                        isUser ? 'prose-invert' : ''
                      }`}
                    >
                      <Markdown remarkPlugins={[remarkGfm]}>{segment}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}

      {status === 'submitted' && (
        <div
          role="status"
          aria-label="Thinking"
          className="flex items-center gap-1 px-1"
        >
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: '-0.3s' }}
          />
          <span
            className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
            style={{ animationDelay: '-0.15s' }}
          />
          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
          <span className="sr-only">Thinking…</span>
        </div>
      )}
      {error && (
        <p className="text-destructive text-sm">
          Something went wrong. Please try again.
        </p>
      )}
    </>
  );
}
