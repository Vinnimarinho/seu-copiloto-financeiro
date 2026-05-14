import { AppSidebar } from "@/components/AppSidebar";
import { BentoCard, BentoGrid } from "@/components/BentoGrid";
import { AlertTriangle, Loader2 } from "lucide-react";
import { RegulatoryDisclaimer } from "@/components/RegulatoryDisclaimer";
import { useLatestAnalysis, usePortfolios, usePositions, useProfile } from "@/hooks/usePortfolio";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/data/mockData";
import { useMemo } from "react";
import { getScoreClass, getScoreLabel } from "@/lib/scoreClassification";
import { LiquidityBreakdown } from "@/components/LiquidityBreakdown";
import { useTranslation } from "react-i18next";

function ScoreBadge({ score }: { score: number }) {
  const cls = getScoreClass(score);
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${cls.bgClass}`}>
      <span className={`font-heading font-bold text-lg ${cls.textClass}`}>{score}</span>
    </div>
  );
}

function personalizeText(text: string, userName?: string): string {
  if (!text) return text;
  const namePattern = /(?:Olá|Oi|Prezad[oa]|Hello|Hi|Dear),?\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?\s*[!,.:]/g;
  return text.replace(namePattern, (match) => {
    if (userName) {
      return match.replace(/[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?/, userName);
    }
    return match.replace(/,?\s+[A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?/, "");
  });
}

function replaceApproxPatrimony(text: string, exactValue: number | null): string {
  if (!text || !exactValue) return text;
  const formatted = formatCurrency(exactValue);
  return text.replace(
    /(?:aproximadamente\s+|approximately\s+)?R\$\s*[\d.,]+\s*(?:mil|milhões|milhão|thousand|million)?/gi,
    formatted
  );
}

export default function Diagnosis() {
  const { t } = useTranslation();
  const { data: analysis, isLoading } = useLatestAnalysis();
  const { data: profile } = useProfile();
  const { data: portfolios } = usePortfolios();
  const portfolioId = portfolios?.[0]?.id;
  const { data: positions } = usePositions(portfolioId);
  const navigate = useNavigate();

  const userName = profile?.full_name || undefined;

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
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("diagnosis.emptyTitle")}</h1>
          <p className="text-muted-foreground text-sm">{t("diagnosis.emptyDesc")}</p>
          <Button onClick={() => navigate("/portfolio/import")}>{t("diagnosis.importBtn")}</Button>
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
    { key: "risk", label: t("diagnosis.risk"), score: riskScore, glossary: t("diagnosis.glossary.risk") },
    { key: "diversification", label: t("diagnosis.diversification"), score: divScore, glossary: t("diagnosis.glossary.diversification") },
    { key: "liquidity", label: t("diagnosis.liquidity"), score: liqScore, glossary: t("diagnosis.glossary.liquidity") },
  ];

  const tierLabel = (score: number) => t(`scores.${getScoreClass(score).tier}`);
  const overallLabel = tierLabel(overallScore);

  return (
    <AppSidebar>
      <div className="space-y-4 max-w-4xl">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("diagnosis.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("diagnosis.subtitle")}</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <span className="font-heading text-2xl font-bold text-primary-foreground">{overallScore}</span>
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-semibold text-foreground">
              {t("diagnosis.overall", { label: overallLabel })}
            </h2>
            <p className="text-xs text-muted-foreground">{t("diagnosis.overallDesc")}</p>
          </div>
          {totalFromPositions !== null && (
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{t("diagnosis.patrimony")}</p>
              <p className="font-heading text-lg font-bold text-foreground">{formatCurrency(totalFromPositions)}</p>
            </div>
          )}
        </div>

        {analysis.summary && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{t("diagnosis.summaryTitle")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {replaceApproxPatrimony(personalizeText(analysis.summary, userName), totalFromPositions)}
            </p>
          </div>
        )}

        <BentoGrid columns={3}>
          {diagnosisItems.map((item) => {
            const cls = getScoreClass(item.score);
            return (
              <BentoCard key={item.key} title={item.label} subtitle={item.glossary}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-medium ${cls.textClass}`}>{getScoreLabel(item.score)}</span>
                  <ScoreBadge score={item.score} />
                </div>
                <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${cls.solidBgClass}`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </BentoCard>
            );
          })}
        </BentoGrid>

        {positions && positions.length > 0 && (
          <LiquidityBreakdown positions={positions as any} />
        )}

        {Object.keys(allocation).length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{t("diagnosis.allocation")}</h3>
            <p className="text-[10px] text-muted-foreground mb-2">{t("diagnosis.allocationDesc")}</p>
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

        {concentrationAlerts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" /> {t("diagnosis.alerts")}
            </h3>
            <p className="text-[10px] text-muted-foreground mb-2">{t("diagnosis.alertsDesc")}</p>
            <ul className="space-y-1">
              {concentrationAlerts.map((alert, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <span className="text-warning mt-0.5">•</span> {alert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.ai_insights && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-heading font-semibold text-sm text-foreground mb-1">{t("diagnosis.insights")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {replaceApproxPatrimony(personalizeText(analysis.ai_insights, userName), totalFromPositions)}
            </p>
          </div>
        )}

        <RegulatoryDisclaimer />
      </div>
    </AppSidebar>
  );
}
