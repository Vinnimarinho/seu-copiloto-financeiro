import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useRecommendations, useUpdateRecommendation } from "@/hooks/usePortfolio";
import { CheckCircle2, Clock, X, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Recommendations() {
  const navigate = useNavigate();
  const { data: dbRecs = [], isLoading } = useRecommendations();
  const updateRec = useUpdateRecommendation();

  const recs = dbRecs.map((recommendation) => ({
    id: recommendation.id,
    title: recommendation.title,
    reason: recommendation.description || "",
    impact: recommendation.estimated_impact || "",
    status: recommendation.status as string,
  }));

  return (
    <AppSidebar>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Recomendações Assistidas</h1>
          <p className="text-sm text-muted-foreground mt-1">Sugestões para melhorar sua carteira — você decide o que fazer</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : recs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card space-y-4">
            <h2 className="font-heading text-xl font-semibold text-foreground">Ainda não há recomendações geradas</h2>
            <p className="text-sm text-muted-foreground">
              Envie sua carteira e rode o diagnóstico completo para gerar recomendações baseadas no seu perfil investidor.
            </p>
            <Button onClick={() => navigate("/portfolio/import")}>Importar carteira</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recs.map((rec) => {
              const isPending = rec.status === "pending";
              return (
                <div key={rec.id} className={`bg-card border border-border rounded-xl p-6 shadow-card transition-opacity ${!isPending ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-heading font-semibold text-lg text-foreground">{rec.title}</h3>
                    </div>
                    {!isPending && (
                      <span className="text-xs font-medium text-muted-foreground capitalize bg-secondary px-2 py-1 rounded-md">
                        {rec.status === "accepted" ? "✓ Aceita" : rec.status === "postponed" ? "⏳ Adiada" : "✕ Descartada"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 mb-5">
                    {rec.reason && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Detalhe</p>
                        <p className="text-sm text-foreground">{rec.reason}</p>
                      </div>
                    )}
                    {rec.impact && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Impacto esperado</p>
                        <p className="text-sm text-foreground">{rec.impact}</p>
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2 pt-4 border-t border-border">
                      <Button variant="default" size="sm" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "accepted" })}>
                        <CheckCircle2 className="w-4 h-4" /> Aceitar
                      </Button>
                      <Button variant="outline" size="sm" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "postponed" })}>
                        <Clock className="w-4 h-4" /> Adiar
                      </Button>
                      <Button variant="ghost" size="sm" disabled={updateRec.isPending} onClick={() => updateRec.mutate({ id: rec.id, status: "discarded" })}>
                        <X className="w-4 h-4" /> Descartar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-secondary/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Estas são sugestões baseadas na análise da sua carteira e perfil. Não constituem recomendação de investimento.
          </p>
        </div>
      </div>
    </AppSidebar>
  );
}
