import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { TaskUpdate } from '@/types/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as TaskUpdate;
    const { id } = await params;

    if (body.title !== undefined && body.title.trim() === '') {
      return NextResponse.json(
        { error: 'Title cannot be empty' },
        { status: 400 }
      );
    }

    const updateData: TaskUpdate = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    // RLS ensures the user can only update their own task.
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update task', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error('Unhandled error in PATCH /api/tasks/[id]', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // RLS ensures the user can only delete their own task.
    const { error } = await supabase.from('tasks').delete().eq('id', id);

    if (error) {
      logger.error('Failed to delete task', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to delete task', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Unhandled error in DELETE /api/tasks/[id]', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
