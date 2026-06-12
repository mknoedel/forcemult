import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

import { ChatMessages } from '@/app/components/chat/ChatMessages';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';

type Msg = {
  id: string;
  role: string;
  parts: Array<{ type: string; text?: string }>;
};

function renderMessages(messages: Msg[], status = 'ready', error?: unknown) {
  return render(
    <ChatMessages messages={messages} status={status} error={error} />
  );
}

describe('ChatMessages', () => {
  it('shows the empty state when there are no messages', () => {
    renderMessages([]);
    expect(
      screen.getByText(/ask anything to see a streamed response/i)
    ).toBeInTheDocument();
  });

  it('renders user and assistant bubbles', () => {
    renderMessages([
      { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi there' }] },
      { id: '2', role: 'assistant', parts: [{ type: 'text', text: 'Hello!' }] },
    ]);
    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('splits a message with a run separator into two bubbles', () => {
    renderMessages([
      {
        id: '1',
        role: 'assistant',
        parts: [{ type: 'text', text: `First${N8N_RUN_SEPARATOR}Final` }],
      },
    ]);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('shows the thinking indicator when submitted and an error when present', () => {
    renderMessages(
      [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
      'submitted',
      new Error('boom')
    );
    expect(
      screen.getByRole('status', { name: /thinking/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });
});
