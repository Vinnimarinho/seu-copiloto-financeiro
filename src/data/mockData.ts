export const mockPortfolio = {
  totalValue: 287450.0,
  monthlyReturn: 2.3,
  yearlyReturn: 14.7,
  lastUpdate: "2026-04-09",
  
  allocation: [
    { name: "Renda Fixa", value: 45, amount: 129352.5, color: "hsl(217, 91%, 50%)" },
    { name: "Ações BR", value: 25, amount: 71862.5, color: "hsl(160, 60%, 45%)" },
    { name: "FIIs", value: 12, amount: 34494.0, color: "hsl(38, 92%, 50%)" },
    { name: "Ações EUA", value: 10, amount: 28745.0, color: "hsl(280, 60%, 55%)" },
    { name: "Cripto", value: 5, amount: 14372.5, color: "hsl(340, 70%, 55%)" },
    { name: "Caixa", value: 3, amount: 8623.5, color: "hsl(210, 15%, 70%)" },
  ],

  topAssets: [
    { ticker: "TESOURO SELIC 2029", type: "Renda Fixa", value: 52000, pct: 18.1, return30d: 1.1 },
    { ticker: "CDB BANCO XP 120%", type: "Renda Fixa", value: 35000, pct: 12.2, return30d: 1.2 },
    { ticker: "PETR4", type: "Ações BR", value: 28500, pct: 9.9, return30d: -3.2 },
    { ticker: "VALE3", type: "Ações BR", value: 22000, pct: 7.7, return30d: 4.1 },
    { ticker: "XPLG11", type: "FII", value: 18200, pct: 6.3, return30d: 0.8 },
    { ticker: "HGLG11", type: "FII", value: 16294, pct: 5.7, return30d: 1.5 },
    { ticker: "AAPL", type: "Ações EUA", value: 15400, pct: 5.4, return30d: 2.8 },
    { ticker: "MSFT", type: "Ações EUA", value: 13345, pct: 4.6, return30d: 1.9 },
    { ticker: "BTC", type: "Cripto", value: 14372.5, pct: 5.0, return30d: 8.3 },
    { ticker: "LCI 95% CDI", type: "Renda Fixa", value: 22000, pct: 7.7, return30d: 0.9 },
  ],

  sectors: [
    { name: "Financeiro", pct: 22 },
    { name: "Commodities", pct: 18 },
    { name: "Tecnologia", pct: 15 },
    { name: "Imobiliário", pct: 12 },
    { name: "Energia", pct: 10 },
    { name: "Governo", pct: 18 },
    { name: "Outros", pct: 5 },
  ],

  countries: [
    { name: "Brasil", pct: 82 },
    { name: "EUA", pct: 10 },
    { name: "Global", pct: 8 },
  ],

  liquidity: {
    immediate: 35,
    upTo30d: 25,
    upTo90d: 20,
    above90d: 20,
  },
};

export const mockAlerts = [
  {
    id: "1",
    type: "concentration" as const,
    title: "Concentração alta em PETR4",
    description: "Quase 10% da carteira em um único ativo. O ideal é limitar a 5% por ação para reduzir risco.",
    severity: "high" as const,
  },
  {
    id: "2",
    type: "idle" as const,
    title: "Caixa parado sem render",
    description: "R$ 8.623 em caixa sem aplicação. Considere alocar em CDB de liquidez diária.",
    severity: "medium" as const,
  },
  {
    id: "3",
    type: "misalignment" as const,
    title: "Cripto acima do perfil",
    description: "Seu perfil moderado sugere no máximo 3% em cripto, mas você tem 5%.",
    severity: "medium" as const,
  },
  {
    id: "4",
    type: "redundant" as const,
    title: "FIIs com sobreposição",
    description: "XPLG11 e HGLG11 têm 60% dos imóveis em comum. Considere diversificar.",
    severity: "low" as const,
  },
];

export const mockProfile = {
  name: "Usuário Demo",
  objective: "Crescimento de patrimônio",
  horizon: "Longo prazo (5+ anos)",
  riskTolerance: "Moderado",
  income: "R$ 10.000 - R$ 20.000",
  netWorth: "R$ 200.000 - R$ 500.000",
  preference: "Equilíbrio entre renda e crescimento",
  liquidityNeed: "Média",
};

export const mockRecommendations = [
  {
    id: "r1",
    priority: 1,
    title: "Reduzir posição em PETR4",
    reason: "Concentração acima de 5% em um único ativo expõe sua carteira a riscos específicos da empresa.",
    action: "Vender R$ 14.250 de PETR4 e redistribuir entre 2-3 ações de setores diferentes.",
    impact: "Reduz o risco de concentração em 50% e melhora a diversificação.",
    urgency: "Alta",
    status: "pending" as const,
  },
  {
    id: "r2",
    priority: 2,
    title: "Aplicar o caixa ocioso",
    reason: "R$ 8.623 parado perde poder de compra com a inflação.",
    action: "Aplicar em CDB de liquidez diária rendendo 100% CDI.",
    impact: "Gera cerca de R$ 90/mês em rendimentos sem perder liquidez.",
    urgency: "Média",
    status: "pending" as const,
  },
  {
    id: "r3",
    priority: 3,
    title: "Reduzir exposição a cripto",
    reason: "Seu perfil moderado indica tolerância de até 3% em ativos de alta volatilidade.",
    action: "Reduzir BTC de 5% para 3% e alocar a diferença em renda fixa.",
    impact: "Reduz a volatilidade da carteira em ~15% sem grande impacto no retorno esperado.",
    urgency: "Baixa",
    status: "pending" as const,
  },
];

export const mockHistory = [
  { date: "2026-04-09", value: 287450, change: 2.3 },
  { date: "2026-03-09", value: 281000, change: 1.8 },
  { date: "2026-02-09", value: 276050, change: -0.5 },
  { date: "2026-01-09", value: 277430, change: 3.1 },
  { date: "2025-12-09", value: 269090, change: 1.2 },
  { date: "2025-11-09", value: 265890, change: 0.8 },
];

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
