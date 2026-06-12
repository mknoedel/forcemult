import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const mockOrder = jest.fn();
const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
};
const mockRemoveChannel = jest.fn();
// Capture the Realtime callback so a test can fire a change event.
const realtime: { cb?: () => void } = {};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'user-123' } } }),
    },
    from: () => ({ select: () => ({ order: mockOrder }) }),
    channel: () => ({
      on: (_e: string, _f: unknown, cb: () => void) => {
        realtime.cb = cb;
        return mockChannel;
      },
      subscribe: () => mockChannel,
    }),
    removeChannel: mockRemoveChannel,
  }),
}));

import { ChatSessionSidebar } from '@/app/components/chat/ChatSessionSidebar';

function row(session_id: string, name: string) {
  return {
    id: `id-${session_id}`,
    session_id,
    user_id: 'user-123',
    name,
    created_at: '2026-06-04T00:00:00Z',
    updated_at: '2026-06-04T00:00:00Z',
  };
}

describe('ChatSessionSidebar', () => {
  beforeEach(() => {
    mockOrder.mockReset();
    mockRemoveChannel.mockReset();
    mockChannel.on.mockClear();
    mockChannel.subscribe.mockClear();
    realtime.cb = undefined;
  });

  it('creates and subscribes the channel synchronously within the effect', () => {
    // Regression: the channel must be set up synchronously (no `await` before
    // `.subscribe()`). If it sits behind an await (e.g. getUser), React Strict
    // Mode's cleanup runs before the channel exists, so it is never torn down;
    // the second mount then reuses the already-subscribed channel and Supabase
    // throws "cannot add postgres_changes callbacks ... after subscribe()".
    mockOrder.mockResolvedValue({ data: [], error: null });
    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );
    // Called during the synchronous effect body, before render() returns.
    expect(mockChannel.subscribe).toHaveBeenCalled();
    expect(realtime.cb).toBeDefined();
  });

  it('renders the session list from the browser client', async () => {
    mockOrder.mockResolvedValue({
      data: [row('s1', 'First chat'), row('s2', 'Second chat')],
      error: null,
    });
    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );
    expect(await screen.findByText('First chat')).toBeInTheDocument();
    expect(screen.getByText('Second chat')).toBeInTheDocument();
  });

  it('calls onSelectSession when a session is clicked', async () => {
    mockOrder.mockResolvedValue({
      data: [row('s1', 'First chat')],
      error: null,
    });
    const onSelect = jest.fn();
    render(
      <ChatSessionSidebar
        activeSessionId="other"
        onSelectSession={onSelect}
        onNewChat={jest.fn()}
      />
    );
    await screen.findByText('First chat');
    await userEvent.click(screen.getByText('First chat'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('marks the active session with aria-current', async () => {
    mockOrder.mockResolvedValue({
      data: [row('s1', 'First chat')],
      error: null,
    });
    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );
    const item = await screen.findByText('First chat');
    expect(item.closest('[aria-current="true"]')).not.toBeNull();
  });

  it('calls onNewChat when the New chat button is clicked', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const onNewChat = jest.fn();
    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={onNewChat}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /new chat/i }));
    expect(onNewChat).toHaveBeenCalled();
  });

  it('re-fetches the list when a Realtime change fires', async () => {
    mockOrder
      .mockResolvedValueOnce({ data: [row('s1', 'First chat')], error: null })
      .mockResolvedValueOnce({
        data: [row('s2', 'Brand new chat'), row('s1', 'First chat')],
        error: null,
      });
    render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );
    await screen.findByText('First chat');
    await waitFor(() => expect(realtime.cb).toBeDefined());
    act(() => realtime.cb!());
    expect(await screen.findByText('Brand new chat')).toBeInTheDocument();
  });

  it('removes the Realtime channel on unmount', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const { unmount } = render(
      <ChatSessionSidebar
        activeSessionId="s1"
        onSelectSession={jest.fn()}
        onNewChat={jest.fn()}
      />
    );
    await waitFor(() => expect(realtime.cb).toBeDefined());
    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });
});
