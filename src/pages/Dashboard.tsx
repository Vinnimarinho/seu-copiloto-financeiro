import { AppSidebar } from "@/components/AppSidebar";
import { BentoCard, BentoGrid } from "@/components/BentoGrid";
import { AlertCard } from "@/components/AlertCard";
import { mockPortfolio, mockAlerts, formatCurrency, formatPercent } from "@/data/mockData";
import { TrendingUp, TrendingDown } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

function StatValue({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: "up" | "down" }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className="font-heading text-2xl font-bold text-foreground">{value}</span>
        {sub && (
          <span className={`text-sm font-medium flex items-center gap-0.5 mb-0.5 ${trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground"}`}>
            {trend === "up" && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === "down" && <TrendingDown className="w-3.5 h-3.5" />}
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// Slytherin-inspired chart colors
const CHART_COLORS = {
  emerald: "hsl(153, 60%, 32%)",
  emeraldLight: "hsl(153, 45%, 50%)",
  serpent: "hsl(153, 70%, 25%)",
  silver: "hsl(160, 8%, 65%)",
  gold: "hsl(45, 30%, 52%)",
  dark: "hsl(160, 15%, 18%)",
};

export default function Dashboard() {
  const { allocation, sectors, countries, liquidity } = mockPortfolio;

  const allocationColors = [CHART_COLORS.emerald, CHART_COLORS.emeraldLight, CHART_COLORS.gold, CHART_COLORS.serpent, CHART_COLORS.silver, CHART_COLORS.dark];

  const liquidityData = [
    { name: "Imediata", value: liquidity.immediate },
    { name: "Até 30d", value: liquidity.upTo30d },
    { name: "Até 90d", value: liquidity.upTo90d },
    { name: "90d+", value: liquidity.above90d },
  ];

  return (
    <AppSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da sua carteira de investimentos</p>
        </div>

        <BentoGrid columns={4}>
          <BentoCard title="Patrimônio Total">
            <StatValue label="" value={formatCurrency(mockPortfolio.totalValue)} sub={formatPercent(mockPortfolio.monthlyReturn) + " mês"} trend="up" />
          </BentoCard>
          <BentoCard title="Retorno Anual">
            <StatValue label="" value={formatPercent(mockPortfolio.yearlyReturn)} sub="em 12 meses" trend="up" />
          </BentoCard>
          <BentoCard title="Nº de Ativos">
            <StatValue label="" value={String(mockPortfolio.topAssets.length)} sub="ativos" />
          </BentoCard>
          <BentoCard title="Alertas" badge={String(mockAlerts.length)} badgeVariant="warning">
            <StatValue label="" value={String(mockAlerts.filter(a => a.severity === "high").length)} sub="prioridade alta" trend="down" />
          </BentoCard>
        </BentoGrid>

        <BentoGrid columns={3}>
          <BentoCard title="Alocação por Classe" subtitle="Distribuição atual da carteira">
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={2}>
                    {allocation.map((_, i) => (
                      <Cell key={i} fill={allocationColors[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              {allocation.map((a, i) => (
                <div key={a.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: allocationColors[i] }} />
                  <span className="text-xs text-muted-foreground truncate">{a.name}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">{a.value}%</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="Exposição por Setor" subtitle="Distribuição setorial">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectors} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="pct" fill={CHART_COLORS.emerald} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          <BentoCard title="Alertas Prioritários" subtitle="Pontos de atenção" badge={`${mockAlerts.length}`} badgeVariant="warning">
            <div className="space-y-2">
              {mockAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </BentoCard>
        </BentoGrid>

        <BentoGrid columns={3}>
          <BentoCard title="Exposição por País" subtitle="Distribuição geográfica">
            <div className="space-y-3 mt-2">
              {countries.map((c) => (
                <div key={c.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground">{c.name}</span>
                    <span className="text-muted-foreground">{c.pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${c.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="Liquidez" subtitle="Prazo para resgate">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={liquidityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={2}>
                    <Cell fill={CHART_COLORS.emerald} />
                    <Cell fill={CHART_COLORS.emeraldLight} />
                    <Cell fill={CHART_COLORS.gold} />
                    <Cell fill={CHART_COLORS.silver} />
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mt-1">
              {liquidityData.map((l, i) => (
                <div key={l.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: [CHART_COLORS.emerald, CHART_COLORS.emeraldLight, CHART_COLORS.gold, CHART_COLORS.silver][i] }} />
                  <span className="text-xs text-muted-foreground">{l.name}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">{l.value}%</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="Maiores Posições" subtitle="Top 5 por valor">
            <div className="space-y-2.5 mt-1">
              {mockPortfolio.topAssets.slice(0, 5).map((a) => (
                <div key={a.ticker} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.ticker}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{formatCurrency(a.value)}</p>
                    <p className={`text-xs ${a.return30d >= 0 ? "text-primary" : "text-destructive"}`}>
                      {formatPercent(a.return30d)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </AppSidebar>
  );
}
