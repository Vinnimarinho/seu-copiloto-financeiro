-- Lock down subscriptions table: only service_role can write
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;

-- Lock down credit_wallets: users must not be able to set their own balance
DROP POLICY IF EXISTS "Users can update own wallet" ON public.credit_wallets;

-- Allow users to read their own role (safe self-read)
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);