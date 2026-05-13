import { useMemo } from "react";
import { formatCurrency } from "@/data/mockData";
import { TrendingUp, TrendingDown, Minus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ExcelJS from "exceljs";

interface Position {
  id: string;
  ticker: string;
  name: string;
  asset_class: string;
  avg_price: number;
  quantity: number;
  current_value: number | null;
  current_price: number | null;
  created_at: string;
  entry_date: string | null;
}

function diagLabel(pct: number): { text: string; color: string } {
  if (pct >= 20) return { text: "Excelente", color: "text-primary" };
  if (pct >= 5) return { text: "Bom", color: "text-primary" };
  if (pct >= 0) return { text: "Estável", color: "text-muted-foreground" };
  if (pct >= -10) return { text: "Atenção", color: "text-yellow-500" };
  return { text: "Crítico", color: "text-destructive" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

export default function PortfolioTracker({ positions }: { positions: Position[] }) {
  const rows = useMemo(() => {
    if (!positions?.length) return [];
    return positions.map((p) => {
      const invested = Number(p.avg_price) * Number(p.quantity);
      const current = Number(p.current_value) || invested;
      const gain = current - invested;
      const pct = invested > 0 ? (gain / invested) * 100 : 0;
      const diag = diagLabel(pct);
      const displayDate = p.entry_date || p.created_at;
      return {
        ticker: p.ticker,
        name: p.name,
        asset_class: p.asset_class,
        date: displayDate,
        invested,
        current,
        gain,
        pct,
        diag,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [positions]);

  const totals = useMemo(() => {
    const inv = rows.reduce((s, r) => s + r.invested, 0);
    const cur = rows.reduce((s, r) => s + r.current, 0);
    return { invested: inv, current: cur, gain: cur - inv, pct: inv > 0 ? ((cur - inv) / inv) * 100 : 0 };
  }, [rows]);

  async function exportXLS() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Carteira");
    ws.columns = [
      { header: "Ativo", key: "ticker", width: 10 },
      { header: "Nome", key: "name", width: 25 },
      { header: "Classe", key: "asset_class", width: 15 },
      { header: "Data Entrada", key: "date", width: 14 },
      { header: "Valor Investido (R$)", key: "invested", width: 16 },
      { header: "Valor Atual (R$)", key: "current", width: 16 },
      { header: "Ganho/Perda (R$)", key: "gain", width: 16 },
      { header: "Retorno (%)", key: "pct", width: 12 },
      { header: "Diagnóstico", key: "diag", width: 12 },
    ];
    rows.forEach((r) => {
      ws.addRow({
        ticker: r.ticker,
        name: r.name,
        asset_class: r.asset_class,
        date: formatDate(r.date),
        invested: Number(r.invested.toFixed(2)),
        current: Number(r.current.toFixed(2)),
        gain: Number(r.gain.toFixed(2)),
        pct: Number(r.pct.toFixed(2)),
        diag: r.diag.text,
      });
    });
    ws.addRow({
      ticker: "TOTAL",
      invested: Number(totals.invested.toFixed(2)),
      current: Number(totals.current.toFixed(2)),
      gain: Number(totals.gain.toFixed(2)),
      pct: Number(totals.pct.toFixed(2)),
    });
    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carteira_lucius_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!rows.length) return null;

  const totalDiag = diagLabel(totals.pct);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-bold text-foreground">Acompanhamento da Carteira</h2>
          <p className="text-xs text-muted-foreground">Como cada investimento se saiu desde a entrada</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportXLS} className="gap-1.5">
          <Download className="w-3.5 h-3.5" />
          Exportar XLS
        </Button>
      </div>

      {/* Summary banner */}
      <div className="flex items-center gap-4 bg-background/50 border border-border rounded-lg px-4 py-2.5">
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Investido</p>
          <p className="font-heading text-sm font-bold text-foreground">{formatCurrency(totals.invested)}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Valor Atual</p>
          <p className="font-heading text-sm font-bold text-foreground">{formatCurrency(totals.current)}</p>
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Resultado</p>
          <p className={`font-heading text-sm font-bold ${totals.gain >= 0 ? "text-primary" : "text-destructive"}`}>
            {totals.gain >= 0 ? "+" : ""}{formatCurrency(totals.gain)} ({totals.pct >= 0 ? "+" : ""}{totals.pct.toFixed(1)}%)
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Diagnóstico</p>
          <p className={`font-heading text-sm font-bold ${totalDiag.color}`}>{totalDiag.text}</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-2 font-medium">Ativo</th>
              <th className="text-left py-2 font-medium hidden sm:table-cell">Classe</th>
              <th className="text-left py-2 font-medium">Entrada</th>
              <th className="text-right py-2 font-medium">Investido</th>
              <th className="text-right py-2 font-medium">Atual</th>
              <th className="text-right py-2 font-medium">Resultado</th>
              <th className="text-center py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.ticker} className="border-b border-border/50 hover:bg-background/30 transition-colors">
                <td className="py-2">
                  <p className="font-medium text-foreground">{r.ticker}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{r.name}</p>
                </td>
                <td className="py-2 text-muted-foreground hidden sm:table-cell">{r.asset_class}</td>
                <td className="py-2 text-muted-foreground">{formatDate(r.date)}</td>
                <td className="py-2 text-right text-foreground">{formatCurrency(r.invested)}</td>
                <td className="py-2 text-right text-foreground">{formatCurrency(r.current)}</td>
                <td className="py-2 text-right">
                  <span className={`inline-flex items-center gap-0.5 ${r.gain >= 0 ? "text-primary" : "text-destructive"}`}>
                    {r.gain > 0 ? <TrendingUp className="w-3 h-3" /> : r.gain < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {r.pct >= 0 ? "+" : ""}{r.pct.toFixed(1)}%
                  </span>
                </td>
                <td className="py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${r.diag.color} border-current/20 bg-current/5`}>
                    {r.diag.text}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
