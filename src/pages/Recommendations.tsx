import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useRecommendations, useUpdateRecommendation } from "@/hooks/usePortfolio";
import { CheckCircle2, Clock, X, Loader2, ListChecks, MessageCircle } from "lucide-react";
import { RegulatoryDisclaimer } from "@/components/RegulatoryDisclaimer";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { PaidFeatureOverlay } from "@/components/PaidFeatureOverlay";
import { useTranslation } from "react-i18next";

const ACTION_STEPS: Record<string, string[]> = {
  rebalance: [
    "Acesse sua corretora ou banco de investimentos",
    "Vá até a seção de 'Carteira' ou 'Posições'",
    "Identifique o ativo mencionado na oportunidade",
    "Avalie se faz sentido reduzir parte ou todo o ativo",
    "Se for realocar, escolha ativos da classe sugerida",
    "Ajuste a posição na sua plataforma se decidir prosseguir",
    "Aguarde a liquidação (prazo varia: D+0 a D+3)",
  ],
  diversify: [
    "Defina o valor que deseja destinar à nova classe",
    "Pesquise ativos da classe sugerida na sua corretora",
    "Compare taxas, liquidez e histórico dos ativos",
    "Faça a aplicação pelo home broker ou app, se decidir prosseguir",
    "Registre a operação para acompanhamento futuro",
  ],
  reduce_risk: [
    "Identifique os ativos de maior risco na carteira",
    "Avalie o quanto faria sentido migrar para renda fixa",
    "Pesquise opções como Tesouro Selic, CDB ou LCI/LCA",
    "Considere uma migração gradual em vez de fazer tudo de uma vez",
    "Acompanhe a nova composição no próximo diagnóstico",
  ],
  general: [
    "Analise a sugestão com calma antes de agir",
    "Acesse sua corretora ou banco de investimentos",
    "Localize os ativos mencionados na sugestão",
    "Simule a operação antes de tomar qualquer decisão",
    "Se decidir prosseguir, acompanhe os resultados ao longo do tempo",
  ],
};

function getSteps(recType: string): string[] {
  return ACTION_STEPS[recType] || ACTION_STEPS.general;
}

export default function Recommendations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canAccessOpportunities, isLoading: planLoading } = usePlanAccess();
  const { data: dbRecs = [], isLoading } = useRecommendations();
  const updateRec = useUpdateRecommendation();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleSteps = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!planLoading && !canAccessOpportunities) {
    const mockRecs = [
      { title: "Reduzir concentração em PETR4", reason: "PETR4 representa 28% da sua carteira em ações.", impact: "Diversificação +15%" },
      { title: "Considerar exposição internacional", reason: "Sua carteira tem 0% em ativos globais.", impact: "Risco -8%" },
      { title: "Migrar parte do CDB para Tesouro IPCA+", reason: "Proteção contra inflação no longo prazo.", impact: "Retorno real esperado +1,8% a.a." },
    ];
    return (
      <AppSidebar>
        <div className="max-w-3xl mx-auto">
          <PaidFeatureOverlay
            active
            plan="essencial"
            title={t("recommendations.paidTitle")}
            description={t("recommendations.paidDesc")}
          >
            <div className="space-y-3">
              <h1 className="font-heading text-2xl font-bold text-foreground">{t("recommendations.title")}</h1>
              {mockRecs.map((r, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-heading font-semibold text-foreground">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>
                  <p className="text-xs text-foreground/70 mt-1"><strong>{t("recommendations.impact")}</strong> {r.impact}</p>
                </div>
              ))}
            </div>
          </PaidFeatureOverlay>
        </div>
      </AppSidebar>
    );
  }

  const recs = dbRecs.map((r) => ({
    id: r.id,
    title: r.title,
    reason: r.description || "",
    impact: r.estimated_impact || "",
    status: r.status as string,
    type: r.recommendation_type || "general",
  }));

  return (
    <AppSidebar>
      <div className="max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("recommendations.title")}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{t("recommendations.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : recs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">{t("recommendations.emptyTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("recommendations.emptyDesc")}</p>
            <Button onClick={() => navigate("/portfolio/import")} size="sm">{t("recommendations.importBtn")}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recs.map((rec) => {
              const isPending = rec.status === "pending";
              const showSteps = expandedSteps.has(rec.id);
              const steps = getSteps(rec.type);
              const statusKey = rec.status === "accepted" ? "accepted" : rec.status === "postponed" ? "postponed" : "discarded";

              return (
                <div key={rec.id} className={`bg-card border border-border rounded-xl p-4 transition-opacity ${!isPending ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-foreground">{rec.title}</h3>
                    {!isPending && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md whitespace-nowrap">
                        {t(`recommendations.status.${statusKey}`)}
                      </span>
                    )}
                  </div>

                  {rec.reason && (
                    <p className="text-sm text-muted-foreground mb-1">{rec.reason}</p>
                  )}
                  {rec.impact && (
                    <p className="text-xs text-foreground/70"><strong>{t("recommendations.impact")}</strong> {rec.impact}</p>
                  )}

                  <button
                    onClick={() => toggleSteps(rec.id)}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium mt-2 hover:underline"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    {showSteps ? t("recommendations.hideSteps") : t("recommendations.showSteps")}
                  </button>

                  {showSteps && (
                    <div className="mt-2 bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">
                        {t("recommendations.stepsKicker")}
                      </p>
                      <ol className="space-y-1.5">
                        {steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-foreground">
                            <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {isPending && (
                    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border">
                      <Button variant="default" size="sm" className="h-7 text-xs" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "accepted" })}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t("recommendations.accept")}
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "postponed" })}>
                        <Clock className="w-3.5 h-3.5" /> {t("recommendations.postpone")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "discarded" })}>
                        <X className="w-3.5 h-3.5" /> {t("recommendations.discard")}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {recs.length > 0 && (
          <div className="bg-card border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">{t("recommendations.ctaTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("recommendations.ctaDesc")}</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/chat")}>{t("recommendations.ctaBtn")}</Button>
          </div>
        )}

        <RegulatoryDisclaimer />
      </div>
    </AppSidebar>
  );
}
