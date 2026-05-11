
REVOKE ALL ON FUNCTION public.add_credits(uuid,int,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid,int,uuid,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.user_trial_status(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_trial_status(uuid) TO authenticated, service_role;
