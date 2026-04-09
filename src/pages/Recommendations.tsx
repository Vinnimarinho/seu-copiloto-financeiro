import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { mockRecommendations } from "@/data/mockData";
import { CheckCircle2, Clock, X, ArrowRight, AlertCircle } from "lucide-react";
import { useState } from "react";

type Status = "pending" | "accepted" | "deferred" | "dismissed";

const urgencyColor = { Alta: "text-destructive", Média: "text-warning", Baixa: "text-muted-foreground" };

export default function Recommendations() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(
    Object.fromEntries(mockRecommendations.map(r => [r.id, r.status]))
  );

  const setStatus = (id: string, status: Status) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  };

  return (
    <AppSidebar>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Recomendações Assistidas</h1>
          <p className="text-sm text-muted-foreground mt-1">Sugestões para melhorar sua carteira — você decide o que fazer</p>
        </div>

        <div className="space-y-4">
          {mockRecommendations.map((rec) => {
            const status = statuses[rec.id];
            return (
              <div key={rec.id} className={`bg-card border border-border rounded-xl p-6 shadow-card transition-opacity ${status !== "pending" ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Prioridade {rec.priority}
                      </span>
                      <span className={`text-xs font-medium ${urgencyColor[rec.urgency as keyof typeof urgencyColor]}`}>
                        Urgência: {rec.urgency}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-lg text-foreground">{rec.title}</h3>
                  </div>
                  {status !== "pending" && (
                    <span className="text-xs font-medium text-muted-foreground capitalize bg-secondary px-2 py-1 rounded-md">
                      {status === "accepted" ? "✓ Aceita" : status === "deferred" ? "⏳ Adiada" : "✕ Descartada"}
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Por quê?</p>
                    <p className="text-sm text-foreground">{rec.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Ação sugerida</p>
                    <p className="text-sm text-foreground">{rec.action}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Impacto esperado</p>
                    <p className="text-sm text-foreground">{rec.impact}</p>
                  </div>
                </div>

                {status === "pending" && (
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Button variant="success" size="sm" onClick={() => setStatus(rec.id, "accepted")}>
                      <CheckCircle2 className="w-4 h-4" /> Aceitar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStatus(rec.id, "deferred")}>
                      <Clock className="w-4 h-4" /> Adiar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setStatus(rec.id, "dismissed")}>
                      <X className="w-4 h-4" /> Descartar
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Estas são sugestões baseadas na análise da sua carteira e perfil. Não constituem recomendação de investimento. 
            Nenhuma ação é executada automaticamente — você tem total controle sobre suas decisões.
          </p>
        </div>
      </div>
    </AppSidebar>
  );
}
