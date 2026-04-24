/**
 * Tipos compartilhados da feature Simulações de Cenários.
 * Toda a feature respeita a regra de compliance: NUNCA usar a palavra "recomendação".
 * Use sempre: simulação, cenário, projeção estimada, impacto potencial.
 */

export type SimulationMode = "swap" | "rebalance" | "concentration";

export type SimulationPreset =
  | "move_to_tesouro_pos"
  | "increase_conservative"
  | "reduce_concentration"
  | "increase_liquidity"
  | "custom";

export type LiquidityBucket = "D+0" | "D+1" | "D+30" | "D+90" | "D+360";

export type AssetClassKey =
  | "Caixa"
  | "Renda Fixa"
  | "Tesouro"
  | "Fundos"
  | "ETF"
  | "Ações"
  | "Cripto"
  | "Outros";

export interface PortfolioAggregate {
  totalValue: number;
  byClass: Record<string, number>;
  byLiquidity: Record<LiquidityBucket, number>;
  topConcentrationPct: number; // 0..1
  weightedYieldAnnual: number; // 0..1 — projeção estimada
  weightedRiskScore: number; // 0..100
}

export interface MarketRate {
  code: string;
  label: string;
  annualRate: number; // 0..1
  source: string;
  referenceDate: string;
  metadata: Record<string, unknown>;
}

export interface SwapInputs {
  mode: "swap";
  fromPositionId: string;
  amount: number; // valor em R$
  amountIsPercent?: boolean; // se true, "amount" é 0..100 do valor da posição
  toAssetClass: AssetClassKey;
  toAssetCode?: string; // ex.: "TESOURO_POS"
}

export interface RebalanceInputs {
  mode: "rebalance";
  targetAllocation: Partial<Record<AssetClassKey, number>>; // soma <= 100
}

export interface ConcentrationInputs {
  mode: "concentration";
  targetAssetCode: string; // ex.: "TESOURO_POS"
  targetAssetClass: AssetClassKey;
  pctOfPortfolio: number; // 0..100
}

export type SimulationInputs = SwapInputs | RebalanceInputs | ConcentrationInputs;

export interface SimulationAssumptions {
  horizonMonths: number;
  ratesUsed: MarketRate[];
  notes: string[];
}

export interface SimulationResult {
  baseline: PortfolioAggregate;
  scenario: PortfolioAggregate;
  delta: {
    yieldAnnualPct: number; // pp
    estimatedReturn12m: number; // R$
    liquidityScore: number; // -100..100 (positivo = mais líquido)
    concentrationPct: number; // pp
    riskScore: number; // -100..100 (positivo = mais risco)
  };
}

export interface ScenarioSimulationRow {
  id: string;
  user_id: string;
  portfolio_id: string | null;
  name: string;
  mode: SimulationMode;
  preset: string | null;
  user_inputs: SimulationInputs | Record<string, unknown>;
  assumptions: SimulationAssumptions | Record<string, unknown>;
  baseline_snapshot: PortfolioAggregate | Record<string, unknown>;
  scenario_snapshot: PortfolioAggregate | Record<string, unknown>;
  results: SimulationResult | Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
