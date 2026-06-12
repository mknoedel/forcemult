import type { ZepClient, Zep } from '@getzep/zep-cloud';

/**
 * Shared Zep helpers for the /memory learning page. Unlike the chat-memory
 * helpers (which swallow every error so the chat never breaks), these surface
 * failures to the caller so the educational UI can show students exactly what
 * happened. Both are server-only: the route handlers call them with the
 * signed-in user's id, never an id supplied by the browser.
 */

// Auto search packs the most relevant results across every scope into one
// context block sized to this budget. 4000 leaves room for a few facts/entities
// without overwhelming the page. Zep caps this at 50000.
const DEFAULT_MAX_CHARACTERS = 4000;

/** The signed-in user's long-term memory (their user-node summary). */
export interface UserMemory {
  summary: string;
  hasSummary: boolean;
}

/** A fact/relationship extracted into the graph (a graph edge). */
export interface GraphFact {
  uuid: string;
  fact: string;
  name: string;
  validAt?: string;
  score?: number;
}

/** An entity the graph knows about (a graph node). */
export interface GraphEntity {
  uuid: string;
  name: string;
  summary: string;
  labels: string[];
}

/** A raw source episode that fed the graph. */
export interface GraphEpisode {
  uuid: string;
  content: string;
  createdAt?: string;
}

/** Normalized auto-search output: the ready-to-prompt block plus raw results. */
export interface GraphSearchResult {
  context: string;
  facts: GraphFact[];
  entities: GraphEntity[];
  episodes: GraphEpisode[];
}

/**
 * Fetch the user-node summary — Zep's rolling, long-term picture of who the
 * user is. Throws on failure so the caller can distinguish "no summary yet"
 * (hasSummary=false) from "the service errored".
 */
export async function fetchUserSummary(
  client: ZepClient,
  userId: string
): Promise<UserMemory> {
  try {
    const result = await client.user.getNode(userId);
    const summary = (result?.node?.summary ?? '').trim();
    return { summary, hasSummary: summary.length > 0 };
  } catch (error) {
    // A brand-new user has no Zep record yet — that's an empty state for the
    // UI ("no memory yet"), not a service failure.
    if (isZepNotFound(error)) return { summary: '', hasSummary: false };
    throw error;
  }
}

/**
 * A Zep 404 means the user/graph simply doesn't exist yet (nothing recorded).
 * The first chat turn creates them (see chat-memory.ts), so callers should
 * render an empty state rather than an error.
 */
function isZepNotFound(error: unknown): boolean {
  const e = error as { statusCode?: number; status?: number; message?: string };
  return (
    e?.statusCode === 404 ||
    e?.status === 404 ||
    /not found/i.test(e?.message ?? '')
  );
}

function toFact(edge: Zep.EntityEdge): GraphFact {
  return {
    uuid: edge.uuid,
    fact: edge.fact,
    name: edge.name,
    validAt: edge.validAt,
    score: edge.score,
  };
}

function toEntity(node: Zep.EntityNode): GraphEntity {
  return {
    uuid: node.uuid,
    name: node.name,
    summary: node.summary,
    labels: node.labels ?? [],
  };
}

function toEpisode(episode: Zep.Episode): GraphEpisode {
  return {
    uuid: episode.uuid,
    content: episode.content,
    createdAt: episode.createdAt,
  };
}

/**
 * Run an auto graph search over the user's own graph. Auto scope lets Zep
 * compose the most relevant context across edges, nodes, episodes,
 * observations, and thread summaries into a single `context` block, and
 * `returnRawResults` exposes the underlying edges/nodes/episodes so students
 * can see what fed that block. Throws on failure (the route maps it to 502).
 */
export async function searchUserGraph(
  client: ZepClient,
  userId: string,
  query: string,
  opts?: { maxCharacters?: number }
): Promise<GraphSearchResult> {
  try {
    const results = await client.graph.search({
      userId,
      query,
      scope: 'auto',
      maxCharacters: opts?.maxCharacters ?? DEFAULT_MAX_CHARACTERS,
      returnRawResults: true,
    });
    return {
      context: results.context ?? '',
      facts: (results.edges ?? []).map(toFact),
      entities: (results.nodes ?? []).map(toEntity),
      episodes: (results.episodes ?? []).map(toEpisode),
    };
  } catch (error) {
    // A user with no graph yet is an empty result, not an outage.
    if (isZepNotFound(error)) {
      return { context: '', facts: [], entities: [], episodes: [] };
    }
    throw error;
  }
}
