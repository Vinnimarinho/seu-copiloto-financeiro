
-- Backfill: create profiles for existing users who don't have one
INSERT INTO public.profiles (user_id)
SELECT id FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
ON CONFLICT DO NOTHING;

-- Backfill: create investor_profiles for existing users
INSERT INTO public.investor_profiles (user_id)
SELECT id FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.investor_profiles ip WHERE ip.user_id = u.id)
ON CONFLICT DO NOTHING;

-- Backfill: create subscriptions for existing users
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT id, 'free', 'active' FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id)
ON CONFLICT DO NOTHING;

-- Backfill: create credit_wallets for existing users
INSERT INTO public.credit_wallets (user_id, balance)
SELECT id, 5 FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.credit_wallets cw WHERE cw.user_id = u.id)
ON CONFLICT DO NOTHING;

-- Allow service role to update credit_wallets (needed by edge function)
CREATE POLICY "Service role can update wallets"
ON public.credit_wallets
FOR UPDATE
USING (true)
WITH CHECK (true);
