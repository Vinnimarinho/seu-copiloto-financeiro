-- Migration corretiva final: neutraliza qualquer dependência de admin hardcoded.
-- A migration antiga (20260413115641_*) continha um INSERT seed que promovia
-- 'viniciusameixa@gmail.com' a admin. Esta migration:
--   1. Remove definitivamente esse role caso ainda exista
--   2. Documenta que promoção a admin é MANUAL daqui em diante
--   3. É idempotente — pode ser reaplicada sem efeito colateral

-- 1. Remove o admin seed (idempotente)
DELETE FROM public.user_roles
WHERE role = 'admin'
  AND user_id IN (
    SELECT id FROM auth.users WHERE email = 'viniciusameixa@gmail.com'
  );

-- 2. Documentação do schema reforçada
COMMENT ON TABLE public.user_roles IS
  'RBAC. Promoção a admin é MANUAL e auditada. Use:
   INSERT INTO public.user_roles (user_id, role)
   VALUES (''<uuid_do_usuario>'', ''admin'');
   Nunca usar seed por email em migration.';

COMMENT ON COLUMN public.user_roles.role IS
  'app_role enum. ''admin'' deve ser atribuído manualmente após validação operacional.';