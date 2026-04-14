import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useRecommendations, useUpdateRecommendation } from "@/hooks/usePortfolio";
import { CheckCircle2, Clock, X, Loader2, ListChecks, ArrowRight } from "lucide-react";
import { RegulatoryDisclaimer } from "@/components/RegulatoryDisclaimer";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const ACTION_STEPS: Record<string, string[]> = {
  rebalance: [
    "Acesse sua corretora ou banco de investimentos",
    "Vá até a seção de 'Carteira' ou 'Posições'",
    "Identifique o ativo mencionado na oportunidade",
    "Avalie se deseja vender parte ou todo o ativo",
    "Se for realocar, escolha ativos da classe sugerida",
    "Execute a ordem de venda/compra na plataforma",
    "Aguarde a liquidação (prazo varia: D+0 a D+3)",
  ],
  diversify: [
    "Defina o valor que deseja investir na nova classe",
    "Pesquise ativos da classe sugerida na sua corretora",
    "Compare taxas, liquidez e histórico dos ativos",
    "Faça a aplicação pelo home broker ou app",
    "Registre a operação para acompanhamento futuro",
  ],
  reduce_risk: [
    "Identifique os ativos de maior risco na carteira",
    "Avalie o quanto deseja migrar para renda fixa",
    "Pesquise opções como Tesouro Selic, CDB ou LCI/LCA",
    "Execute a migração gradualmente, não tudo de uma vez",
    "Acompanhe a nova composição no próximo diagnóstico",
  ],
  general: [
    "Analise a sugestão com calma antes de agir",
    "Acesse sua corretora ou banco de investimentos",
    "Localize os ativos mencionados na sugestão",
    "Simule a operação antes de executar",
    "Execute a ação e acompanhe os resultados",
  ],
};

function getSteps(recType: string): string[] {
  return ACTION_STEPS[recType] || ACTION_STEPS.general;
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { data: dbRecs = [], isLoading } = useRecommendations();
  const updateRec = useUpdateRecommendation();
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleSteps = (id: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
          <p className="text-xs text-muted-foreground mt-0.5">Oportunidades identificadas para otimizar sua carteira — você decide o que fazer</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : recs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Nenhuma oportunidade identificada ainda</h2>
            <p className="text-sm text-muted-foreground">Envie sua carteira e rode o diagnóstico para identificar oportunidades de melhoria.</p>
            <Button onClick={() => navigate("/portfolio/import")} size="sm">Importar carteira</Button>
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
                    <p className="text-xs text-foreground/70"><strong>Impacto:</strong> {rec.impact}</p>
                  )}

                  {/* Action steps */}
                  <button
                    onClick={() => toggleSteps(rec.id)}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium mt-2 hover:underline"
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    {showSteps ? "Ocultar passo a passo" : "Como aplicar na prática?"}
                  </button>

                  {showSteps && (
                    <div className="mt-2 bg-secondary/50 rounded-lg p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-2">Passo a passo para executar</p>
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
                      <p className="text-[10px] text-muted-foreground mt-2 italic">
                        Dúvidas sobre como executar? Converse com o Lucius para orientação personalizada.
                      </p>
                      <Button variant="ghost" size="sm" className="mt-1 h-7 text-xs gap-1" onClick={() => navigate("/chat")}>
                        Perguntar ao Lucius <ArrowRight className="w-3 h-3" />
                      </Button>
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

        <RegulatoryDisclaimer />
      </div>
    </AppSidebar>
  );
}
