/**
 * Provider-agnostic de dados de mercado.
 *
 * A intenção é separar claramente:
 *   - dado real-time / referência (vem do provider)
 *   - hipótese do usuário (vem do form)
 *   - premissas da simulação (geradas pelo motor)
 *
 * Hoje rodamos um provider HÍBRIDO:
 *   - SELIC e IPCA  → API pública do BCB (SGS 1178 e 433)
 *   - CDI, TESOURO_POS, TESOURO_PRE, TESOURO_IPCA → tabela `market_reference_rates`
 *
 * Se o BCB falhar, o provider híbrido devolve apenas as taxas locais. Se o
 * Supabase também falhar, caímos no STATIC_FALLBACK abaixo.
 */
import { supabase } from "@/integrations/supabase/client";
import type { MarketRate } from "./types";
import { HybridMarketDataProvider } from "./HybridMarketDataProvider";

export interface MarketDataProvider {
  name: string;
  fetchRates(): Promise<MarketRate[]>;
}

class SupabaseMockProvider implements MarketDataProvider {
  name = "supabase-mock";

  async fetchRates(): Promise<MarketRate[]> {
    const { data, error } = await supabase
      .from("market_reference_rates")
      .select("code, label, annual_rate, source, reference_date, metadata");

    if (error) throw error;

    return (data ?? []).map((r) => ({
      code: r.code,
      label: r.label,
      annualRate: Number(r.annual_rate),
      source: r.source,
      referenceDate: r.reference_date,
      metadata: (r.metadata as Record<string, unknown>) ?? {},
    }));
  }
}

/** Fallback estático — usado se Supabase E BCB falharem. */
const STATIC_FALLBACK: MarketRate[] = [
  { code: "CDI",             label: "CDI",                        annualRate: 0.1115, source: "fallback", referenceDate: "", metadata: {} },
  { code: "SELIC",           label: "Selic Meta",                 annualRate: 0.1125, source: "fallback", referenceDate: "", metadata: {} },
  { code: "IPCA",            label: "IPCA (12m)",                 annualRate: 0.0450, source: "fallback", referenceDate: "", metadata: {} },
  { code: "POUPANCA",        label: "Poupança",                   annualRate: 0.0788, source: "fallback", referenceDate: "", metadata: { basis: "70%_selic_meta_quando_selic>8.5%" } },
  { code: "TESOURO_POS",     label: "Tesouro Selic (pós-fixado)", annualRate: 0.1110, source: "fallback", referenceDate: "", metadata: {} },
  { code: "TESOURO_RESERVA", label: "Tesouro Reserva",            annualRate: 0.1125, source: "fallback", referenceDate: "", metadata: { basis: "100%_selic_meta", liquidity: "D+0", launched: "2026-05-11" } },
  { code: "TESOURO_PRE",     label: "Tesouro Prefixado",          annualRate: 0.1180, source: "fallback", referenceDate: "", metadata: {} },
  { code: "TESOURO_IPCA",    label: "Tesouro IPCA+",              annualRate: 0.0625, source: "fallback", referenceDate: "", metadata: {} },
];

const ACTIVE_PROVIDER: MarketDataProvider = new HybridMarketDataProvider(
  new SupabaseMockProvider(),
);

export async function fetchMarketRates(): Promise<MarketRate[]> {
  try {
    const rates = await ACTIVE_PROVIDER.fetchRates();
    if (rates.length > 0) return rates;
    return STATIC_FALLBACK;
  } catch {
    return STATIC_FALLBACK;
  }
}

export function getRate(rates: MarketRate[], code: string): MarketRate | undefined {
  return rates.find((r) => r.code === code);
}
