INSERT INTO public.market_reference_rates
  (code, label, annual_rate, source, reference_date, frequency, metadata)
VALUES
  ('TESOURO_RESERVA', 'Tesouro Reserva', 0.144, 'seed-derived-selic', CURRENT_DATE, 'daily',
   '{"basis":"100%_selic_meta","liquidity":"D+0","launched":"2026-05-11","note":"derivado da Selic; sem marcação a mercado"}'::jsonb),
  ('POUPANCA', 'Poupança', 0.1008, 'seed-derived-selic', CURRENT_DATE, 'monthly',
   '{"basis":"70%_selic_meta_quando_selic>8.5%","liquidity":"D+0_aniversario"}'::jsonb)
ON CONFLICT (code) DO NOTHING;