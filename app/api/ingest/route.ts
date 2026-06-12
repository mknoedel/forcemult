import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Extraction + graph writes can take a while on long documents.
export const maxDuration = 120;

const N8N_TIMEOUT_MS = 110_000;

const ingestRequestSchema = z.object({
  title: z.string().trim().max(120).optional(),
  text: z.string().trim().min(20).max(60_000),
  source: z.string().trim().max(120).optional(),
});

/**
 * POST /api/ingest — hand a document to the n8n Knowledge Ingestion Pipeline
 * and relay its transparent report (entities, relationships, dedupe stats)
 * back to the Knowledge page. The webhook URL and shared secret stay
 * server-side; the n8n workflow owns extraction, guardrails, dedupe, and the
 * Zep writes.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = ingestRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request: text must be 20–60,000 characters.' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const webhookUrl = process.env.N8N_INGEST_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Ingestion pipeline not configured (set N8N_INGEST_WEBHOOK_URL).' },
      { status: 503 }
    );
  }

  try {
    const upstream = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { API_KEY: process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify({
        title: parsed.data.title || 'Untitled document',
        text: parsed.data.text,
        source: parsed.data.source || `app:${user.email ?? user.id}`,
      }),
      signal: AbortSignal.timeout(N8N_TIMEOUT_MS),
    });

    const body: unknown = await upstream.json().catch(() => null);
    if (body === null) {
      logger.error('ingest webhook returned non-JSON', {
        status: upstream.status,
      });
      return NextResponse.json(
        { error: `Ingestion pipeline returned an unexpected response (${upstream.status}).` },
        { status: 502 }
      );
    }
    // Pass the pipeline's verdict through — including guardrail blocks (422)
    // and validation errors (400) — so the UI can show the real reason.
    return NextResponse.json(body, { status: upstream.status });
  } catch (error) {
    logger.error('ingest webhook unreachable', { error: String(error) });
    return NextResponse.json(
      { error: 'Could not reach the ingestion pipeline. Is the n8n workflow published?' },
      { status: 502 }
    );
  }
}
