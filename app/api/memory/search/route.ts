import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getZepClient } from '@/lib/zep/client';
import { searchUserGraph } from '@/lib/zep/graph-search';
import { logger } from '@/lib/logger';

// Zep truncates queries at 400 characters; reject longer ones up front.
const searchRequestSchema = z.object({
  query: z.string().trim().min(1).max(400),
});

/**
 * POST /api/memory/search — run an auto graph search over the signed-in user's
 * own knowledge graph and return the composed context block plus the raw
 * edges/nodes/episodes that fed it. The user id comes from the session (never
 * the client), so searches are always scoped to the caller's own graph.
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
      { error: 'Memory service not configured (set ZEP_API_KEY).' },
      { status: 503 }
    );
  }

  try {
    const result = await searchUserGraph(zep, user.id, parsed.data.query);
    return NextResponse.json({
      data: result,
      metadata: { query: parsed.data.query, scope: 'auto' },
    });
  } catch (error) {
    logger.error('memory/search failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Could not reach the memory service. Try again shortly.' },
      { status: 502 }
    );
  }
}
