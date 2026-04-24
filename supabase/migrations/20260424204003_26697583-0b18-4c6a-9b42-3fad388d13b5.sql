ALTER TABLE public.market_reference_rates
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'unknown';