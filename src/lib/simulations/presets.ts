import type { AssetClassKey, ConcentrationInputs, RebalanceInputs, SimulationInputs } from "./types";

export interface PresetDef {
  id: string;
  label: string;
  description: string;
  build: () => SimulationInputs;
}

const conservativeRebalance: RebalanceInputs = {
  mode: "rebalance",
  targetAllocation: {
    "Caixa": 10,
    "Renda Fixa": 35,
    "Tesouro": 30,
    "Fundos": 10,
    "ETF": 5,
    "Ações": 10,
  } as Partial<Record<AssetClassKey, number>>,
};

const liquidityRebalance: RebalanceInputs = {
  mode: "rebalance",
  targetAllocation: {
    "Caixa": 25,
    "Tesouro": 35,
    "Renda Fixa": 20,
    "ETF": 10,
    "Ações": 10,
  } as Partial<Record<AssetClassKey, number>>,
};

const reduceConcentration: RebalanceInputs = {
  mode: "rebalance",
  targetAllocation: {
    "Caixa": 10,
    "Renda Fixa": 25,
    "Tesouro": 20,
    "Fundos": 15,
    "ETF": 10,
    "Ações": 15,
    "Cripto": 5,
  } as Partial<Record<AssetClassKey, number>>,
};

const moveToTesouroPos: ConcentrationInputs = {
  mode: "concentration",
  targetAssetClass: "Tesouro",
  targetAssetCode: "TESOURO_POS",
  pctOfPortfolio: 80,
};

const moveToTesouroReserva: ConcentrationInputs = {
  mode: "concentration",
  targetAssetClass: "Caixa",
  targetAssetCode: "TESOURO_RESERVA",
  pctOfPortfolio: 30,
};

export const PRESETS: PresetDef[] = [
  {
    id: "move_to_tesouro_reserva",
    label: "Reserva de emergência no Tesouro Reserva",
    description: "Aloca parte da carteira no novo Tesouro Reserva (24h, 100% Selic, sem marcação a mercado).",
    build: () => moveToTesouroReserva,
  },
  {
    id: "move_to_tesouro_pos",
    label: "Mover para Tesouro pós-fixado",
    description: "Concentra a maior parte da carteira em Tesouro Selic.",
    build: () => moveToTesouroPos,
  },
  {
    id: "increase_conservative",
    label: "Aumentar exposição conservadora",
    description: "Sobe peso em Caixa, Renda Fixa e Tesouro.",
    build: () => conservativeRebalance,
  },
  {
    id: "reduce_concentration",
    label: "Reduzir concentração",
    description: "Diversifica entre classes para diluir o peso individual.",
    build: () => reduceConcentration,
  },
  {
    id: "increase_liquidity",
    label: "Aumentar liquidez",
    description: "Mais peso em ativos de liquidez D+0 / D+1.",
    build: () => liquidityRebalance,
  },
];
