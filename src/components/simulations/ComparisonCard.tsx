import { Card } from "@/components/ui/card";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComparisonMetric {
  label: string;
  baseline: string;
  scenario: string;
  delta?: string;
  /** "good" = melhor; "bad" = pior; "neutral" = informativo. Use sob a ótica do investidor. */
  tone?: "good" | "bad" | "neutral";
}

interface Props {
  metrics: ComparisonMetric[];
}

export function ComparisonCard({ metrics }: Props) {
  return (
    <Card className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs uppercase tracking-wide text-muted-foreground mb-3">
        <span>Métrica</span>
        <span className="text-center">Hoje</span>
        <span className="text-center">Se você mover</span>
      </div>
      <div className="space-y-2">
        {metrics.map((m) => {
          const Icon = m.tone === "good" ? ArrowUp : m.tone === "bad" ? ArrowDown : ArrowRight;
          const toneColor =
            m.tone === "good"
              ? "text-emerald-400"
              : m.tone === "bad"
              ? "text-red-400"
              : "text-muted-foreground";
          return (
            <div
              key={m.label}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center py-3 border-t border-border/60"
            >
              <span className="text-sm font-medium text-foreground">{m.label}</span>
              <span className="text-center text-sm text-muted-foreground">{m.baseline}</span>
              <span className="text-center text-sm font-semibold text-foreground flex items-center justify-center gap-2">
                {m.scenario}
                {m.delta && (
                  <span className={cn("inline-flex items-center text-xs", toneColor)}>
                    <Icon className="w-3 h-3" />
                    {m.delta}
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
