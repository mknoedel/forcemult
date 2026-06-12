import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getZepClient } from '@/lib/zep/client';
import {
  searchDomainGraph,
  getDomainGraphId,
} from '@/lib/zep/domain-graph';
import { logger } from '@/lib/logger';

// Zep truncates queries at 400 characters; reject longer ones up front.
const searchRequestSchema = z.object({
  query: z.string().trim().min(1).max(400),
});

/**
 * POST /api/graph/search — search the SHARED domain knowledge graph (the
 * agent's second brain) and return the composed context block plus the raw
 * facts/entities/episodes. Unlike /api/memory/search (per-user graph), every
 * signed-in user reads the same graph — it's the common knowledge base the
 * ingestion pipeline populates.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = searchRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request: expected a non-empty query (max 400 chars).' },
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

  const zep = getZepClient();
  if (!zep) {
    return NextResponse.json(
      { error: 'Knowledge graph not configured (set ZEP_API_KEY).' },
      { status: 503 }
    );
  }

  const graphId = getDomainGraphId();
  try {
    const result = await searchDomainGraph(zep, graphId, parsed.data.query);
    return NextResponse.json({
      data: result,
      metadata: { query: parsed.data.query, graphId, scope: 'auto' },
    });
  } catch (error) {
    logger.error('graph/search failed', { error: String(error), graphId });
    return NextResponse.json(
      { error: 'Could not reach the knowledge graph. Try again shortly.' },
      { status: 502 }
    );
  }
}
