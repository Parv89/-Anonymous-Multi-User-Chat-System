REVOKE EXECUTE ON FUNCTION public.enforce_message_rate_limit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.purge_expired_messages() FROM anon, authenticated, public;