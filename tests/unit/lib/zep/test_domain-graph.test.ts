/** @jest-environment node */
import type { ZepClient } from '@getzep/zep-cloud';
import {
  searchDomainGraph,
  getDomainGraphId,
  DEFAULT_GRAPH_ID,
} from '@/lib/zep/domain-graph';

const mockSearch = jest.fn();
const client = { graph: { search: mockSearch } } as unknown as ZepClient;

afterEach(() => {
  jest.clearAllMocks();
  delete process.env.ZEP_GRAPH_ID;
});

describe('getDomainGraphId', () => {
  it('defaults to the capstone graph id', () => {
    expect(getDomainGraphId()).toBe(DEFAULT_GRAPH_ID);
  });

  it('honors ZEP_GRAPH_ID', () => {
    process.env.ZEP_GRAPH_ID = 'my-graph';
    expect(getDomainGraphId()).toBe('my-graph');
  });

  it('falls back when ZEP_GRAPH_ID is blank', () => {
    process.env.ZEP_GRAPH_ID = '   ';
    expect(getDomainGraphId()).toBe(DEFAULT_GRAPH_ID);
  });
});

describe('searchDomainGraph', () => {
  it('runs an auto search scoped to the graph id and normalizes results', async () => {
    mockSearch.mockResolvedValue({
      context: 'FACTS: Life360 acquired Jiobit in 2021.',
      edges: [
        {
          uuid: 'e1',
          fact: 'Life360 acquired Jiobit in 2021.',
          name: 'ACQUIRED',
          validAt: '2021-01-01T00:00:00Z',
          score: 0.92,
        },
      ],
      nodes: [
        { uuid: 'n1', name: 'Jiobit', summary: 'Wearable tracker startup.', labels: ['Entity', 'Organization'] },
      ],
      episodes: [{ uuid: 'ep1', content: 'Bio text…', createdAt: '2026-06-12T00:00:00Z' }],
    });

    const result = await searchDomainGraph(client, 'capstone-kg', 'who acquired Jiobit?');

    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        graphId: 'capstone-kg',
        query: 'who acquired Jiobit?',
        scope: 'auto',
        returnRawResults: true,
      })
    );
    expect(result.context).toContain('acquired');
    expect(result.facts).toEqual([
      expect.objectContaining({ uuid: 'e1', name: 'ACQUIRED' }),
    ]);
    expect(result.entities[0]).toEqual(
      expect.objectContaining({ name: 'Jiobit', labels: ['Entity', 'Organization'] })
    );
    expect(result.episodes[0].uuid).toBe('ep1');
  });

  it('returns empty arrays when the graph has nothing', async () => {
    mockSearch.mockResolvedValue({});
    const result = await searchDomainGraph(client, 'capstone-kg', 'anything');
    expect(result).toEqual({ context: '', facts: [], entities: [], episodes: [] });
  });

  it('propagates Zep failures to the caller', async () => {
    mockSearch.mockRejectedValue(new Error('zep down'));
    await expect(searchDomainGraph(client, 'capstone-kg', 'q')).rejects.toThrow('zep down');
  });
});
