'use client';

import { useState, useEffect } from 'react';
import type { Task } from '@/types/supabase';
import { TaskItem } from '../components/tasks/TaskItem';
import { StudentsInfoCard } from '../components/tasks/StudentsInfoCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageHero } from '../components/PageHero';
import { PageShell } from '../components/PageShell';
import { Card, CardContent } from '@/components/ui/card';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<
    'low' | 'medium' | 'high'
  >('medium');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/tasks');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tasks');
      }

      setTasks(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();

    if (!newTaskTitle.trim()) {
      setError('Task title cannot be empty');
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          priority: newTaskPriority,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create task');
      }

      setNewTaskTitle('');
      setNewTaskPriority('medium');
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleToggleComplete(task: Task) {
    try {
      setError(null);
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update task');
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete task');
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Supabase · CRUD"
        title={
          <>
            Supabase{' '}
            <span className="font-serif font-normal italic text-primary">
              Tasks
            </span>
          </>
        }
        subtitle="This is a sample integration showing how to connect to Supabase and perform CRUD operations."
      />
      <Card className="border-2 border-foreground rounded-2xl shadow-hard">
        <CardContent className="pt-6">
          {error && (
            <div className="mb-6 rounded-xl border-2 border-destructive/40 bg-destructive/10 p-4 text-destructive">
              <strong>Error:</strong> {error}
            </div>
          )}

          <form
            onSubmit={handleCreateTask}
            className="mb-8 rounded-2xl border-2 border-foreground bg-muted/50 p-6"
          >
            <h2 className="font-display text-xl font-semibold mb-4">
              Create New Task
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title..."
                className="flex-1"
              />
              <Select
                value={newTaskPriority}
                onChange={(e) =>
                  setNewTaskPriority(
                    e.target.value as 'low' | 'medium' | 'high'
                  )
                }
                className="sm:w-44"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </Select>
              <Button type="submit">Add Task</Button>
            </div>
          </form>

          <div>
            <h2 className="font-display text-xl font-semibold mb-4">
              Tasks ({tasks.length})
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading tasks...</p>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-foreground bg-muted/50">
                <p className="text-muted-foreground text-lg">
                  No tasks yet. Create one above!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={handleToggleComplete}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <StudentsInfoCard />
    </PageShell>
  );
}
