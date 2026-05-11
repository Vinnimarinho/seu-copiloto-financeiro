import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useRecommendations, useUpdateRecommendation } from "@/hooks/usePortfolio";
import { CheckCircle2, Clock, X, Loader2, ListChecks, MessageCircle } from "lucide-react";
import { RegulatoryDisclaimer } from "@/components/RegulatoryDisclaimer";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { PaidFeatureOverlay } from "@/components/PaidFeatureOverlay";

// Linguagem ajustada para evitar termos com conotação operacional/regulada
// ("execute a ordem", "ordem de compra/venda"). Tudo aqui é caminho sugerido —
// a decisão final é sempre do usuário.
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

  // Gating: plano gratuito não acessa Oportunidades — overlay bloqueante
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
            title="Oportunidades de Melhoria"
            description="Veja sugestões personalizadas de rebalanceamento, diversificação e otimização da sua carteira — com passo a passo para aplicar."
          >
            <div className="space-y-3">
              <h1 className="font-heading text-2xl font-bold text-foreground">Oportunidades de Melhoria</h1>
              {mockRecs.map((r, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <h3 className="font-heading font-semibold text-foreground">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.reason}</p>
                  <p className="text-xs text-foreground/70 mt-1"><strong>Impacto possível:</strong> {r.impact}</p>
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
          <h1 className="font-heading text-2xl font-bold text-foreground">Oportunidades de Melhoria</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Caminhos sugeridos para otimizar a performance da sua carteira — você decide o que fazer.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : recs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Nenhuma oportunidade identificada ainda</h2>
            <p className="text-sm text-muted-foreground">
              Envie a performance da sua carteira e rode o diagnóstico para identificar oportunidades.
            </p>
            <Button onClick={() => navigate("/portfolio/import")} size="sm">Importar performance da carteira</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recs.map((rec) => {
              const isPending = rec.status === "pending";
              const showSteps = expandedSteps.has(rec.id);
              const steps = getSteps(rec.type);

              return (
                <div key={rec.id} className={`bg-card border border-border rounded-xl p-4 transition-opacity ${!isPending ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-heading font-semibold text-foreground">{rec.title}</h3>
                    {!isPending && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md whitespace-nowrap">
                        {rec.status === "accepted" ? "✓ Aceita" : rec.status === "postponed" ? "⏳ Adiada" : "✕ Descartada"}
                      </span>
                    )}
                  </div>

                  {rec.reason && (
                    <p className="text-sm text-muted-foreground mb-1">{rec.reason}</p>
                  )}
                  {rec.impact && (
                    <p className="text-xs text-foreground/70"><strong>Impacto possível:</strong> {rec.impact}</p>
                  )}

                  {/* Caminho sugerido — sem CTA isolado para o LUCIUS dentro do card */}
                  <button
                    onClick={() => toggleSteps(rec.id)}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium mt-2 hover:underline"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    {showSteps ? "Ocultar caminho sugerido" : "Como aplicar na prática?"}
                  </button>

                  {showSteps && (
                    <div className="mt-2 bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">
                        Caminho sugerido
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
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aceitar
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "postponed" })}>
                        <Clock className="w-3.5 h-3.5" /> Adiar
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "discarded" })}>
                        <X className="w-3.5 h-3.5" /> Descartar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* CTA único ao LUCIUS — apenas no final da página */}
        {recs.length > 0 && (
          <div className="bg-card border border-primary/30 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-foreground">Dúvidas sobre alguma oportunidade?</p>
                <p className="text-xs text-muted-foreground">Converse com o LUCIUS para entender melhor cada sugestão.</p>
              </div>
            </div>
            <Button size="sm" onClick={() => navigate("/chat")}>Fale com o LUCIUS</Button>
          </div>
        )}

        <RegulatoryDisclaimer />
      </div>
    </AppSidebar>
  );
}
