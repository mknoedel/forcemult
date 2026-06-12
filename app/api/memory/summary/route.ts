import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getZepClient } from '@/lib/zep/client';
import { fetchUserSummary } from '@/lib/zep/graph-search';
import { logger } from '@/lib/logger';

/**
 * GET /api/memory/summary — return the signed-in user's long-term memory (their
 * Zep user-node summary). The id comes from the session, never the client, so a
 * user can only ever read their own memory. ZEP_API_KEY stays server-side.
 */
export async function GET(): Promise<NextResponse> {
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
    const memory = await fetchUserSummary(zep, user.id);
    return NextResponse.json({ data: memory });
  } catch (error) {
    logger.error('memory/summary failed', { error: String(error) });
    return NextResponse.json(
      { error: 'Could not reach the memory service. Try again shortly.' },
      { status: 502 }
    );
  }
}
