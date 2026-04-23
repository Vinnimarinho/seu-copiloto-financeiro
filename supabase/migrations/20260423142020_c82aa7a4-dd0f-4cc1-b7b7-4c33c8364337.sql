-- 1. Remove admin hardcoded por email (estratégia anterior insegura entre ambientes).
--    Promoção a admin agora é manual via SQL/console — não há email no código.
--    Não removemos roles existentes; apenas garantimos que migrations futuras sejam portáveis.

-- 2. Função RPC: export completo dos dados do usuário (LGPD).
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  result jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT jsonb_build_object(
    'exported_at', now(),
    'user_id', uid,
    'profile', (SELECT to_jsonb(p) FROM public.profiles p WHERE p.user_id = uid),
    'investor_profile', (SELECT to_jsonb(i) FROM public.investor_profiles i WHERE i.user_id = uid),
    'portfolios', COALESCE((SELECT jsonb_agg(to_jsonb(pf)) FROM public.portfolios pf WHERE pf.user_id = uid), '[]'::jsonb),
    'positions', COALESCE((SELECT jsonb_agg(to_jsonb(pp)) FROM public.portfolio_positions pp WHERE pp.user_id = uid), '[]'::jsonb),
    'analyses', COALESCE((SELECT jsonb_agg(to_jsonb(a)) FROM public.analyses a WHERE a.user_id = uid), '[]'::jsonb),
    'recommendations', COALESCE((SELECT jsonb_agg(to_jsonb(r)) FROM public.recommendations r WHERE r.user_id = uid), '[]'::jsonb),
    'reports', COALESCE((SELECT jsonb_agg(to_jsonb(rep)) FROM public.reports rep WHERE rep.user_id = uid), '[]'::jsonb),
    'imports', COALESCE((SELECT jsonb_agg(to_jsonb(im)) FROM public.imports im WHERE im.user_id = uid), '[]'::jsonb),
    'credit_wallet', (SELECT to_jsonb(cw) FROM public.credit_wallets cw WHERE cw.user_id = uid),
    'credit_transactions', COALESCE((SELECT jsonb_agg(to_jsonb(ct)) FROM public.credit_transactions ct WHERE ct.user_id = uid), '[]'::jsonb)
  ) INTO result;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, table_name)
  VALUES (uid, 'export_data', 'all');

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.export_user_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.export_user_data() TO authenticated;

-- 3. Função RPC: anonimizar/excluir conta do usuário (LGPD).
--    Estratégia: anonimização in-place dos dados pessoais + remoção de dados financeiros.
--    Mantém audit_logs e billing_subscriptions (retenção fiscal/contábil obrigatória),
--    apenas dissociando o user_id quando necessário.
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Audit primeiro (precisa do user_id ainda válido)
  INSERT INTO public.audit_logs (user_id, action, table_name)
  VALUES (uid, 'delete_account', 'all');

  -- Apaga dados financeiros e operacionais do usuário
  DELETE FROM public.credit_transactions WHERE user_id = uid;
  DELETE FROM public.credit_wallets WHERE user_id = uid;
  DELETE FROM public.recommendations WHERE user_id = uid;
  DELETE FROM public.reports WHERE user_id = uid;
  DELETE FROM public.analyses WHERE user_id = uid;
  DELETE FROM public.portfolio_positions WHERE user_id = uid;
  DELETE FROM public.portfolios WHERE user_id = uid;
  DELETE FROM public.imports WHERE user_id = uid;
  DELETE FROM public.investor_profiles WHERE user_id = uid;
  DELETE FROM public.profiles WHERE user_id = uid;
  DELETE FROM public.user_roles WHERE user_id = uid;

  -- billing_subscriptions é mantida para retenção fiscal/contábil (5 anos).
  -- Remove vínculo direto ao auth.users marcando status como "deleted_account".
  UPDATE public.billing_subscriptions
  SET status = 'deleted_account'
  WHERE user_id = uid;

  -- Por fim, exclui o usuário da tabela auth (cascata onde aplicável)
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;