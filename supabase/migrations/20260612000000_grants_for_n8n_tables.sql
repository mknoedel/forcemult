-- Grants for the n8n chat tables.
--
-- On some Supabase environments (notably the local CLI stack) tables created
-- by migrations do not receive DML grants for the API roles, which makes
-- PostgREST return "permission denied for table n8n_chat_sessions" to both
-- the n8n Supabase node (service_role) and the app (anon/authenticated).
-- RLS policies from the previous migration still scope row access.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_chat_sessions TO service_role;
GRANT SELECT ON public.n8n_chat_sessions TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.n8n_chat_histories TO service_role;
GRANT SELECT ON public.n8n_chat_histories TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.n8n_chat_histories_id_seq TO service_role;
