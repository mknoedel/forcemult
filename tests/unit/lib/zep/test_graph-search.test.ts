/** @jest-environment node */
import type { ZepClient } from '@getzep/zep-cloud';
import { fetchUserSummary, searchUserGraph } from '@/lib/zep/graph-search';

function fakeClient(overrides: {
  search?: jest.Mock;
  getNode?: jest.Mock;
}): ZepClient {
  return {
    graph: { search: overrides.search ?? jest.fn() },
    user: { getNode: overrides.getNode ?? jest.fn() },
  } as unknown as ZepClient;
}

describe('fetchUserSummary', () => {
  it('returns the trimmed user-node summary and hasSummary=true', async () => {
    const getNode = jest.fn().mockResolvedValue({
      node: { summary: '  Dana is a fintech founder.  ' },
    });
    const client = fakeClient({ getNode });

    await expect(fetchUserSummary(client, 'user-1')).resolves.toEqual({
      summary: 'Dana is a fintech founder.',
      hasSummary: true,
    });
    expect(getNode).toHaveBeenCalledWith('user-1');
  });

  it('returns hasSummary=false when the node has no summary yet', async () => {
    const client = fakeClient({
      getNode: jest.fn().mockResolvedValue({ node: { summary: '' } }),
    });
    await expect(fetchUserSummary(client, 'user-1')).resolves.toEqual({
      summary: '',
      hasSummary: false,
    });
  });

  it('returns hasSummary=false when there is no node at all', async () => {
    const client = fakeClient({
      getNode: jest.fn().mockResolvedValue({}),
    });
    await expect(fetchUserSummary(client, 'user-1')).resolves.toEqual({
      summary: '',
      hasSummary: false,
    });
  });

  it('propagates errors so the caller can surface them', async () => {
    const client = fakeClient({
      getNode: jest.fn().mockRejectedValue(new Error('zep down')),
    });
    await expect(fetchUserSummary(client, 'user-1')).rejects.toThrow(
      'zep down'
    );
  });
});

describe('searchUserGraph', () => {
  it('calls graph.search with auto scope + raw results scoped to the user', async () => {
    const search = jest.fn().mockResolvedValue({ context: 'CTX' });
    const client = fakeClient({ search });

    await searchUserGraph(client, 'user-1', 'what did we decide?');

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        query: 'what did we decide?',
        scope: 'auto',
        returnRawResults: true,
      })
    );
  });

  it('passes a custom maxCharacters through', async () => {
    const search = jest.fn().mockResolvedValue({ context: '' });
    const client = fakeClient({ search });

    await searchUserGraph(client, 'user-1', 'q', { maxCharacters: 1234 });

    expect(search).toHaveBeenCalledWith(
      expect.objectContaining({ maxCharacters: 1234 })
    );
  });

  it('normalizes the context block and raw edges/nodes/episodes', async () => {
    const search = jest.fn().mockResolvedValue({
      context: 'Pricing rollout decisions: approved tiered pricing for Q3.',
      edges: [
        {
          uuid: 'e1',
          fact: 'Eng and Finance agreed to delay the enterprise tier',
          name: 'AGREED_WITH',
          validAt: '2026-04-22T00:00:00Z',
          score: 0.81,
        },
      ],
      nodes: [
        {
          uuid: 'n1',
          name: 'Enterprise Tier',
          summary: 'A pricing plan for large customers.',
          labels: ['Product'],
        },
      ],
      episodes: [
        {
          uuid: 'ep1',
          content: 'We should delay the enterprise tier by two weeks.',
          createdAt: '2026-04-22T00:00:00Z',
        },
      ],
      observations: [],
      thread_summaries: [],
    });
    const client = fakeClient({ search });

    const result = await searchUserGraph(client, 'user-1', 'pricing');

    expect(result.context).toContain('Pricing rollout decisions');
    expect(result.facts).toEqual([
      {
        uuid: 'e1',
        fact: 'Eng and Finance agreed to delay the enterprise tier',
        name: 'AGREED_WITH',
        validAt: '2026-04-22T00:00:00Z',
        score: 0.81,
      },
    ]);
    expect(result.entities).toEqual([
      {
        uuid: 'n1',
        name: 'Enterprise Tier',
        summary: 'A pricing plan for large customers.',
        labels: ['Product'],
      },
    ]);
    expect(result.episodes).toEqual([
      {
        uuid: 'ep1',
        content: 'We should delay the enterprise tier by two weeks.',
        createdAt: '2026-04-22T00:00:00Z',
      },
    ]);
  });

  it('returns empty arrays and string when the graph has nothing', async () => {
    const search = jest.fn().mockResolvedValue({ context: undefined });
    const client = fakeClient({ search });

    await expect(searchUserGraph(client, 'user-1', 'q')).resolves.toEqual({
      context: '',
      facts: [],
      entities: [],
      episodes: [],
    });
  });
});
