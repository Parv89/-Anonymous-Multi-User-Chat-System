CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room text NOT NULL,
  session_id text NOT NULL,
  author_name text NOT NULL,
  avatar_seed text NOT NULL DEFAULT '0',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_room_created_idx ON public.messages (room, created_at DESC);

GRANT SELECT, INSERT ON public.messages TO anon, authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read recent messages" ON public.messages
  FOR SELECT TO anon, authenticated
  USING (created_at > now() - interval '24 hours');

CREATE POLICY "Anyone can post messages" ON public.messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(content) BETWEEN 1 AND 500
    AND char_length(author_name) BETWEEN 2 AND 24
    AND char_length(session_id) BETWEEN 8 AND 64
    AND room IN ('general','confessions','advice','random','tech-talk')
  );

CREATE TABLE public.message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, session_id, emoji)
);

CREATE INDEX message_reactions_message_idx ON public.message_reactions (message_id);

GRANT SELECT, INSERT, DELETE ON public.message_reactions TO anon, authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reactions" ON public.message_reactions
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can add reactions" ON public.message_reactions
  FOR INSERT TO anon, authenticated
  WITH CHECK (char_length(emoji) <= 8 AND char_length(session_id) BETWEEN 8 AND 64);

CREATE POLICY "Anyone can remove reactions" ON public.message_reactions
  FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.enforce_message_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT count(*) INTO recent_count
  FROM public.messages
  WHERE session_id = NEW.session_id
    AND created_at > now() - interval '5 seconds';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Slow down — you are sending messages too fast.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_rate_limit
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.enforce_message_rate_limit();

CREATE OR REPLACE FUNCTION public.purge_expired_messages()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.messages WHERE created_at < now() - interval '24 hours';
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'purge-expired-chat-messages',
  '*/10 * * * *',
  $$ SELECT public.purge_expired_messages(); $$
);