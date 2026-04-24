import { AlertTriangle } from "lucide-react";

/**
 * Aviso de compliance da feature Simulações. Obrigatório em todas as telas
 * que mostram resultados de simulação.
 */
export function SimulationDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex gap-2 items-start text-xs text-muted-foreground bg-muted/30 border border-border/60 rounded-lg p-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <p className={compact ? "leading-snug" : "leading-relaxed"}>
        As simulações têm caráter informativo e educacional, baseadas em parâmetros de mercado e
        hipóteses definidas pelo usuário. Não representam garantia de retorno nem substituem
        avaliação profissional regulada quando necessária.
      </p>
    </div>
  );
}
