import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// The AI SDK and react-markdown/remark-gfm ship ESM/TS that Jest won't
// transform from node_modules. Mock them so the test stays focused on the
// chat shell rendering (streaming behavior is covered by the route handler test).
const mockSendMessage = jest.fn();
const mockSetMessages = jest.fn();
let mockChatState: {
  messages: Array<{
    id: string;
    role: string;
    parts: Array<{ type: string; text?: string }>;
  }>;
  status: string;
  error: unknown;
} = { messages: [], status: 'ready', error: undefined };

jest.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: mockChatState.messages,
    sendMessage: mockSendMessage,
    setMessages: mockSetMessages,
    status: mockChatState.status,
    error: mockChatState.error,
  }),
}));
jest.mock('ai', () => ({
  TextStreamChatTransport: class {
    constructor() {}
  },
}));
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => {} }));

// Navigation, the session sidebar, and history loading all read from the
// Supabase browser client — stub it so they don't create a real client.
// The sidebar lists sessions via `.from().select().order()`; history loading
// filters via `.from().select().eq()` (no trailing `.order()` — the mapper sorts).
const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
const mockHistoryOrder = jest.fn().mockResolvedValue({ data: [], error: null });
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: () => ({
      select: () => ({
        order: mockOrder,
        eq: () => mockHistoryOrder(),
      }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({}) }),
      subscribe: () => ({}),
    }),
    removeChannel: jest.fn(),
  }),
}));

// Stub the sidebar so we can drive its callbacks directly: a "New chat" button
// fires `onNewChat`, a "Load session" button fires `onSelectSession('sess-1')`.
// This lets us characterize the page's session-switch / new-chat handlers
// without depending on the real sidebar's data loading.
jest.mock('@/app/components/chat/ChatSessionSidebar', () => ({
  ChatSessionSidebar: ({
    onNewChat,
    onSelectSession,
  }: {
    onNewChat: () => void;
    onSelectSession: (id: string) => void;
  }) => (
    <div>
      <button type="button" onClick={onNewChat}>
        New chat
      </button>
      <button type="button" onClick={() => onSelectSession('sess-1')}>
        Load session
      </button>
    </div>
  ),
}));

import ChatPage from '@/app/chat/page';
import { N8N_RUN_SEPARATOR } from '@/lib/n8n-stream';

describe('ChatPage', () => {
  beforeEach(() => {
    mockSendMessage.mockReset();
    mockSetMessages.mockReset();
    mockHistoryOrder.mockReset();
    mockHistoryOrder.mockResolvedValue({ data: [], error: null });
    mockChatState = { messages: [], status: 'ready', error: undefined };
    global.fetch = jest.fn(
      () => new Promise(() => {})
    ) as unknown as typeof fetch;
  });

  it('renders the empty chat shell', () => {
    render(<ChatPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: /llm agent chat/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    expect(
      screen.getByText(/ask anything to see a streamed response/i)
    ).toBeInTheDocument();
  });

  it('disables the send button while the input is empty', () => {
    render(<ChatPage />);
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('renders user and assistant messages, the thinking indicator, and errors', () => {
    mockChatState = {
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi there' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hello!' }, { type: 'step-start' }],
        },
      ],
      status: 'submitted',
      error: new Error('boom'),
    };

    render(<ChatPage />);

    expect(screen.getByText('Hi there')).toBeInTheDocument();
    expect(screen.getByText('Hello!')).toBeInTheDocument();
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    // While busy the send button is disabled.
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
  });

  it('shows an animated thinking indicator while waiting for a response', () => {
    mockChatState = {
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi there' }] },
      ],
      status: 'submitted',
      error: undefined,
    };

    render(<ChatPage />);

    // The indicator is an accessible status region (not just muted text).
    const indicator = screen.getByRole('status', { name: /thinking/i });
    expect(indicator).toBeInTheDocument();
    // It contains animated dots so students see a clear "waiting" graphic.
    expect(indicator.querySelectorAll('.animate-bounce').length).toBe(3);
  });

  it('renders the user bubble with inverted prose so text is readable on the primary background', () => {
    mockChatState = {
      messages: [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi there' }] },
        {
          id: '2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hello!' }],
        },
      ],
      status: 'ready',
      error: undefined,
    };

    render(<ChatPage />);

    const userProse = screen.getByText('Hi there').closest('.prose');
    expect(userProse).toHaveClass('prose-invert');

    const assistantProse = screen.getByText('Hello!').closest('.prose');
    expect(assistantProse).not.toHaveClass('prose-invert');
  });

  it('tightens spacing around rules and headings so replies have no large gaps', () => {
    // Agent markdown often contains `---` (an <hr>) and `##` headings; Tailwind's
    // default prose gives those ~3em margins, producing big vertical gaps.
    mockChatState = {
      messages: [
        {
          id: '1',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Reply body' }],
        },
      ],
      status: 'ready',
      error: undefined,
    };

    render(<ChatPage />);

    const prose = screen.getByText('Reply body').closest('.prose');
    expect(prose?.className).toMatch(/prose-hr:my-/);
    expect(prose?.className).toMatch(/prose-headings:mt-/);
  });

  it('renders each agent run as its own bubble when a message has a run separator', () => {
    mockChatState = {
      messages: [
        {
          id: '1',
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text: `First response${N8N_RUN_SEPARATOR}Final answer`,
            },
          ],
        },
      ],
      status: 'ready',
      error: undefined,
    };

    render(<ChatPage />);

    // Split into two distinct text nodes — if it were one merged bubble, the raw
    // separator char would sit between them and neither exact match would resolve.
    expect(screen.getByText('First response')).toBeInTheDocument();
    expect(screen.getByText('Final answer')).toBeInTheDocument();
    // The raw control character must never reach the rendered DOM.
    expect(
      screen.queryByText(`First response${N8N_RUN_SEPARATOR}Final answer`)
    ).not.toBeInTheDocument();
  });

  it('renders the session sidebar with a New chat button', async () => {
    render(<ChatPage />);
    expect(
      await screen.findByRole('button', { name: /new chat/i })
    ).toBeInTheDocument();
  });

  it('clears the transcript when starting a new chat', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.click(screen.getByRole('button', { name: /new chat/i }));

    expect(mockSetMessages).toHaveBeenCalledWith([]);
  });

  it('loads a selected session and maps its history into UI messages', async () => {
    mockHistoryOrder.mockResolvedValue({
      data: [
        {
          id: 1,
          session_id: 'sess-1',
          message: { type: 'human', content: 'Hi' },
        },
        { id: 2, session_id: 'sess-1', message: { type: 'ai', content: 'Yo' } },
      ],
      error: null,
    });
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.click(screen.getByRole('button', { name: /load session/i }));

    await waitFor(() =>
      expect(mockSetMessages).toHaveBeenCalledWith([
        {
          id: 'history-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hi' }],
        },
        {
          id: 'history-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Yo' }],
        },
      ])
    );
  });

  it('sends a message on submit', async () => {
    const user = userEvent.setup();
    render(<ChatPage />);

    await user.type(
      screen.getByPlaceholderText('Type a message…'),
      'Hello agent'
    );
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(mockSendMessage).toHaveBeenCalledWith({ text: 'Hello agent' });
  });
});
