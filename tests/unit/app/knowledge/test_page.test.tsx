import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// PageShell renders the shared Navigation (a client component that calls
// Supabase). Stub it so this test focuses on the knowledge page content.
jest.mock('@/app/components/Navigation', () => ({
  __esModule: true,
  default: () => <nav data-testid="nav" />,
}));

import KnowledgePage from '@/app/knowledge/page';
import { IngestPanel } from '@/app/knowledge/components/IngestPanel';
import { DomainGraphExplorer } from '@/app/knowledge/components/DomainGraphExplorer';

function fetchStub(body: unknown, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}


describe('Knowledge page', () => {
  it('renders the hero, pipeline explainer, and both panels', () => {
    render(<KnowledgePage />);
    expect(
      screen.getByRole('heading', { level: 1, name: /teach the agent/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /how the pipeline works/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /ingest a document/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /explore the shared graph/i })
    ).toBeInTheDocument();
    // The dedupe/upsert story is a graded capstone requirement — keep it visible.
    expect(screen.getAllByText(/dedupe|merged/i).length).toBeGreaterThan(0);
  });
});

describe('IngestPanel', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.clearAllMocks();
  });

  it('submits a document and renders the transparent extraction report', async () => {
    const report = {
      ok: true,
      graphId: 'capstone-kg',
      title: 'Instructor Bio',
      entities: [
        { name: 'Jiobit', type: 'Organization', summary: 'Startup.', status: 'new', uuid: 'n1' },
        { name: 'Life360', type: 'Organization', summary: 'Acquirer.', status: 'merged', uuid: 'n2' },
      ],
      relationships: [
        { relation: 'ACQUIRED', fact: 'Life360 acquired Jiobit in 2021.', source: 'Life360', target: 'Jiobit', uuid: 'e1' },
      ],
      episodes: ['ep1'],
      stats: { entities: 2, created: 1, merged: 1, relationships: 1, episodes: 1, failedWrites: 0 },
      message: 'Ingested "Instructor Bio".',
    };
    global.fetch = fetchStub(report);

    render(<IngestPanel />);
    await userEvent.type(
      screen.getByLabelText(/document text/i),
      'John Renaldi founded Jiobit, which Life360 acquired in 2021.'
    );
    await userEvent.click(screen.getByRole('button', { name: /ingest into graph/i }));

    await waitFor(() =>
      expect(screen.getByTestId('ingest-report')).toBeInTheDocument()
    );
    expect(screen.getByText(/1 new/i)).toBeInTheDocument();
    expect(screen.getByText(/1 merged/i)).toBeInTheDocument();
    expect(screen.getByText(/merged with existing/i)).toBeInTheDocument();
    expect(screen.getByText(/—ACQUIRED→/)).toBeInTheDocument();
  });

  it('shows the pipeline error when ingestion is blocked', async () => {
    global.fetch = fetchStub({ ok: false, error: 'guardrail_blocked', message: 'Secret key detected.' }, 422);

    render(<IngestPanel />);
    await userEvent.type(
      screen.getByLabelText(/document text/i),
      'A document with a sneaky credential inside that should be blocked.'
    );
    await userEvent.click(screen.getByRole('button', { name: /ingest into graph/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/secret key detected/i);
  });

  it('refuses to submit fewer than 20 characters', async () => {
    const spy = jest.fn();
    global.fetch = spy as unknown as typeof fetch;
    render(<IngestPanel />);
    await userEvent.type(screen.getByLabelText(/document text/i), 'too short');
    await userEvent.click(screen.getByRole('button', { name: /ingest into graph/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 20 characters/i);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('DomainGraphExplorer', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
    jest.clearAllMocks();
  });

  it('searches the shared graph and renders facts and entities', async () => {
    global.fetch = fetchStub({
      data: {
        context: 'FACTS…',
        facts: [{ uuid: 'e1', fact: 'John Renaldi founded Jiobit.', name: 'FOUNDED' }],
        entities: [{ uuid: 'n1', name: 'Jiobit', summary: 'Startup.', labels: ['Entity', 'Organization'] }],
        episodes: [],
      },
      metadata: { graphId: 'capstone-kg' },
    });

    render(<DomainGraphExplorer />);
    await userEvent.click(screen.getAllByTestId('domain-sample-query')[0]);
    await userEvent.click(screen.getByRole('button', { name: /^search$/i }));

    await waitFor(() =>
      expect(screen.getByTestId('graph-results')).toBeInTheDocument()
    );
    const results = within(screen.getByTestId('graph-results'));
    expect(results.getByText(/founded Jiobit/i)).toBeInTheDocument();
    expect(results.getByText('[FOUNDED]')).toBeInTheDocument();
  });

  it('surfaces API errors', async () => {
    global.fetch = fetchStub({ error: 'Knowledge graph not configured (set ZEP_API_KEY).' }, 503);

    render(<DomainGraphExplorer />);
    await userEvent.type(screen.getByLabelText(/domain graph query/i), 'who founded Jiobit?');
    await userEvent.click(screen.getByRole('button', { name: /^search$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/not configured/i);
  });
});
