-- Remove the INSERT policy on credit_wallets since wallets are created 
-- exclusively by the handle_new_user() trigger (SECURITY DEFINER).
-- Users should never insert wallet rows directly.
DROP POLICY IF EXISTS "Users can insert own wallet" ON public.credit_wallets;