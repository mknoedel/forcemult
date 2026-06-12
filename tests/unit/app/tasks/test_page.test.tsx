import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TasksPage from '@/app/tasks/page';

// Navigation (rendered by this page) reads auth state from the Supabase
// browser client — stub it so it doesn't create a real client.
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('Tasks Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Initial Load', () => {
    it('should display loading state initially', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<TasksPage />);

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });

    it('should fetch and display tasks on load', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Complete Next.js tutorial',
          completed: false,
          priority: 'high',
          created_at: '2024-11-08T12:00:00Z',
          updated_at: '2024-11-08T12:00:00Z',
        },
        {
          id: '2',
          title: 'Write unit tests',
          completed: true,
          priority: 'medium',
          created_at: '2024-11-08T11:00:00Z',
          updated_at: '2024-11-08T11:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTasks }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Complete Next.js tutorial')
        ).toBeInTheDocument();
        expect(screen.getByText('Write unit tests')).toBeInTheDocument();
      });

      expect(screen.getByText('Tasks (2)')).toBeInTheDocument();
    });

    it('should display empty state when no tasks exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No tasks yet. Create one above!')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Tasks (0)')).toBeInTheDocument();
    });

    it('should display error message on fetch failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Database connection failed' }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(
          screen.getByText(/Database connection failed/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Create Task', () => {
    beforeEach(() => {
      // Mock initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });
    });

    it('should create a new task with default priority', async () => {
      const user = userEvent.setup();

      const newTask = {
        id: '123',
        title: 'New Task',
        completed: false,
        priority: 'medium',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      };

      // Mock POST request
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: newTask }),
      });

      // Mock GET request after creation
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [newTask] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No tasks yet. Create one above!')
        ).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter task title...');
      await user.type(input, 'New Task');

      const submitButton = screen.getByRole('button', { name: /add task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Task', priority: 'medium' }),
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText('New Task')).toBeInTheDocument();
      });

      // Input should be cleared after submission
      expect(input).toHaveValue('');
    });

    it('should create task with selected priority', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} }),
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No tasks yet. Create one above!')
        ).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter task title...');
      await user.type(input, 'High Priority Task');

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'high');

      const submitButton = screen.getByRole('button', { name: /add task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks',
          expect.objectContaining({
            body: JSON.stringify({
              title: 'High Priority Task',
              priority: 'high',
            }),
          })
        );
      });
    });

    it('should show error when trying to create task with empty title', async () => {
      const user = userEvent.setup();

      render(<TasksPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No tasks yet. Create one above!')
        ).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /add task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Task title cannot be empty/)
        ).toBeInTheDocument();
      });

      // Should not have made any API calls
      expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial fetch
    });

    it('should handle creation errors from API', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to create task' }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(
          screen.getByText('No tasks yet. Create one above!')
        ).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('Enter task title...');
      await user.type(input, 'Test Task');

      const submitButton = screen.getByRole('button', { name: /add task/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to create task/)).toBeInTheDocument();
      });
    });
  });

  describe('Toggle Task Completion', () => {
    it('should toggle task completion status', async () => {
      const user = userEvent.setup();

      const mockTask = {
        id: '1',
        title: 'Test Task',
        completed: false,
        priority: 'medium',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      };

      // Initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockTask] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });

      // Mock PATCH request
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockTask, completed: true } }),
      });

      // Mock GET request after update
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ ...mockTask, completed: true }] }),
      });

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/tasks/1',
          expect.objectContaining({
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: true }),
          })
        );
      });
    });

    it('should handle toggle errors from API', async () => {
      const user = userEvent.setup();

      const mockTask = {
        id: '1',
        title: 'Test Task',
        completed: false,
        priority: 'medium',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockTask] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      });

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      await waitFor(() => {
        expect(screen.getByText(/Update failed/)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Task', () => {
    it('should delete a task successfully', async () => {
      const user = userEvent.setup();

      const mockTask = {
        id: '1',
        title: 'Task to Delete',
        completed: false,
        priority: 'low',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      };

      // Initial fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockTask] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Task to Delete')).toBeInTheDocument();
      });

      // Mock DELETE request
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Task deleted successfully' }),
      });

      // Mock GET request after deletion
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/tasks/1', {
          method: 'DELETE',
        });
      });

      await waitFor(() => {
        expect(screen.queryByText('Task to Delete')).not.toBeInTheDocument();
        expect(
          screen.getByText('No tasks yet. Create one above!')
        ).toBeInTheDocument();
      });
    });

    it('should handle deletion errors from API', async () => {
      const user = userEvent.setup();

      const mockTask = {
        id: '1',
        title: 'Test Task',
        completed: false,
        priority: 'medium',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockTask] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Task')).toBeInTheDocument();
      });
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Delete failed' }),
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Delete failed/)).toBeInTheDocument();
      });
    });
  });

  describe('UI Display', () => {
    it('should display priority badges with correct colors', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'High Priority Task',
          completed: false,
          priority: 'high',
          created_at: '2024-11-08T12:00:00Z',
          updated_at: '2024-11-08T12:00:00Z',
        },
        {
          id: '2',
          title: 'Medium Priority Task',
          completed: false,
          priority: 'medium',
          created_at: '2024-11-08T11:00:00Z',
          updated_at: '2024-11-08T11:00:00Z',
        },
        {
          id: '3',
          title: 'Low Priority Task',
          completed: false,
          priority: 'low',
          created_at: '2024-11-08T10:00:00Z',
          updated_at: '2024-11-08T10:00:00Z',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockTasks }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('high')).toBeInTheDocument();
        expect(screen.getByText('medium')).toBeInTheDocument();
        expect(screen.getByText('low')).toBeInTheDocument();
      });
    });

    it('should display completed tasks with strikethrough text', async () => {
      const mockTask = {
        id: '1',
        title: 'Completed Task',
        completed: true,
        priority: 'medium',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockTask] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        const taskElement = screen.getByText('Completed Task');
        expect(taskElement).toHaveClass('line-through');
      });
    });

    it('should display creation date in readable format', async () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        completed: false,
        priority: 'medium',
        created_at: '2024-11-08T12:00:00Z',
        updated_at: '2024-11-08T12:00:00Z',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockTask] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText(/Created:/)).toBeInTheDocument();
      });
    });

    it('should display educational section for students', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      render(<TasksPage />);

      await waitFor(() => {
        expect(screen.getByText('For Students')).toBeInTheDocument();
        expect(
          screen.getByText(/This example demonstrates:/)
        ).toBeInTheDocument();
        expect(screen.getByText(/Environment Variables:/)).toBeInTheDocument();
        expect(screen.getByText(/API Routes:/)).toBeInTheDocument();
        expect(screen.getByText(/CRUD Operations:/)).toBeInTheDocument();
      });
    });
  });
});
