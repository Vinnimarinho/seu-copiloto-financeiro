import { AppSidebar } from "@/components/AppSidebar";
import { BentoCard, BentoGrid } from "@/components/BentoGrid";
import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from "lucide-react";
import { useLatestAnalysis, usePortfolios, usePositions, useProfile } from "@/hooks/usePortfolio";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/data/mockData";
import { useMemo } from "react";

const TERM_GLOSSARY: Record<string, string> = {
  "Risco": "Chance de perder dinheiro — quanto maior, mais volátil o investimento",
  "Diversificação": "Não colocar todos os ovos na mesma cesta — espalhar entre tipos de investimentos",
  "Liquidez": "Facilidade de transformar o investimento de volta em dinheiro quando precisar",
};

function ScoreBadge({ score, status }: { score: number; status: "good" | "warning" | "bad" }) {
  const config = {
    good: { bg: "bg-success/10", text: "text-success", icon: <CheckCircle2 className="w-4 h-4" /> },
    warning: { bg: "bg-warning/10", text: "text-warning", icon: <AlertTriangle className="w-4 h-4" /> },
    bad: { bg: "bg-destructive/10", text: "text-destructive", icon: <XCircle className="w-4 h-4" /> },
  };
  const c = config[status];
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${c.bg}`}>
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

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 65) return "Bom";
  if (score >= 50) return "Atenção";
  if (score >= 30) return "Preocupante";
  return "Crítico";
}

/** Replace any hardcoded name in AI text with the user's actual name */
function personalizeText(text: string, userName?: string): string {
  if (!text) return text;
  // Replace common AI greeting patterns with hardcoded names
  const namePattern = /(?:Olá|Oi|Prezad[oa]),?\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?\s*[!,.:]/g;
  return text.replace(namePattern, (match) => {
    if (userName) {
      return match.replace(/[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?/, userName);
    }
    // Remove the name entirely, keep the greeting
    return match.replace(/,?\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?/, "");
  });
}

export default function Diagnosis() {
  const { data: analysis, isLoading } = useLatestAnalysis();
  const { data: profile } = useProfile();
  const { data: portfolios } = usePortfolios();
  const portfolioId = portfolios?.[0]?.id;
  const { data: positions } = usePositions(portfolioId);
  const navigate = useNavigate();

  const userName = profile?.full_name || undefined;

  // Calculate total from positions (same logic as Dashboard) for consistency
  const totalFromPositions = useMemo(() => {
    if (!positions || positions.length === 0) return null;
    return positions.reduce(
      (sum, p) => sum + (Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0),
      0
    );
  }, [positions]);

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
        <div className="max-w-lg mx-auto text-center space-y-3 py-16">
          <h1 className="font-heading text-2xl font-bold text-foreground">Nenhum diagnóstico ainda</h1>
          <p className="text-muted-foreground text-sm">Importe sua carteira para gerar o diagnóstico automático com IA.</p>
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
  const overallScore = Math.round((riskScore + divScore + liqScore) / 3);

  const diagnosisItems = [
    { label: "Risco", score: riskScore },
    { label: "Diversificação", score: divScore },
    { label: "Liquidez", score: liqScore },
  ];

  return (
    <AppSidebar>
      <div className="space-y-4 max-w-4xl">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Diagnóstico da Carteira</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Análise gerada por IA com base nos seus investimentos</p>
        </div>

        {/* Overall score + patrimony */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <span className="font-heading text-2xl font-bold text-primary-foreground">{overallScore}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-semibold text-foreground">
              Nota geral: {getScoreLabel(overallScore)}
            </h2>
            <p className="text-xs text-muted-foreground">
              Média das notas de risco, diversificação e liquidez (quanto maior, melhor)
            </p>
          </div>
          {totalFromPositions !== null && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Patrimônio</p>
              <p className="font-heading text-lg font-bold text-foreground">{formatCurrency(totalFromPositions)}</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {analysis.summary && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1">Resumo em linguagem simples</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {personalizeText(analysis.summary, userName)}
            </p>
          </div>
        )}

        {/* Scores */}
        <BentoGrid columns={3}>
          {diagnosisItems.map((item) => (
            <BentoCard key={item.label} title={item.label} subtitle={TERM_GLOSSARY[item.label]}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground font-medium">{getScoreLabel(item.score)}</span>
                <ScoreBadge score={item.score} status={getStatus(item.score)} />
              </div>
              <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
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
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1">
              Alocação por Classe
            </h3>
            <p className="text-[10px] text-muted-foreground mb-2">Como seu dinheiro está distribuído entre tipos de investimento</p>
            <div className="space-y-1.5">
              {Object.entries(allocation).map(([name, pct]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-foreground">{name}</span>
                    <span className="text-muted-foreground">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concentration alerts */}
        {concentrationAlerts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Pontos de atenção
            </h3>
            <p className="text-[10px] text-muted-foreground mb-2">Investimentos que podem estar com peso desproporcional na carteira</p>
            <ul className="space-y-1">
              {concentrationAlerts.map((alert, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-warning mt-0.5">•</span> {alert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* AI Insights */}
        {analysis.ai_insights && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1">Análise detalhada do Lucius</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {personalizeText(analysis.ai_insights, userName)}
            </p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center">
          Diagnóstico assistido por IA — não constitui recomendação de investimento.
        </p>
      </div>
    </AppSidebar>
  );
}
