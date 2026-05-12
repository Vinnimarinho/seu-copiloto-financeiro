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
  is_admin boolean := false;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('error','not_authenticated'); END IF;

  SELECT created_at INTO signup_at FROM auth.users WHERE id = uid;
  IF signup_at IS NULL THEN RETURN jsonb_build_object('error','user_not_found'); END IF;

  -- Override admin: acesso Pro completo, sem trial
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = uid AND role = 'admin'
  ) INTO is_admin;

  IF is_admin THEN
    RETURN jsonb_build_object(
      'is_paid', true,
      'plan', 'pro',
      'signup_at', signup_at,
      'trial_end', now() + interval '3650 days',
      'days_left', 3650,
      'trial_expired', false
    );
  END IF;

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