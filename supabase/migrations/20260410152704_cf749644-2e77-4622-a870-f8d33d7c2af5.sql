
ALTER TABLE public.investor_profiles
  ADD COLUMN approximate_patrimony TEXT,
  ADD COLUMN liquidity_need TEXT,
  ADD COLUMN preference TEXT;
