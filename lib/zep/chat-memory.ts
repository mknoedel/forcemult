import type { ZepClient, Zep } from '@getzep/zep-cloud';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { toZepUser, displayName } from '@/lib/zep/identity';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';

const DEFAULT_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Zep request timed out')),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// Best-effort: fetch the thread's long-term context block. Returns '' on any
// failure or timeout so the chat proceeds without context.
async function getThreadContext(
  client: ZepClient,
  threadId: string,
  timeoutMs: number
): Promise<string> {
  try {
    const result = await withTimeout(
      client.thread.getUserContext(threadId),
      timeoutMs
    );
    return result?.context ?? '';
  } catch (error) {
    logger.warn(
      'Zep getUserContext failed; proceeding without thread context',
      {
        error: String(error),
      }
    );
    return '';
  }
}

// Best-effort: fetch the user node's regional summary. This is independent of
// the Zep project's context-block summary toggle, so we can surface it even
// when that toggle is off. Returns '' on any failure or timeout.
async function getUserSummary(
  client: ZepClient,
  userId: string,
  timeoutMs: number
): Promise<string> {
  try {
    const result = await withTimeout(client.user.getNode(userId), timeoutMs);
    return (result?.node?.summary ?? '').trim();
  } catch (error) {
    logger.warn('Zep user.getNode failed; proceeding without user summary', {
      error: String(error),
    });
    return '';
  }
}

/**
 * Fetch the user's long-term context for a thread, plus (when `userId` is
 * given) the user-node summary, and prepend the summary as a `<USER_SUMMARY>`
 * block. Both lookups run in parallel and are best-effort: on any failure or
 * timeout each returns '' so the chat proceeds without that piece. The summary
 * block is deduped if the thread context already includes one.
 */
export async function retrieveUserContext(
  client: ZepClient,
  threadId: string,
  userId?: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<string> {
  const [context, summary] = await Promise.all([
    getThreadContext(client, threadId, timeoutMs),
    userId ? getUserSummary(client, userId, timeoutMs) : Promise.resolve(''),
  ]);
  if (summary && !context.includes('<USER_SUMMARY>')) {
    const block = `<USER_SUMMARY>\n${summary}\n</USER_SUMMARY>`;
    return context ? `${block}\n\n${context}` : block;
  }
  return context;
}

export interface ChatTurn {
  supabaseUser: User;
  threadId: string;
  userText: string;
  assistantText: string;
}

// user.add / thread.create reject if the entity already exists — expected on
// every turn after the first — so swallow their errors and continue.
async function ignoreErrors(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
  } catch (error) {
    // Usually "already exists" on repeat turns; log at debug so a real
    // misconfiguration (bad key, network) is still diagnosable.
    logger.debug('Zep user/thread ensure skipped', { error: String(error) });
  }
}

// The inter-run separator is a UI-only marker; turn it into blank lines for the
// stored reply. Never contains the retrieved context (not passed to this fn).
function cleanAssistantText(text: string): string {
  return text.split(N8N_RUN_SEPARATOR).join('\n\n').trim();
}

/**
 * Record one chat turn to the user's Zep graph: ensure the user + thread exist,
 * then append the user message and assistant reply. Best-effort — never throws,
 * so a Zep failure can't affect the chat response.
 */
export async function recordChatTurn(
  client: ZepClient,
  turn: ChatTurn
): Promise<void> {
  const zepUser = toZepUser(turn.supabaseUser);
  try {
    await ignoreErrors(() => client.user.add({ ...zepUser }));
    await ignoreErrors(() =>
      client.thread.create({ threadId: turn.threadId, userId: zepUser.userId })
    );
    const messages: Zep.Message[] = [
      {
        role: 'user',
        name: displayName(turn.supabaseUser),
        content: turn.userText,
      },
      {
        role: 'assistant',
        name: 'Assistant',
        content: cleanAssistantText(turn.assistantText),
      },
    ];
    // Assistant turns are kept in thread history but excluded from graph
    // extraction (ignoreRoles): the n8n agent paraphrases the user, so
    // ingesting its replies mis-attributed facts to the assistant entity
    // (e.g. "Assistant has a CS degree"). Extracted facts stay on the user.
    await client.thread.addMessages(turn.threadId, {
      messages,
      ignoreRoles: ['assistant'],
    });
  } catch (error) {
    logger.error('Zep recordChatTurn failed', { error: String(error) });
  }
}
