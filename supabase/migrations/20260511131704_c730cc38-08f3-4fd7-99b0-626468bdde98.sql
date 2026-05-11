-- 1) Coluna cpf_hash em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf_hash text;

-- Índice único parcial: legado (NULL) não conflita
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_hash_unique
  ON public.profiles (cpf_hash)
  WHERE cpf_hash IS NOT NULL;

-- 2) Valida CPF (dígitos verificadores)
CREATE OR REPLACE FUNCTION public.validate_cpf(_cpf text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  digits text;
  i int;
  sum1 int := 0;
  sum2 int := 0;
  d1 int;
  d2 int;
BEGIN
  -- só dígitos
  digits := regexp_replace(coalesce(_cpf,''), '[^0-9]', '', 'g');
  IF length(digits) <> 11 THEN RETURN false; END IF;
  -- sequências inválidas (00000000000, 11111111111...)
  IF digits ~ '^(\d)\1{10}$' THEN RETURN false; END IF;

  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substr(digits, i, 1))::int * (11 - i);
  END LOOP;
  d1 := 11 - (sum1 % 11);
  IF d1 >= 10 THEN d1 := 0; END IF;
  IF d1 <> substr(digits, 10, 1)::int THEN RETURN false; END IF;

  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substr(digits, i, 1))::int * (12 - i);
  END LOOP;
  d2 := 11 - (sum2 % 11);
  IF d2 >= 10 THEN d2 := 0; END IF;
  IF d2 <> substr(digits, 11, 1)::int THEN RETURN false; END IF;

  RETURN true;
END;
$$;

-- 3) Gera hash do CPF (sha-256 + pepper opcional)
CREATE OR REPLACE FUNCTION public.hash_cpf(_cpf text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, extensions
AS $$
DECLARE
  digits text;
  pepper text;
BEGIN
  digits := regexp_replace(coalesce(_cpf,''), '[^0-9]', '', 'g');
  IF length(digits) <> 11 THEN
    RAISE EXCEPTION 'CPF inválido';
  END IF;
  -- pepper via GUC (definido pelo edge function); cai para constante segura se ausente
  pepper := coalesce(current_setting('app.cpf_pepper', true), 'lucius-cpf-pepper-v1');
  RETURN encode(extensions.digest(digits || ':' || pepper, 'sha256'), 'hex');
END;
$$;

-- 4) RPC para o usuário autenticado gravar/atualizar o próprio CPF
CREATE OR REPLACE FUNCTION public.set_user_cpf(_cpf text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  h text;
  existing uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.validate_cpf(_cpf) THEN
    RAISE EXCEPTION 'invalid_cpf';
  END IF;

  h := public.hash_cpf(_cpf);

  -- Já está vinculado a outra conta?
  SELECT user_id INTO existing
  FROM public.profiles
  WHERE cpf_hash = h AND user_id <> uid
  LIMIT 1;

  IF existing IS NOT NULL THEN
    -- audit tentativa de duplicidade
    INSERT INTO public.audit_logs (user_id, action, table_name, new_data)
    VALUES (uid, 'cpf_duplicate_attempt', 'profiles', jsonb_build_object('attempted_for', uid));
    RAISE EXCEPTION 'cpf_already_in_use';
  END IF;

  UPDATE public.profiles
  SET cpf_hash = h, updated_at = now()
  WHERE user_id = uid;

  INSERT INTO public.audit_logs (user_id, action, table_name, record_id)
  VALUES (uid, 'cpf_registered', 'profiles', uid);

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 5) Helper: usuário atual possui CPF?
CREATE OR REPLACE FUNCTION public.user_has_cpf(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND cpf_hash IS NOT NULL
  )
$$;

-- 6) Função auxiliar para edge function (service role) checar duplicidade durante signup
CREATE OR REPLACE FUNCTION public.cpf_hash_exists(_hash text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE cpf_hash = _hash)
$$;

-- 7) Grants
GRANT EXECUTE ON FUNCTION public.set_user_cpf(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_cpf(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_cpf(text) TO authenticated, anon;
REVOKE EXECUTE ON FUNCTION public.cpf_hash_exists(text) FROM PUBLIC, authenticated, anon;
-- cpf_hash_exists fica restrita ao service_role (default)