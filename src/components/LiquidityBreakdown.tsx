import { Droplets, Lock, Clock, AlertCircle } from "lucide-react";
import { getScoreClass } from "@/lib/scoreClassification";

export interface LiquidityPosition {
  ticker: string;
  name?: string | null;
  asset_class?: string | null;
  current_value?: number | null;
  avg_price?: number | null;
  quantity?: number | null;
  liquidity?: string | null;
}

interface Props {
  positions: LiquidityPosition[];
}

/** Classifica cada posição em uma faixa de score 0-100 baseado no campo liquidity */
function liquidityScoreFor(raw?: string | null): { score: number; bucket: string; settlement: string; lockup: string; note?: string } {
  const liq = (raw || "").toUpperCase().trim();

  if (!liq || liq === "N/A") {
    return { score: 50, bucket: "Não informada", settlement: "—", lockup: "—", note: "Liquidez não informada" };
  }
  if (liq.includes("D+0") || liq === "IMEDIATA") {
    return { score: 95, bucket: "Imediata", settlement: "D+0", lockup: "Sem carência" };
  }
  if (liq.includes("D+1")) {
    return { score: 90, bucket: "Curta", settlement: "D+1", lockup: "Sem carência" };
  }
  if (liq.includes("D+2") || liq.includes("D+3")) {
    return { score: 80, bucket: "Curta", settlement: liq, lockup: "Sem carência" };
  }
  if (liq.includes("D+30")) {
    return { score: 65, bucket: "Média", settlement: "D+30", lockup: "Possível carência" };
  }
  if (liq.includes("D+60") || liq.includes("D+90")) {
    return { score: 50, bucket: "Média", settlement: liq, lockup: "Carência possível", note: "Resgate em até 90 dias" };
  }
  if (liq.includes("D+180")) {
    return { score: 35, bucket: "Longa", settlement: "D+180", lockup: "Carência prolongada", note: "Resgate em até 180 dias" };
  }
  if (liq.includes("VENCIMENTO") || liq.includes("VCTO")) {
    return { score: 20, bucket: "Vencimento", settlement: "No vencimento", lockup: "Travado até o vencimento", note: "Sem liquidez intermediária" };
  }
  return { score: 55, bucket: liq, settlement: liq, lockup: "—" };
}

export function LiquidityBreakdown({ positions }: Props) {
  if (!positions || positions.length === 0) return null;

  const total = positions.reduce(
    (s, p) => s + (Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0),
    0,
  );

  const rows = positions
    .map((p) => {
      const value = Number(p.current_value) || Number(p.avg_price) * Number(p.quantity) || 0;
      const pct = total > 0 ? Math.round((value / total) * 100) : 0;
      const liq = liquidityScoreFor(p.liquidity);
      return { ...p, value, pct, ...liq };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-heading font-semibold text-sm text-foreground mb-1 flex items-center gap-1.5">
        <Droplets className="w-3.5 h-3.5 text-primary" /> Liquidez por posição
      </h3>
      <p className="text-[10px] text-muted-foreground mb-3">
        Detalhamento de prazo, carência e liquidação por ativo. Score 0–100 por posição.
      </p>

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="px-2 py-2 font-medium">Ativo</th>
              <th className="px-2 py-2 font-medium text-right">% carteira</th>
              <th className="px-2 py-2 font-medium">Prazo</th>
              <th className="px-2 py-2 font-medium hidden sm:table-cell">Liquidação</th>
              <th className="px-2 py-2 font-medium hidden md:table-cell">Carência</th>
              <th className="px-2 py-2 font-medium text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cls = getScoreClass(r.score);
              return (
                <tr key={r.ticker} className="border-b border-border/40 last:border-0">
                  <td className="px-2 py-2">
                    <p className="font-medium text-foreground">{r.ticker}</p>
                    {r.asset_class && (
                      <p className="text-[10px] text-muted-foreground">{r.asset_class}</p>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right text-foreground">{r.pct}%</td>
                  <td className="px-2 py-2 text-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" /> {r.bucket}
                    </span>
                  </td>
                  <td className="px-2 py-2 hidden sm:table-cell text-muted-foreground">{r.settlement}</td>
                  <td className="px-2 py-2 hidden md:table-cell text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {r.lockup.toLowerCase().includes("trav") || r.lockup.toLowerCase().includes("carência prol") ? (
                        <Lock className="w-3 h-3 text-warning" />
                      ) : null}
                      {r.lockup}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${cls.bgClass} ${cls.textClass}`}
                    >
                      {r.score} · {cls.label}
                    </span>
                    {r.note && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 justify-end">
                        <AlertCircle className="w-2.5 h-2.5" /> {r.note}
                      </p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-muted-foreground mt-3">
        Faixas de score: 0–40 Ruim · 41–60 Atenção · 61–80 Bom · 81–100 Excelente.
      </p>
    </div>
  );
}
