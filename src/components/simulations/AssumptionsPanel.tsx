import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import type { SimulationAssumptions } from "@/lib/simulations/types";

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

export function AssumptionsPanel({ assumptions }: { assumptions: SimulationAssumptions }) {
  return (
    <Card className="p-5 bg-muted/20 border-dashed">
      <div className="flex items-start gap-2 mb-3">
        <Info className="w-4 h-4 text-primary mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold text-foreground">Premissas usadas</h4>
          <p className="text-xs text-muted-foreground">
            Horizonte: {assumptions.horizonMonths} meses. Os números são projeções estimadas.
          </p>
        </div>
      </div>

      {assumptions.ratesUsed.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {assumptions.ratesUsed.map((r) => (
            <div key={r.code} className="text-xs bg-background/60 rounded px-2 py-1.5 border border-border/50">
              <div className="font-medium text-foreground">{r.label}</div>
              <div className="text-muted-foreground">{pct(r.annualRate)} a.a.</div>
            </div>
          ))}
        </div>
      )}

      {assumptions.notes.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
          {assumptions.notes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      )}
    </Card>
  );
}
