-- 1) Enum para modos de simulação
DO $$ BEGIN
  CREATE TYPE public.simulation_mode AS ENUM ('swap', 'rebalance', 'concentration');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Tabela principal de simulações
CREATE TABLE IF NOT EXISTS public.scenario_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  portfolio_id uuid,
  name text NOT NULL DEFAULT 'Simulação',
  mode public.simulation_mode NOT NULL DEFAULT 'swap',
  preset text,
  user_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  assumptions jsonb NOT NULL DEFAULT '{}'::jsonb,
  baseline_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  scenario_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  results jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scenario_simulations_user
  ON public.scenario_simulations(user_id, created_at DESC);

ALTER TABLE public.scenario_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own simulations"
  ON public.scenario_simulations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations"
  ON public.scenario_simulations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations"
  ON public.scenario_simulations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own simulations"
  ON public.scenario_simulations FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_scenario_simulations_updated_at
  BEFORE UPDATE ON public.scenario_simulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Taxas de referência de mercado
CREATE TABLE IF NOT EXISTS public.market_reference_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL,
  annual_rate numeric NOT NULL,
  source text NOT NULL DEFAULT 'mock',
  reference_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_reference_rates ENABLE ROW LEVEL SECURITY;

-- Leitura para qualquer usuário autenticado
CREATE POLICY "Authenticated can read market rates"
  ON public.market_reference_rates FOR SELECT
  TO authenticated
  USING (true);

-- Sem escrita pelo client; apenas service_role/edge function
CREATE POLICY "No client insert market rates"
  ON public.market_reference_rates FOR INSERT
  TO authenticated WITH CHECK (false);

CREATE POLICY "No client update market rates"
  ON public.market_reference_rates FOR UPDATE
  TO authenticated USING (false);

CREATE POLICY "No client delete market rates"
  ON public.market_reference_rates FOR DELETE
  TO authenticated USING (false);

CREATE TRIGGER trg_market_reference_rates_updated_at
  BEFORE UPDATE ON public.market_reference_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed inicial (mock realista — substituível depois por API externa)
INSERT INTO public.market_reference_rates (code, label, annual_rate, source, metadata) VALUES
  ('CDI',           'CDI',                          0.1115, 'mock', '{"unit":"a.a."}'::jsonb),
  ('SELIC',         'Selic Meta',                   0.1125, 'mock', '{"unit":"a.a."}'::jsonb),
  ('IPCA',          'IPCA (12m)',                   0.0450, 'mock', '{"unit":"a.a."}'::jsonb),
  ('TESOURO_POS',   'Tesouro Selic (pós-fixado)',   0.1110, 'mock', '{"unit":"a.a.","spread":-0.0015}'::jsonb),
  ('TESOURO_PRE',   'Tesouro Prefixado',            0.1180, 'mock', '{"unit":"a.a."}'::jsonb),
  ('TESOURO_IPCA',  'Tesouro IPCA+',                0.0625, 'mock', '{"unit":"a.a.+IPCA"}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- 4) Bucket privado para PDFs de simulação
INSERT INTO storage.buckets (id, name, public)
VALUES ('simulation-reports', 'simulation-reports', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can read own simulation reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'simulation-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own simulation reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'simulation-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own simulation reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'simulation-reports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );