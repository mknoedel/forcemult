/**
 * Normalize an n8n AI Agent streaming response into a plain text token stream.
 *
 * n8n streams **newline-delimited JSON (NDJSON)**, one record per line:
 *   {"type":"begin","metadata":{...}}
 *   {"type":"item","content":"2 ","metadata":{...}}
 *   {"type":"item","content":"+ 2 equals 4.","metadata":{...}}
 *   {"type":"end","metadata":{...}}
 *
 * The agent's reply is the concatenation of the `content` fields on the
 * `type:"item"` records. This transform extracts just that text so the chat UI
 * shows the reply, not the raw JSON envelopes. Lines that aren't n8n envelopes
 * (e.g. a plain-text streaming workflow) are passed through unchanged.
 *
 * **Multiple runs:** an agent that calls the LLM more than once (e.g. an interim
 * "I need to check our docs" reply, then the final answer after a tool call)
 * streams several `begin … item … end` blocks in one response. We insert
 * `N8N_RUN_SEPARATOR` between runs so the chat UI can render each as its own
 * bubble instead of gluing them into one. The separator is never emitted before
 * the first run, so single-run replies are unchanged.
 */

/**
 * Boundary marker emitted between distinct agent runs (ASCII Record Separator,
 * U+001E). It will never appear in normal reply text, and the chat UI splits the
 * streamed message on it to show one bubble per run.
 */
export const N8N_RUN_SEPARATOR = '\x1e';

interface N8nStreamChunk {
  type?: string;
  content?: string;
}

export function createN8nTextStream(): TransformStream<string, string> {
  // Network chunks don't respect line boundaries, so buffer partial lines.
  let buffer = '';
  // Track run boundaries so a second (or later) run is split into its own bubble.
  let hasEmittedContent = false;
  let pendingSeparator = false;

  function emitLine(
    line: string,
    controller: TransformStreamDefaultController<string>
  ): void {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const chunk = JSON.parse(trimmed) as N8nStreamChunk;
      if (chunk.type === 'begin') {
        // A new run is starting; if we've already streamed text from an earlier
        // run, mark a boundary to emit before the next item's content.
        if (hasEmittedContent) pendingSeparator = true;
        return;
      }
      if (chunk.type === 'item' && typeof chunk.content === 'string') {
        if (pendingSeparator) {
          controller.enqueue(N8N_RUN_SEPARATOR);
          pendingSeparator = false;
        }
        controller.enqueue(chunk.content);
        hasEmittedContent = true;
      }
      // end/other envelope types carry no reply text — drop them.
    } catch {
      // Not an n8n JSON envelope: a plain-text streaming workflow. Pass it
      // through so the chat still shows something.
      controller.enqueue(line);
      hasEmittedContent = true;
    }
  }

  return new TransformStream<string, string>({
    transform(textChunk, controller) {
      buffer += textChunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) emitLine(line, controller);
    },
    flush(controller) {
      if (buffer) emitLine(buffer, controller);
    },
  });
}
