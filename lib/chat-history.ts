import type { N8nChatHistory, N8nStoredMessage } from '@/types/supabase';

/**
 * Map stored n8n LangChain history rows into the UI message shape used by the
 * chat pane. `n8n_chat_histories.message` is a LangChain BaseMessage
 * (`{ type: 'human' | 'ai' | 'system' | 'tool', content: string }`). We render
 * only the conversational turns: `human` → user bubble, `ai` → assistant bubble.
 * Rows are ordered by their serial `id` (chronological).
 *
 * A tool-using agent also persists its scratchpad — `tool` result messages and
 * intermediate `ai` messages that *invoke* a tool (a non-empty `tool_calls`
 * array). Those are internal steps, not user-facing replies, so we drop them and
 * keep only the final `ai` answer (which has no tool_calls). Malformed and
 * blank/whitespace-only rows are skipped too, so a bad record can't break the
 * transcript or render an empty bubble.
 */

export interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
}

const ROLE_BY_TYPE: Record<string, UiMessage['role']> = {
  human: 'user',
  ai: 'assistant',
};

/**
 * Strip the memory augmentation n8n persists on a human turn. When Zep context
 * is injected, the stored `human` message is the augmented prompt: a
 * `<USER_SUMMARY>…</USER_SUMMARY>` context block plus the real question wrapped
 * in `<user_prompt>…</user_prompt>`. Show only the question — prefer the
 * unwrapped `<user_prompt>` content, otherwise drop any `<USER_SUMMARY>` block.
 */
function cleanStoredUserContent(content: string): string {
  const wrapped = content.match(/<user_prompt>([\s\S]*?)<\/user_prompt>/i);
  if (wrapped) return wrapped[1].trim();
  return content.replace(/<USER_SUMMARY>[\s\S]*?<\/USER_SUMMARY>/gi, '').trim();
}

export function historyToUiMessages(rows: N8nChatHistory[]): UiMessage[] {
  return [...rows]
    .sort((a, b) => a.id - b.id)
    .map(toUiMessage)
    .filter((m): m is UiMessage => m !== null);
}

function toUiMessage(row: N8nChatHistory): UiMessage | null {
  const message = row.message;
  if (!message || typeof message !== 'object' || Array.isArray(message)) {
    return null;
  }
  const { type, content, tool_calls } = message as Partial<N8nStoredMessage> & {
    tool_calls?: unknown;
  };
  if (typeof type !== 'string' || typeof content !== 'string') return null;
  const role = ROLE_BY_TYPE[type];
  if (!role) return null;
  // Intermediate agent step: an `ai` message invoking a tool is scratchpad, not a
  // reply. The final answer is a later `ai` message with an empty tool_calls.
  if (type === 'ai' && Array.isArray(tool_calls) && tool_calls.length > 0) {
    return null;
  }
  // Human turns may carry injected Zep context; show only the real prompt.
  const text = role === 'user' ? cleanStoredUserContent(content) : content;
  if (text.trim() === '') return null;
  return {
    id: `history-${row.id}`,
    role,
    parts: [{ type: 'text', text }],
  };
}
