import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import type { TaskInsert } from '@/types/supabase';

export async function GET(): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RLS scopes this to the current user's rows automatically.
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch tasks', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, metadata: { count: data?.length || 0 } });
  } catch (error) {
    logger.error('Unhandled error in GET /api/tasks', {
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as TaskInsert;

    if (!body.title || body.title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const newTask = {
      title: body.title,
      completed: body.completed ?? false,
      priority: body.priority ?? 'medium',
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create task', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    logger.error('Unhandled error in POST /api/tasks', {
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
