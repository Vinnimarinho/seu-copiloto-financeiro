/**
 * Provider de dados de mercado consumindo a API pública do Banco Central
 * (Sistema Gerenciador de Séries Temporais — SGS).
 *
 * Endpoint:
 *   https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/1?formato=json
 *
 * Apenas SELIC e IPCA são buscados aqui. Demais códigos continuam vindo da
 * tabela local via SupabaseMockProvider — esta classe é parcial por design.
 */
import type { MarketRate } from "./types";
import type { MarketDataProvider } from "./marketDataProvider";

interface BcbSeriesPoint {
  data: string;   // "dd/MM/yyyy"
  valor: string;  // número como string, percentual
}

interface BcbSeriesConfig {
  code: string;        // código interno usado pelo motor
  label: string;       // rótulo amigável
  sgsId: number;       // id da série SGS no BCB
  /**
   * Como interpretar o valor retornado pelo BCB e convertê-lo para taxa
   * anual decimal (ex.: 0.1125 = 11,25% a.a.).
   */
  toAnnualRate: (rawPercent: number) => number;
  metadata?: Record<string, unknown>;
}

const BCB_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

/**
 * - SGS 1178: Selic — meta anualizada (% a.a.). Já vem em base anual.
 * - SGS 433:  IPCA — variação mensal (%). Convertemos para acumulado anual
 *             via composição: (1+m)^12 - 1.
 *
 * Observação: para um IPCA acumulado em 12 meses "de verdade" o ideal seria
 * a série 13522 (IPCA acum. 12m). Mantemos 433 conforme especificação,
 * anualizando o último mês como aproximação.
 */
const SERIES: BcbSeriesConfig[] = [
  {
    code: "SELIC",
    label: "Selic Meta",
    sgsId: 1178,
    toAnnualRate: (v) => v / 100,
    metadata: { sgs: 1178, basis: "anual" },
  },
  {
    code: "IPCA",
    label: "IPCA (anualizado)",
    sgsId: 433,
    toAnnualRate: (v) => Math.pow(1 + v / 100, 12) - 1,
    metadata: { sgs: 433, basis: "mensal->anual" },
  },
];

function parseBcbDateToISO(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  if (!d || !m || !y) return new Date().toISOString().slice(0, 10);
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

async function fetchSeries(cfg: BcbSeriesConfig, signal?: AbortSignal): Promise<MarketRate | null> {
  const url = `${BCB_BASE}.${cfg.sgsId}/dados/ultimos/1?formato=json`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal,
    });
    if (!res.ok) return null;

    const json = (await res.json()) as BcbSeriesPoint[];
    const point = Array.isArray(json) ? json[0] : null;
    if (!point) return null;

    const raw = Number(String(point.valor).replace(",", "."));
    if (!Number.isFinite(raw)) return null;

    return {
      code: cfg.code,
      label: cfg.label,
      annualRate: cfg.toAnnualRate(raw),
      source: "bcb-sgs",
      referenceDate: parseBcbDateToISO(point.data),
      metadata: { ...(cfg.metadata ?? {}), rawValue: raw },
    };
  } catch {
    return null;
  }
}

export class BcbMarketDataProvider implements MarketDataProvider {
  name = "bcb-sgs";

  /** Códigos que este provider sabe servir. */
  static readonly SUPPORTED_CODES = SERIES.map((s) => s.code);

  /** Timeout default por requisição. */
  private readonly timeoutMs: number;

  constructor(timeoutMs = 6000) {
    this.timeoutMs = timeoutMs;
  }

  async fetchRates(): Promise<MarketRate[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const results = await Promise.all(
        SERIES.map((cfg) => fetchSeries(cfg, controller.signal)),
      );
      return results.filter((r): r is MarketRate => r !== null);
    } finally {
      clearTimeout(timer);
    }
  }
}
