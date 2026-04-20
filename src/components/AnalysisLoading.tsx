import { Loader2, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface Step {
  label: string;
  /** Tempo aproximado em segundos para concluir essa etapa */
  estSec: number;
}

const STEPS: Step[] = [
  { label: "Recebendo dados", estSec: 3 },
  { label: "Organizando posições", estSec: 6 },
  { label: "Avaliando performance da carteira", estSec: 12 },
  { label: "Identificando oportunidades", estSec: 10 },
  { label: "Gerando diagnóstico", estSec: 6 },
];

const TOTAL_SEC = STEPS.reduce((s, x) => s + x.estSec, 0);

interface Props {
  title?: string;
  subtitle?: string;
}

/**
 * Loading visual exibido durante a análise da performance da carteira.
 * Avança etapas em ritmo estimado para dar percepção de progresso.
 */
export function AnalysisLoading({ title = "Analisando a performance da sua carteira", subtitle }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Determina a etapa atual com base no tempo decorrido
  let acc = 0;
  let currentIdx = 0;
  for (let i = 0; i < STEPS.length; i++) {
    acc += STEPS[i].estSec;
    if (elapsed < acc) {
      currentIdx = i;
      break;
    }
    currentIdx = STEPS.length - 1;
  }

  const progress = Math.min(99, Math.round((elapsed / TOTAL_SEC) * 100));
  const remaining = Math.max(0, TOTAL_SEC - elapsed);

  return (
    <div className="max-w-md mx-auto bg-card border border-border rounded-xl p-6 space-y-5 shadow-card">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
        <h2 className="font-heading font-bold text-foreground text-lg mt-2">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>{progress}%</span>
          <span>~ {remaining}s restantes</span>
        </div>
      </div>

      <ul className="space-y-2">
        {STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li key={step.label} className="flex items-center gap-2 text-sm">
              {done ? (
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              ) : active ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
              )}
              <span
                className={
                  done
                    ? "text-muted-foreground line-through"
                    : active
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
                }
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-center text-muted-foreground">
        Não feche esta tela. Em poucos instantes seu diagnóstico estará pronto.
      </p>
    </div>
  );
}
