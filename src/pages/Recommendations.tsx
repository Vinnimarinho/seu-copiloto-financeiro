import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { useRecommendations, useUpdateRecommendation } from "@/hooks/usePortfolio";
import { mockRecommendations } from "@/data/mockData";
import { CheckCircle2, Clock, X, AlertCircle, Loader2 } from "lucide-react";

export default function Recommendations() {
  const { data: dbRecs, isLoading } = useRecommendations();
  const updateRec = useUpdateRecommendation();

  // Use DB data if available, otherwise fall back to mock
  const hasDbData = dbRecs && dbRecs.length > 0;

  const recs = hasDbData
    ? dbRecs.map(r => ({
        id: r.id,
        title: r.title,
        reason: r.description || "",
        action: r.recommendation_type,
        impact: r.estimated_impact || "",
        urgency: "Média",
        priority: 1,
        status: r.status as string,
      }))
    : mockRecommendations;

  return (
    <AppSidebar>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Recomendações Assistidas</h1>
          <p className="text-sm text-muted-foreground mt-1">Sugestões para melhorar sua carteira — você decide o que fazer</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
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
                      <Button variant="default" size="sm" onClick={() => hasDbData && updateRec.mutate({ id: rec.id, status: "accepted" })}>
                        <CheckCircle2 className="w-4 h-4" /> Aceitar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => hasDbData && updateRec.mutate({ id: rec.id, status: "postponed" })}>
                        <Clock className="w-4 h-4" /> Adiar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => hasDbData && updateRec.mutate({ id: rec.id, status: "discarded" })}>
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
