import { AppSidebar } from "@/components/AppSidebar";
import { BentoCard, BentoGrid } from "@/components/BentoGrid";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { useLatestAnalysis } from "@/hooks/usePortfolio";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

function ScoreBadge({ score, status }: { score: number; status: "good" | "warning" | "bad" }) {
  const config = {
    good: { bg: "bg-success/10", text: "text-success", icon: <CheckCircle2 className="w-4 h-4" /> },
    warning: { bg: "bg-warning/10", text: "text-warning", icon: <AlertTriangle className="w-4 h-4" /> },
    bad: { bg: "bg-destructive/10", text: "text-destructive", icon: <XCircle className="w-4 h-4" /> },
  };
  const c = config[status];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${c.bg}`}>
      <span className={c.text}>{c.icon}</span>
      <span className={`font-heading font-bold text-lg ${c.text}`}>{score}</span>
    </div>
  );
}

function getStatus(score: number): "good" | "warning" | "bad" {
  if (score >= 75) return "good";
  if (score >= 50) return "warning";
  return "bad";
}

export default function Diagnosis() {
  const { data: analysis, isLoading } = useLatestAnalysis();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppSidebar>
    );
  }

  if (!analysis) {
    return (
      <AppSidebar>
        <div className="max-w-lg mx-auto text-center space-y-4 py-20">
          <h1 className="font-heading text-2xl font-bold text-foreground">Nenhum diagnóstico ainda</h1>
          <p className="text-muted-foreground">Importe sua carteira para gerar o diagnóstico automático com IA.</p>
          <Button onClick={() => navigate("/portfolio/import")}>Importar Carteira</Button>
        </div>
      </AppSidebar>
    );
  }

  const riskScore = Number(analysis.risk_score) || 0;
  const divScore = Number(analysis.diversification_score) || 0;
  const liqScore = Number(analysis.liquidity_score) || 0;
  const concentrationAlerts = (analysis.concentration_alerts as string[]) || [];
  const allocation = (analysis.allocation_breakdown as Record<string, number>) || {};

  const diagnosisItems = [
    { label: "Risco", score: riskScore, detail: `Pontuação de risco da sua carteira.` },
    { label: "Diversificação", score: divScore, detail: `Quão diversificada está sua carteira.` },
    { label: "Liquidez", score: liqScore, detail: `Facilidade de resgatar seus investimentos.` },
  ];

  const overallScore = Math.round((riskScore + divScore + liqScore) / 3);

  return (
    <AppSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Diagnóstico da Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise gerada por IA com base nos seus investimentos</p>
        </div>

        {/* Overall score */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card flex items-center gap-6">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
            <span className="font-heading text-3xl font-bold text-primary-foreground">{overallScore}</span>
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground">Nota geral da carteira</h2>
            <p className="text-sm text-muted-foreground">Baseado em risco, diversificação e liquidez.</p>
          </div>
        </div>

        {/* Summary */}
        {analysis.summary && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-heading font-semibold text-foreground mb-2">Resumo</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {/* Scores */}
        <BentoGrid columns={3}>
          {diagnosisItems.map((item) => (
            <BentoCard key={item.label} title={item.label}>
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.detail}</p>
                <ScoreBadge score={item.score} status={getStatus(item.score)} />
              </div>
              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getStatus(item.score) === "good" ? "bg-success" : getStatus(item.score) === "warning" ? "bg-warning" : "bg-destructive"}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </BentoCard>
          ))}
        </BentoGrid>

        {/* Allocation */}
        {Object.keys(allocation).length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-heading font-semibold text-foreground mb-3">Alocação por Classe</h3>
            <div className="space-y-2">
              {Object.entries(allocation).map(([name, pct]) => (
                <div key={name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concentration alerts */}
        {concentrationAlerts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Alertas de Concentração
            </h3>
            <ul className="space-y-1.5">
              {concentrationAlerts.map((alert, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span> {alert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Insights */}
        {analysis.ai_insights && (
          <div className="bg-card border border-border rounded-xl p-5 shadow-card">
            <h3 className="font-heading font-semibold text-foreground mb-2">Insights da IA</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{analysis.ai_insights}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Este diagnóstico é uma análise assistida e não constitui recomendação de investimento.
        </p>
      </div>
    </AppSidebar>
  );
}
