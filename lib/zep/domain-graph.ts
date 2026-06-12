import type { ZepClient } from '@getzep/zep-cloud';
import type {
  GraphFact,
  GraphEntity,
  GraphEpisode,
} from '@/lib/zep/graph-search';

/**
 * Helpers for the SHARED domain knowledge graph (the capstone's "second
 * brain") — a standalone Zep graph, distinct from each user's personal memory
 * graph. The n8n ingestion pipeline writes to it; the agent's graph-query
 * subagent reads from it; these helpers give the app a read-only window for
 * the Knowledge page explorer.
 */

export const DEFAULT_GRAPH_ID = 'capstone-kg';

/** The shared graph id, configurable via ZEP_GRAPH_ID. */
export function getDomainGraphId(): string {
  return process.env.ZEP_GRAPH_ID?.trim() || DEFAULT_GRAPH_ID;
}

export interface DomainGraphSearchResult {
  context: string;
  facts: GraphFact[];
  entities: GraphEntity[];
  episodes: GraphEpisode[];
}

// Auto search composes facts/entities/episodes into one context block sized
// to this budget; raw results ride along for the explorer UI.
const DEFAULT_MAX_CHARACTERS = 4000;

/**
 * Run an auto search over the shared domain graph. Throws on failure so the
 * route can surface a useful error to the Knowledge page.
 */
export async function searchDomainGraph(
  client: ZepClient,
  graphId: string,
  query: string,
  opts?: { maxCharacters?: number }
): Promise<DomainGraphSearchResult> {
  const results = await client.graph.search({
    graphId,
    query,
    scope: 'auto',
    maxCharacters: opts?.maxCharacters ?? DEFAULT_MAX_CHARACTERS,
    returnRawResults: true,
  });
  return {
    context: results.context ?? '',
    facts: (results.edges ?? []).map((edge) => ({
      uuid: edge.uuid,
      fact: edge.fact,
      name: edge.name,
      validAt: edge.validAt,
      score: edge.score,
    })),
    entities: (results.nodes ?? []).map((node) => ({
      uuid: node.uuid,
      name: node.name,
      summary: node.summary,
      labels: node.labels ?? [],
    })),
    episodes: (results.episodes ?? []).map((episode) => ({
      uuid: episode.uuid,
      content: episode.content,
      createdAt: episode.createdAt,
    })),
  };
}
