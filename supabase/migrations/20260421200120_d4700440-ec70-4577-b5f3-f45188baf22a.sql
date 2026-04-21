-- Mirror local da assinatura Stripe (fonte da verdade para gating no app)
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan_code text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  price_id text,
  currency text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_user_id ON public.billing_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_stripe_customer ON public.billing_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_billing_subscriptions_status ON public.billing_subscriptions(status);

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;

-- Owner-scoped read; nenhuma escrita pelo cliente
CREATE POLICY "billing_subscriptions_select_own"
  ON public.billing_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "billing_subscriptions_no_client_insert"
  ON public.billing_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "billing_subscriptions_no_client_update"
  ON public.billing_subscriptions FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "billing_subscriptions_no_client_delete"
  ON public.billing_subscriptions FOR DELETE
  TO authenticated
  USING (false);

CREATE TRIGGER trg_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Idempotência de webhooks Stripe
CREATE TABLE IF NOT EXISTS public.stripe_events_processed (
  stripe_event_id text PRIMARY KEY,
  type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ok',
  payload_hash text
);

ALTER TABLE public.stripe_events_processed ENABLE ROW LEVEL SECURITY;

-- Nenhum acesso direto pelo cliente (somente service role)
CREATE POLICY "stripe_events_no_client_access"
  ON public.stripe_events_processed FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);