/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/tasks/route';
import { PATCH, DELETE } from '@/app/api/tasks/[id]/route';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the cookie-aware server client. Each handler calls `await createClient()`
// then `auth.getUser()` (for the auth guard) and `from('tasks')` for queries.
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const mockFrom = jest.fn();
const mockGetUser = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  // Default: a signed-in user. Override in tests that exercise the 401 path.
  mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  (createClient as jest.Mock).mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  });
});

describe('Tasks API - GET /api/tasks', () => {
  it('should return all tasks ordered by creation date', async () => {
    const mockTasks = [
      {
        id: '1',
        title: 'Task 1',
        completed: false,
        priority: 'high',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      },
      {
        id: '2',
        title: 'Task 2',
        completed: true,
        priority: 'medium',
        created_at: '2024-11-08T11:00:00Z',
        updated_at: '2024-11-08T11:00:00Z',
      },
    ];

    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: mockTasks, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await GET();
    const data = await response.json();

    expect(mockFrom).toHaveBeenCalledWith('tasks');
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(response.status).toBe(200);
    expect(data).toEqual({ data: mockTasks, metadata: { count: 2 } });
  });

  it('should return empty array when no tasks exist', async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ data: [], metadata: { count: 0 } });
  });

  it('should return 401 when the user is not signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    const mockOrder = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database connection failed' },
    });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({ select: mockSelect });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch tasks',
      details: 'Database connection failed',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle exceptions in GET handler', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Internal server error',
      details: 'Unexpected error',
    });
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Tasks API - POST /api/tasks', () => {
  it('should create a new task with valid data', async () => {
    const newTask = { title: 'New Task', priority: 'high' as const };
    const createdTask = {
      id: '123',
      ...newTask,
      completed: false,
      created_at: '2024-11-08T12:00:00Z',
      updated_at: '2024-11-08T12:00:00Z',
    };

    const mockSingle = jest
      .fn()
      .mockResolvedValue({ data: createdTask, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(mockFrom).toHaveBeenCalledWith('tasks');
    expect(response.status).toBe(201);
    expect(data).toEqual({ data: createdTask });
  });

  it('should create task with defaults and the current user_id', async () => {
    const newTask = { title: 'Simple Task' };
    const createdTask = {
      id: '123',
      title: 'Simple Task',
      completed: false,
      priority: 'medium',
      created_at: '2024-11-08T12:00:00Z',
      updated_at: '2024-11-08T12:00:00Z',
    };

    const mockSingle = jest
      .fn()
      .mockResolvedValue({ data: createdTask, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify(newTask),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockInsert).toHaveBeenCalledWith({
      title: 'Simple Task',
      completed: false,
      priority: 'medium',
      user_id: 'user-123',
    });
  });

  it('should return 401 when the user is not signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Task' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should reject task with empty title', async () => {
    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '', priority: 'high' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Title is required' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should reject task with whitespace-only title', async () => {
    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: '   ', priority: 'medium' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Title is required' });
  });

  it('should handle database errors during creation', async () => {
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Insert failed' },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Task' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to create task',
      details: 'Insert failed',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle exceptions in POST handler', async () => {
    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: '{incomplete json',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(data.details).toBeDefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Tasks API - PATCH /api/tasks/[id]', () => {
  it('should update task completion status', async () => {
    const updatedTask = {
      id: '123',
      title: 'Test Task',
      completed: true,
      priority: 'high',
      created_at: '2024-11-08T12:00:00Z',
      updated_at: '2024-11-08T13:00:00Z',
    };

    const mockSingle = jest
      .fn()
      .mockResolvedValue({ data: updatedTask, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '123' }),
    });
    const data = await response.json();

    expect(mockFrom).toHaveBeenCalledWith('tasks');
    expect(mockEq).toHaveBeenCalledWith('id', '123');
    expect(response.status).toBe(200);
    expect(data).toEqual({ data: updatedTask });
  });

  it('should update task title', async () => {
    const updatedTask = {
      id: '123',
      title: 'Updated Title',
      completed: false,
      priority: 'medium',
      created_at: '2024-11-08T12:00:00Z',
      updated_at: '2024-11-08T13:00:00Z',
    };

    const mockSingle = jest
      .fn()
      .mockResolvedValue({ data: updatedTask, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Updated Title' }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '123' }),
    });

    expect(response.status).toBe(200);
  });

  it('should return 401 when the user is not signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '123' }),
    });
    expect(response.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should reject update with empty title', async () => {
    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '' }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Title cannot be empty' });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should reject update with whitespace-only title', async () => {
    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'PATCH',
      body: JSON.stringify({ title: '   ' }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Title cannot be empty' });
  });

  it('should return 404 when task not found', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    const request = new Request('http://localhost:3000/api/tasks/999', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '999' }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Task not found' });
  });

  it('should automatically update updated_at timestamp', async () => {
    const mockSingle = jest.fn().mockResolvedValue({ data: {}, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockEq = jest.fn().mockReturnValue({ select: mockSelect });
    const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ update: mockUpdate });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    });

    await PATCH(request, { params: Promise.resolve({ id: '123' }) });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        updated_at: expect.any(String),
      })
    );
  });

  it('should handle exceptions in PATCH handler', async () => {
    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'PATCH',
      body: '{incomplete json',
    });

    const response = await PATCH(request, {
      params: Promise.resolve({ id: '123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
    expect(data.details).toBeDefined();
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('Tasks API - DELETE /api/tasks/[id]', () => {
  it('should delete a task successfully', async () => {
    const mockEq = jest.fn().mockResolvedValue({ error: null });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '123' }),
    });
    const data = await response.json();

    expect(mockFrom).toHaveBeenCalledWith('tasks');
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '123');
    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'Task deleted successfully' });
  });

  it('should return 401 when the user is not signed in', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '123' }),
    });
    expect(response.status).toBe(401);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should handle database errors during deletion', async () => {
    const mockEq = jest
      .fn()
      .mockResolvedValue({ error: { message: 'Delete failed' } });
    const mockDelete = jest.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ delete: mockDelete });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to delete task',
      details: 'Delete failed',
    });
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle exceptions in DELETE handler', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('Unexpected deletion error');
    });

    const request = new Request('http://localhost:3000/api/tasks/123', {
      method: 'DELETE',
    });

    const response = await DELETE(request, {
      params: Promise.resolve({ id: '123' }),
    });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Internal server error',
      details: 'Unexpected deletion error',
    });
    expect(logger.error).toHaveBeenCalled();
  });
});
