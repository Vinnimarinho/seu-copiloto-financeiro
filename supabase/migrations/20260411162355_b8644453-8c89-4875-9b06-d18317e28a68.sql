
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can update wallets" ON public.credit_wallets;

-- Create a proper user-scoped update policy
CREATE POLICY "Users can update own wallet"
ON public.credit_wallets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
