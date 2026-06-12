-- Migration: create the tasks table, scoped to the signed-in user.
--
-- This is the single source of truth for the bundled Tasks example schema.
-- It matches types/supabase.ts. Apply it via the Supabase MCP
-- (apply_migration), `supabase db push`, or by pasting it into the Supabase
-- SQL Editor. See SUPABASE_SETUP.md.

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS).
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Per-user policies: each user can only see and modify their own tasks.
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);
