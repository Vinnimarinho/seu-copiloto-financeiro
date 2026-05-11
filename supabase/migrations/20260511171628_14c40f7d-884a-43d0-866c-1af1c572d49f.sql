
-- Trial de 10 dias para plano gratuito
CREATE OR REPLACE FUNCTION public.user_trial_status(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := _user_id;
  signup_at timestamptz;
  plan text := 'free';
  sub_status text := 'inactive';
  sub_period_end timestamptz;
  trial_end timestamptz;
  is_paid boolean := false;
  expired boolean := false;
  days_left int;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;

  SELECT created_at INTO signup_at FROM auth.users WHERE id = uid;
  IF signup_at IS NULL THEN RETURN jsonb_build_object('error','user_not_found'); END IF;

  SELECT plan_code, status, current_period_end
    INTO plan, sub_status, sub_period_end
  FROM public.billing_subscriptions WHERE user_id = uid;

  IF plan IN ('essencial','pro')
     AND sub_status IN ('active','trialing')
     AND (sub_period_end IS NULL OR sub_period_end > now())
  THEN
    is_paid := true;
  END IF;

  trial_end := signup_at + interval '10 days';
  days_left := GREATEST(0, EXTRACT(EPOCH FROM (trial_end - now()))/86400)::int;
  expired := (NOT is_paid) AND now() > trial_end;

  RETURN jsonb_build_object(
    'is_paid', is_paid,
    'plan', COALESCE(plan,'free'),
    'signup_at', signup_at,
    'trial_end', trial_end,
    'days_left', days_left,
    'trial_expired', expired
  );
END;
$$;

-- Adiciona créditos via service role (compras de pacotes avulsos)
CREATE OR REPLACE FUNCTION public.add_credits(
  _user_id uuid,
  _amount int,
  _reference_id uuid,
  _description text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wid uuid;
  new_balance int;
BEGIN
  IF _amount <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  -- Garante carteira
  INSERT INTO public.credit_wallets (user_id, balance)
  VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.credit_wallets
     SET balance = balance + _amount, updated_at = now()
   WHERE user_id = _user_id
   RETURNING id, balance INTO wid, new_balance;

  INSERT INTO public.credit_transactions
    (user_id, wallet_id, type, amount, resulting_balance, description, reference_id, reference_type)
  VALUES
    (_user_id, wid, 'purchase', _amount, new_balance, _description, _reference_id, 'stripe_checkout');

  RETURN jsonb_build_object('ok', true, 'balance', new_balance);
END;
$$;

-- Garante unicidade do user_id em credit_wallets para o ON CONFLICT funcionar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='credit_wallets_user_id_key'
  ) THEN
    BEGIN
      ALTER TABLE public.credit_wallets ADD CONSTRAINT credit_wallets_user_id_key UNIQUE (user_id);
    EXCEPTION WHEN duplicate_table THEN NULL;
    END;
  END IF;
END $$;
