import { AppSidebar } from "@/components/AppSidebar";
import { formatCurrency } from "@/data/mockData";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function useAnalysesHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analyses_history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, created_at, summary, risk_score, diversification_score, liquidity_score, status, credits_used")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function HistoryPage() {
  const { data: analyses, isLoading } = useAnalysesHistory();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </AppSidebar>
    );
  }

  const hasData = analyses && analyses.length > 0;

  return (
    <AppSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-1">Todos os diagnósticos realizados na sua carteira</p>
        </div>

        {!hasData ? (
          <div className="max-w-lg mx-auto text-center space-y-4 py-20">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="font-heading text-xl font-bold text-foreground">Nenhum diagnóstico realizado</h2>
            <p className="text-muted-foreground">Importe sua carteira e execute o diagnóstico para começar a construir seu histórico.</p>
            <Button onClick={() => navigate("/portfolio/import")}>Importar Carteira</Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Data</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">Risco</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">Diversif.</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">Liquidez</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Resumo</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => {
                  const date = new Date(a.created_at);
                  const formatted = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
                  const overall = Math.round(((Number(a.risk_score) || 0) + (Number(a.diversification_score) || 0) + (Number(a.liquidity_score) || 0)) / 3);
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="text-sm text-foreground p-4 whitespace-nowrap">{formatted}</td>
                      <td className="text-center p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.status === "completed" ? "bg-success/10 text-success" : a.status === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                          {a.status === "completed" ? "Concluído" : a.status === "error" ? "Erro" : "Processando"}
                        </span>
                      </td>
                      <td className="text-sm text-foreground text-center p-4 font-medium">{a.risk_score ?? "–"}</td>
                      <td className="text-sm text-foreground text-center p-4 font-medium">{a.diversification_score ?? "–"}</td>
                      <td className="text-sm text-foreground text-center p-4 font-medium">{a.liquidity_score ?? "–"}</td>
                      <td className="text-sm text-muted-foreground p-4 max-w-[300px] truncate">{a.summary || "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
