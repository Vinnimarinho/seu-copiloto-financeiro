/**
 * Slytherin-themed investor profile categories
 * Maps risk_tolerance to themed names with descriptions
 */

export interface InvestorCategory {
  name: string;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

const INVESTOR_CATEGORIES: Record<string, InvestorCategory> = {
  conservador: {
    name: "Herdeiro de Gringotes",
    title: "Conservador",
    emoji: "🏦",
    description: "Protege o patrimônio com cautela e precisão. Prefere segurança a aventura.",
    color: "hsl(45, 30%, 52%)", // gold/silver
  },
  moderado: {
    name: "Estrategista da Sonserina",
    title: "Moderado",
    emoji: "🐍",
    description: "Equilibra ambição e prudência. Calcula cada movimento com astúcia.",
    color: "hsl(153, 60%, 32%)", // emerald
  },
  arrojado: {
    name: "Lorde do Risco",
    title: "Arrojado",
    emoji: "⚡",
    description: "Busca retornos extraordinários. Vê volatilidade como oportunidade de poder.",
    color: "hsl(153, 70%, 25%)", // dark emerald
  },
};

export function getInvestorCategory(riskTolerance: string | null | undefined): InvestorCategory {
  return INVESTOR_CATEGORIES[riskTolerance || "moderado"] || INVESTOR_CATEGORIES.moderado;
}

export function getInvestorCategoryList(): InvestorCategory[] {
  return Object.values(INVESTOR_CATEGORIES);
}
