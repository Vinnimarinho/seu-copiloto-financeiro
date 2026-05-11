CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, cpf_hash)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NULLIF(NEW.raw_user_meta_data ->> 'cpf_hash', '')
  );

  INSERT INTO public.investor_profiles (user_id) VALUES (NEW.id);
  INSERT INTO public.subscriptions (user_id, plan, status) VALUES (NEW.id, 'free', 'active');
  INSERT INTO public.credit_wallets (user_id, balance) VALUES (NEW.id, 5);

  RETURN NEW;
END;
$$;