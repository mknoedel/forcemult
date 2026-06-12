-- Migration: persistent n8n chat sessions + the n8n chat history memory table.
--
-- n8n_chat_sessions ties a persistent session_id to a user and a descriptive
-- name. Rows are INSERTED by the n8n workflow (service-role connection, which
-- bypasses RLS); the app only reads them.
--
-- n8n_chat_histories is the LangChain Postgres Chat Memory table that n8n's
-- AI Agent memory node writes to. We create it here (this project does not have
-- it yet) and add an ownership-scoped SELECT policy so the app can read history
-- safely from the browser client.
--
-- NOTE: this project already has an unrelated `chat_sessions` + `chat_messages`
-- pair; those are intentionally left untouched. The n8n-prefixed names avoid the
-- collision.

-- 1. The sessions table -------------------------------------------------------
CREATE TABLE n8n_chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL UNIQUE,                       -- == n8n_chat_histories.session_id
  user_id     UUID NOT NULL DEFAULT auth.uid()
                REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX n8n_chat_sessions_user_id_idx ON n8n_chat_sessions (user_id);

ALTER TABLE n8n_chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat sessions" ON n8n_chat_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat sessions" ON n8n_chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own chat sessions" ON n8n_chat_sessions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own chat sessions" ON n8n_chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 2. The n8n LangChain memory table ------------------------------------------
-- Standard schema n8n's Postgres Chat Memory node expects.
CREATE TABLE n8n_chat_histories (
  id          SERIAL PRIMARY KEY,
  session_id  VARCHAR NOT NULL,
  message     JSONB NOT NULL
);

CREATE INDEX n8n_chat_histories_session_id_idx
  ON n8n_chat_histories (session_id);

ALTER TABLE n8n_chat_histories ENABLE ROW LEVEL SECURITY;

-- A user may read a history row only if they own the session it belongs to.
CREATE POLICY "Users can read their own session history" ON n8n_chat_histories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM n8n_chat_sessions s
      WHERE s.session_id = n8n_chat_histories.session_id
        AND s.user_id = auth.uid()
    )
  );

-- 3. Realtime: let the app subscribe to n8n_chat_sessions changes -------------
ALTER PUBLICATION supabase_realtime ADD TABLE n8n_chat_sessions;
