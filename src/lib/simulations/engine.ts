/**
 * Motor de cálculo das Simulações de Cenários.
 *
 * Separa premissas, hipótese do usuário e dados de mercado. Todos os números
 * são PROJEÇÕES ESTIMADAS — nunca garantia de retorno. A camada de UI deve
 * sempre exibir o aviso de compliance.
 */
import type {
  AssetClassKey,
  ConcentrationInputs,
  LiquidityBucket,
  MarketRate,
  PortfolioAggregate,
  RebalanceInputs,
  SimulationAssumptions,
  SimulationInputs,
  SimulationResult,
  SwapInputs,
} from "./types";
import { getRate } from "./marketDataProvider";

interface PositionLike {
  id: string;
  ticker: string;
  name: string;
  asset_class: string;
  quantity: number;
  avg_price: number;
  current_value: number | null;
  current_price: number | null;
  liquidity: string | null;
}

const RISK_BY_CLASS: Record<string, number> = {
  Caixa: 5,
  "Renda Fixa": 20,
  Tesouro: 15,
  Fundos: 45,
  ETF: 55,
  Ações: 75,
  Cripto: 90,
  Outros: 50,
};

const DEFAULT_YIELD_BY_CLASS: Record<string, number> = {
  Caixa: 0.005,
  "Renda Fixa": 0.105,
  Tesouro: 0.111,
  Fundos: 0.09,
  ETF: 0.11,
  Ações: 0.13,
  Cripto: 0.18,
  Outros: 0.08,
};

export function positionValue(p: PositionLike): number {
  if (p.current_value && p.current_value > 0) return Number(p.current_value);
  const price = p.current_price ?? p.avg_price ?? 0;
  return Number(price) * Number(p.quantity ?? 0);
}

function bucketLiquidity(raw: string | null | undefined): LiquidityBucket {
  if (!raw) return "D+1";
  const v = raw.toUpperCase();
  if (v.includes("D+0") || v === "D0") return "D+0";
  if (v.includes("D+1")) return "D+1";
  if (v.includes("D+30")) return "D+30";
  if (v.includes("D+90")) return "D+90";
  return "D+360";
}

function classifyClass(c: string): AssetClassKey {
  const known: AssetClassKey[] = [
    "Caixa",
    "Renda Fixa",
    "Tesouro",
    "Fundos",
    "ETF",
    "Ações",
    "Cripto",
    "Outros",
  ];
  return (known.find((k) => k.toLowerCase() === c.toLowerCase()) ?? "Outros") as AssetClassKey;
}

export function aggregatePortfolio(
  positions: PositionLike[],
  rates: MarketRate[],
): PortfolioAggregate {
  const byClass: Record<string, number> = {};
  const byLiquidity: Record<LiquidityBucket, number> = {
    "D+0": 0,
    "D+1": 0,
    "D+30": 0,
    "D+90": 0,
    "D+360": 0,
  };

  let total = 0;
  let weightedYield = 0;
  let weightedRisk = 0;
  let topValue = 0;

  for (const p of positions) {
    const v = positionValue(p);
    if (v <= 0) continue;
    total += v;
    const cls = classifyClass(p.asset_class);
    byClass[cls] = (byClass[cls] ?? 0) + v;
    byLiquidity[bucketLiquidity(p.liquidity)] += v;
    weightedYield += v * (DEFAULT_YIELD_BY_CLASS[cls] ?? 0.08);
    weightedRisk += v * (RISK_BY_CLASS[cls] ?? 50);
    if (v > topValue) topValue = v;
  }

  // Ajuste leve do yield de Renda Fixa/Tesouro com base em CDI atual
  const cdi = getRate(rates, "CDI")?.annualRate;
  if (cdi && total > 0) {
    const adj = (cdi - 0.1115) * (byClass["Renda Fixa"] ?? 0);
    weightedYield += adj;
  }

  return {
    totalValue: total,
    byClass,
    byLiquidity,
    topConcentrationPct: total > 0 ? topValue / total : 0,
    weightedYieldAnnual: total > 0 ? weightedYield / total : 0,
    weightedRiskScore: total > 0 ? weightedRisk / total : 0,
  };
}

function liquidityScore(agg: PortfolioAggregate): number {
  // 0..100 — quanto mais peso em D+0/D+1, maior o score
  if (agg.totalValue <= 0) return 0;
  const w =
    agg.byLiquidity["D+0"] * 1.0 +
    agg.byLiquidity["D+1"] * 0.9 +
    agg.byLiquidity["D+30"] * 0.5 +
    agg.byLiquidity["D+90"] * 0.25 +
    agg.byLiquidity["D+360"] * 0.05;
  return Math.round((w / agg.totalValue) * 100);
}

function yieldForDestination(
  toAssetCode: string | undefined,
  toClass: AssetClassKey,
  rates: MarketRate[],
): number {
  if (toAssetCode) {
    const r = getRate(rates, toAssetCode);
    if (r) return r.annualRate;
  }
  return DEFAULT_YIELD_BY_CLASS[toClass] ?? 0.08;
}

function applySwap(
  positions: PositionLike[],
  rates: MarketRate[],
  input: SwapInputs,
): { newAgg: PortfolioAggregate; assumptions: SimulationAssumptions } {
  const baseline = aggregatePortfolio(positions, rates);
  const target = positions.find((p) => p.id === input.fromPositionId);
  if (!target) {
    return {
      newAgg: baseline,
      assumptions: {
        horizonMonths: 12,
        ratesUsed: rates,
        notes: ["Posição de origem não encontrada — cenário sem efeito."],
      },
    };
  }

  const targetValue = positionValue(target);
  const moveValue = input.amountIsPercent
    ? Math.min(targetValue, targetValue * (input.amount / 100))
    : Math.min(targetValue, input.amount);

  if (moveValue <= 0 || baseline.totalValue <= 0) {
    return {
      newAgg: baseline,
      assumptions: { horizonMonths: 12, ratesUsed: rates, notes: ["Valor a movimentar é zero."] },
    };
  }

  const fromClass = classifyClass(target.asset_class);
  const toClass = input.toAssetClass;

  // Recalcula agregados manualmente sem precisar mutar positions
  const newByClass = { ...baseline.byClass };
  newByClass[fromClass] = Math.max(0, (newByClass[fromClass] ?? 0) - moveValue);
  newByClass[toClass] = (newByClass[toClass] ?? 0) + moveValue;

  // Liquidez do destino: Tesouro pós/Caixa = D+1; outros mantidos D+30 médio
  const destBucket: LiquidityBucket =
    toClass === "Caixa" || input.toAssetCode === "TESOURO_POS" ? "D+1" : "D+30";
  const fromBucket = bucketLiquidity(target.liquidity);
  const newByLiq = { ...baseline.byLiquidity };
  newByLiq[fromBucket] = Math.max(0, newByLiq[fromBucket] - moveValue);
  newByLiq[destBucket] = (newByLiq[destBucket] ?? 0) + moveValue;

  // Recalcula yield e risco ponderado
  const total = baseline.totalValue;
  const newYield =
    baseline.weightedYieldAnnual * total -
    moveValue * (DEFAULT_YIELD_BY_CLASS[fromClass] ?? 0.08) +
    moveValue * yieldForDestination(input.toAssetCode, toClass, rates);
  const newRisk =
    baseline.weightedRiskScore * total -
    moveValue * (RISK_BY_CLASS[fromClass] ?? 50) +
    moveValue * (RISK_BY_CLASS[toClass] ?? 50);

  // Recalcula concentração: aproximamos top como max(byClass)
  const topClassValue = Math.max(...Object.values(newByClass));

  const newAgg: PortfolioAggregate = {
    totalValue: total,
    byClass: newByClass,
    byLiquidity: newByLiq,
    topConcentrationPct: total > 0 ? topClassValue / total : 0,
    weightedYieldAnnual: total > 0 ? newYield / total : 0,
    weightedRiskScore: total > 0 ? newRisk / total : 0,
  };

  const usedCodes = ["CDI", input.toAssetCode].filter(Boolean) as string[];
  const ratesUsed = rates.filter((r) => usedCodes.includes(r.code));

  return {
    newAgg,
    assumptions: {
      horizonMonths: 12,
      ratesUsed,
      notes: [
        "Projeção estimada com base em parâmetros de mercado de referência.",
        "Premissa: realocação imediata, sem custos de transação ou impostos.",
        `Movimentação simulada: R$ ${moveValue.toFixed(2)} de ${fromClass} para ${toClass}.`,
      ],
    },
  };
}

function applyRebalance(
  positions: PositionLike[],
  rates: MarketRate[],
  input: RebalanceInputs,
): { newAgg: PortfolioAggregate; assumptions: SimulationAssumptions } {
  const baseline = aggregatePortfolio(positions, rates);
  const total = baseline.totalValue;
  if (total <= 0) {
    return { newAgg: baseline, assumptions: { horizonMonths: 12, ratesUsed: rates, notes: [] } };
  }

  const sumPct = Object.values(input.targetAllocation).reduce((a, b) => a + (b ?? 0), 0);
  const norm = sumPct > 0 ? sumPct / 100 : 1;

  const newByClass: Record<string, number> = {};
  let newYield = 0;
  let newRisk = 0;
  for (const [cls, pct] of Object.entries(input.targetAllocation) as [AssetClassKey, number][]) {
    const v = total * (pct / 100) / norm;
    newByClass[cls] = v;
    newYield += v * (DEFAULT_YIELD_BY_CLASS[cls] ?? 0.08);
    newRisk += v * (RISK_BY_CLASS[cls] ?? 50);
  }

  // Liquidez aproximada por classe
  const liqMap: Record<AssetClassKey, LiquidityBucket> = {
    Caixa: "D+0",
    "Renda Fixa": "D+30",
    Tesouro: "D+1",
    Fundos: "D+30",
    ETF: "D+1",
    Ações: "D+1",
    Cripto: "D+0",
    Outros: "D+30",
  };
  const newByLiq: Record<LiquidityBucket, number> = {
    "D+0": 0,
    "D+1": 0,
    "D+30": 0,
    "D+90": 0,
    "D+360": 0,
  };
  for (const [cls, v] of Object.entries(newByClass)) {
    newByLiq[liqMap[cls as AssetClassKey] ?? "D+30"] += v;
  }

  const topClassValue = Math.max(...Object.values(newByClass), 0);

  return {
    newAgg: {
      totalValue: total,
      byClass: newByClass,
      byLiquidity: newByLiq,
      topConcentrationPct: total > 0 ? topClassValue / total : 0,
      weightedYieldAnnual: newYield / total,
      weightedRiskScore: newRisk / total,
    },
    assumptions: {
      horizonMonths: 12,
      ratesUsed: rates,
      notes: [
        "Rebalanceamento simulado proporcionalmente ao valor total atual.",
        "Liquidez por classe é uma aproximação típica de mercado.",
      ],
    },
  };
}

function applyConcentration(
  positions: PositionLike[],
  rates: MarketRate[],
  input: ConcentrationInputs,
): { newAgg: PortfolioAggregate; assumptions: SimulationAssumptions } {
  const baseline = aggregatePortfolio(positions, rates);
  const total = baseline.totalValue;
  const concentrated = total * (Math.min(100, Math.max(0, input.pctOfPortfolio)) / 100);
  const remaining = total - concentrated;

  const newByClass: Record<string, number> = { [input.targetAssetClass]: concentrated };
  // Distribui o restante proporcionalmente nas classes existentes (ex-target)
  const baseTotalEx = Object.entries(baseline.byClass)
    .filter(([c]) => c !== input.targetAssetClass)
    .reduce((a, [, v]) => a + v, 0);

  if (baseTotalEx > 0) {
    for (const [cls, v] of Object.entries(baseline.byClass)) {
      if (cls === input.targetAssetClass) continue;
      newByClass[cls] = (newByClass[cls] ?? 0) + (v / baseTotalEx) * remaining;
    }
  }

  let newYield = 0;
  let newRisk = 0;
  for (const [cls, v] of Object.entries(newByClass)) {
    const k = cls as AssetClassKey;
    const y =
      cls === input.targetAssetClass
        ? yieldForDestination(input.targetAssetCode, k, rates)
        : DEFAULT_YIELD_BY_CLASS[k] ?? 0.08;
    newYield += v * y;
    newRisk += v * (RISK_BY_CLASS[k] ?? 50);
  }

  // Liquidez do alvo
  const destBucket: LiquidityBucket =
    input.targetAssetClass === "Caixa" || input.targetAssetCode === "TESOURO_POS"
      ? "D+1"
      : "D+30";
  const newByLiq = { ...baseline.byLiquidity };
  newByLiq[destBucket] = (newByLiq[destBucket] ?? 0) + concentrated;

  const topClassValue = Math.max(...Object.values(newByClass), 0);

  return {
    newAgg: {
      totalValue: total,
      byClass: newByClass,
      byLiquidity: newByLiq,
      topConcentrationPct: total > 0 ? topClassValue / total : 0,
      weightedYieldAnnual: total > 0 ? newYield / total : 0,
      weightedRiskScore: total > 0 ? newRisk / total : 0,
    },
    assumptions: {
      horizonMonths: 12,
      ratesUsed: rates.filter((r) => r.code === input.targetAssetCode || r.code === "CDI"),
      notes: [
        `Concentração simulada: ${input.pctOfPortfolio.toFixed(0)}% em ${input.targetAssetClass}.`,
        "Demais classes mantidas proporcionalmente.",
      ],
    },
  };
}

export function simulate(
  positions: PositionLike[],
  rates: MarketRate[],
  input: SimulationInputs,
): { result: SimulationResult; assumptions: SimulationAssumptions } {
  const baseline = aggregatePortfolio(positions, rates);
  let scenario: PortfolioAggregate;
  let assumptions: SimulationAssumptions;

  switch (input.mode) {
    case "swap": {
      const r = applySwap(positions, rates, input);
      scenario = r.newAgg;
      assumptions = r.assumptions;
      break;
    }
    case "rebalance": {
      const r = applyRebalance(positions, rates, input);
      scenario = r.newAgg;
      assumptions = r.assumptions;
      break;
    }
    case "concentration": {
      const r = applyConcentration(positions, rates, input);
      scenario = r.newAgg;
      assumptions = r.assumptions;
      break;
    }
  }

  const baselineLiq = liquidityScore(baseline);
  const scenarioLiq = liquidityScore(scenario);

  const result: SimulationResult = {
    baseline,
    scenario,
    delta: {
      yieldAnnualPct: (scenario.weightedYieldAnnual - baseline.weightedYieldAnnual) * 100,
      estimatedReturn12m:
        scenario.totalValue * scenario.weightedYieldAnnual -
        baseline.totalValue * baseline.weightedYieldAnnual,
      liquidityScore: scenarioLiq - baselineLiq,
      concentrationPct: (scenario.topConcentrationPct - baseline.topConcentrationPct) * 100,
      riskScore: scenario.weightedRiskScore - baseline.weightedRiskScore,
    },
  };

  return { result, assumptions };
}

export const liquidityScoreOf = liquidityScore;
