-- Revoga o admin "seed por email" da migration antiga (20260413115641_*).
-- Em ambientes novos, esta migration garante que ninguém é promovido a admin
-- automaticamente via email hardcoded. Promoção a admin agora é manual via SQL
-- direto no painel de admin ou script documentado.

-- Remove role admin de qualquer usuário cujo email == 'viniciusameixa@gmail.com'
-- (caso o seed tenha rodado em algum ambiente). É idempotente.
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (
    SELECT id FROM auth.users WHERE email = 'viniciusameixa@gmail.com'
  );

-- Comentário documental para futuras leituras do schema.
COMMENT ON TABLE public.user_roles IS
  'RBAC. Atribuição de admin é MANUAL: INSERT INTO public.user_roles (user_id, role) VALUES (''<uuid>'', ''admin''). Nunca via seed por email em migration.';