import { AppSidebar } from "@/components/AppSidebar";
import { BentoCard, BentoGrid } from "@/components/BentoGrid";
import { AlertCard } from "@/components/AlertCard";
import { formatCurrency } from "@/data/mockData";
import { TrendingUp, TrendingDown, Loader2, Upload, User } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { usePortfolios, usePositions, useLatestAnalysis, useInvestorProfile } from "@/hooks/usePortfolio";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import PortfolioTracker from "@/components/PortfolioTracker";
import { getInvestorCategory } from "@/lib/investorProfile";

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

const CHART_COLORS = {
  emerald: "hsl(153, 60%, 32%)",
  emeraldLight: "hsl(153, 45%, 50%)",
  serpent: "hsl(153, 70%, 25%)",
  silver: "hsl(160, 8%, 65%)",
  gold: "hsl(45, 30%, 52%)",
  dark: "hsl(160, 15%, 18%)",
};

const allocationColors = [CHART_COLORS.emerald, CHART_COLORS.emeraldLight, CHART_COLORS.gold, CHART_COLORS.serpent, CHART_COLORS.silver, CHART_COLORS.dark];

export default function Dashboard() {
  const { data: portfolios, isLoading: loadingPortfolios } = usePortfolios();
  const portfolioId = portfolios?.[0]?.id;
  const { data: positions, isLoading: loadingPositions } = usePositions(portfolioId);
  const { data: analysis } = useLatestAnalysis();
  const { data: investorProfile } = useInvestorProfile();
  const navigate = useNavigate();

  const category = getInvestorCategory(investorProfile?.risk_tolerance);

  const stats = useMemo(() => {
    if (!positions || positions.length === 0) return null;

    const totalValue = positions.reduce((sum, p) => sum + (Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0), 0);

    const classMap: Record<string, number> = {};
    positions.forEach(p => {
      const cls = p.asset_class || "Outros";
      const val = Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0;
      classMap[cls] = (classMap[cls] || 0) + val;
    });
    const allocation = Object.entries(classMap)
      .map(([name, amount]) => ({ name, value: Math.round((amount / totalValue) * 100), amount }))
      .sort((a, b) => b.value - a.value);

    const sectorMap: Record<string, number> = {};
    positions.forEach(p => {
      const sec = p.sector || "Outros";
      const val = Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0;
      sectorMap[sec] = (sectorMap[sec] || 0) + val;
    });
    const sectors = Object.entries(sectorMap)
      .map(([name, amount]) => ({ name, pct: Math.round((amount / totalValue) * 100) }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 7);

    const topAssets = positions
      .map(p => ({
        ticker: p.ticker,
        type: p.asset_class,
        value: Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0,
        pct: 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(a => ({ ...a, pct: Math.round((a.value / totalValue) * 100) }));

    const liqMap: Record<string, number> = { "Imediata": 0, "Até 30d": 0, "Até 90d": 0, "90d+": 0 };
    positions.forEach(p => {
      const val = Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0;
      const liq = (p.liquidity || "D+1").toUpperCase();
      if (liq.includes("D+0") || liq.includes("D+1") || liq === "IMEDIATA") liqMap["Imediata"] += val;
      else if (liq.includes("D+30") || liq.includes("D+2") || liq.includes("D+3")) liqMap["Até 30d"] += val;
      else if (liq.includes("D+60") || liq.includes("D+90")) liqMap["Até 90d"] += val;
      else liqMap["90d+"] += val;
    });
    const liquidityData = Object.entries(liqMap).map(([name, amount]) => ({
      name,
      value: totalValue > 0 ? Math.round((amount / totalValue) * 100) : 0,
    }));

    const alerts = (analysis?.concentration_alerts as string[] || []).map((a, i) => ({
      id: String(i),
      type: "concentration" as const,
      title: a,
      description: "",
      severity: "medium" as const,
    }));

    return { totalValue, allocation, sectors, topAssets, liquidityData, alerts, assetCount: positions.length };
  }, [positions, analysis]);

  if (loadingPortfolios || loadingPositions) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppSidebar>
    );
  }

  // Empty state — no positions yet
  if (!stats) {
    return (
      <AppSidebar>
      <div className="space-y-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Visão geral da sua carteira de investimentos</p>
          </div>

          {/* Investor profile card */}
          {investorProfile && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-2xl">
                {category.emoji}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Seu perfil</p>
                <h2 className="font-heading text-lg font-bold text-foreground">{category.name}</h2>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
            </div>
          )}

          <div className="max-w-lg mx-auto text-center space-y-3 py-10">
            <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
            <h2 className="font-heading text-lg font-bold text-foreground">Sua carteira está vazia</h2>
            <p className="text-sm text-muted-foreground">Importe seus extratos para ver o dashboard completo com análise por IA.</p>
            <Button onClick={() => navigate("/portfolio/import")} size="sm">Importar Carteira</Button>
          </div>
        </div>
      </AppSidebar>
    );
  }

  return (
    <AppSidebar>
      <div className="space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visão geral da sua carteira de investimentos</p>
        </div>

        {/* Investor profile badge */}
        {investorProfile && (
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
            <span className="text-xl">{category.emoji}</span>
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">Perfil</p>
              <p className="font-heading font-bold text-sm text-foreground">{category.name}</p>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{category.title}</span>
          </div>
        )}

        <BentoGrid columns={3}>
          <BentoCard title="Patrimônio Total">
            <StatValue label="" value={formatCurrency(stats.totalValue)} />
          </BentoCard>
          <BentoCard title="Nº de Ativos">
            <StatValue label="" value={String(stats.assetCount)} sub="posições" />
          </BentoCard>
          <BentoCard title="Alertas" badge={String(stats.alerts.length)} badgeVariant="warning">
            <StatValue label="" value={String(stats.alerts.length)} sub="pontos de atenção" />
          </BentoCard>
        </BentoGrid>

        <BentoGrid columns={3}>
          <BentoCard title="Alocação por Classe" subtitle="Distribuição atual da carteira">
            <div className="h-48 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={72} paddingAngle={2}>
                    {stats.allocation.map((_, i) => (
                      <Cell key={i} fill={allocationColors[i % allocationColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              {stats.allocation.map((a, i) => (
                <div key={a.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: allocationColors[i % allocationColors.length] }} />
                  <span className="text-xs text-muted-foreground truncate">{a.name}</span>
                  <span className="text-xs font-medium text-foreground ml-auto">{a.value}%</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard title="Exposição por Setor" subtitle="Distribuição setorial">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sectors} layout="vertical" margin={{ left: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="pct" fill={CHART_COLORS.emerald} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </BentoCard>

          <BentoCard title="Alertas" subtitle="Pontos de atenção" badge={`${stats.alerts.length}`} badgeVariant="warning">
            {stats.alerts.length > 0 ? (
              <div className="space-y-2">
                {stats.alerts.slice(0, 4).map((alert) => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum alerta no momento.</p>
            )}
          </BentoCard>
        </BentoGrid>

        <BentoGrid columns={2}>
          <BentoCard title="Liquidez" subtitle="Prazo para resgate">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.liquidityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={2}>
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
              {stats.liquidityData.map((l, i) => (
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
              {stats.topAssets.map((a) => (
                <div key={a.ticker} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.ticker}</p>
                    <p className="text-xs text-muted-foreground">{a.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{formatCurrency(a.value)}</p>
                    <p className="text-xs text-muted-foreground">{a.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        </BentoGrid>

        {/* Portfolio Tracker */}
        {positions && positions.length > 0 && (
          <PortfolioTracker positions={positions as any} />
        )}
      </div>
    </AppSidebar>
  );
}
