/**
 * Provider híbrido — combina dados reais do BCB com dados locais (seed) da
 * tabela `market_reference_rates`.
 *
 * Estratégia:
 *   1. Busca todas as taxas locais (CDI, TESOURO_*, e fallback de SELIC/IPCA).
 *   2. Busca SELIC e IPCA no BCB em paralelo.
 *   3. Se o BCB responder, sobrescreve os códigos correspondentes.
 *   4. Se o BCB falhar, mantém o que veio do provider local.
 *
 * Importante: nada quebra se qualquer um dos lados falhar — sempre devolvemos
 * pelo menos o que conseguimos coletar.
 */
import type { MarketRate } from "./types";
import type { MarketDataProvider } from "./marketDataProvider";
import { BcbMarketDataProvider } from "./BcbMarketDataProvider";

export class HybridMarketDataProvider implements MarketDataProvider {
  name = "hybrid-bcb+local";

  constructor(
    private readonly localProvider: MarketDataProvider,
    private readonly bcbProvider: MarketDataProvider = new BcbMarketDataProvider(),
    /** Códigos que devem ser sobrescritos pelo BCB quando disponíveis. */
    private readonly bcbOverrides: readonly string[] = BcbMarketDataProvider.SUPPORTED_CODES,
  ) {}

  async fetchRates(): Promise<MarketRate[]> {
    const [localResult, bcbResult] = await Promise.allSettled([
      this.localProvider.fetchRates(),
      this.bcbProvider.fetchRates(),
    ]);

    const localRates: MarketRate[] =
      localResult.status === "fulfilled" ? localResult.value : [];

    const bcbRates: MarketRate[] =
      bcbResult.status === "fulfilled" ? bcbResult.value : [];

    if (bcbRates.length === 0) return localRates;

    const overrideSet = new Set(this.bcbOverrides);
    const bcbByCode = new Map(bcbRates.map((r) => [r.code, r]));

    const merged: MarketRate[] = localRates.map((local) => {
      if (overrideSet.has(local.code) && bcbByCode.has(local.code)) {
        return bcbByCode.get(local.code)!;
      }
      return local;
    });

    // Adiciona códigos do BCB que ainda não existiam no provider local.
    const localCodes = new Set(localRates.map((r) => r.code));
    for (const r of bcbRates) {
      if (overrideSet.has(r.code) && !localCodes.has(r.code)) {
        merged.push(r);
      }
    }

    return merged;
  }
}
