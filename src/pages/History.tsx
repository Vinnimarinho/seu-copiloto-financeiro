import { AppSidebar } from "@/components/AppSidebar";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const { data: analyses, isLoading } = useAnalysesHistory();
  const navigate = useNavigate();
  const dateLocale = i18n.language?.startsWith("en") ? "en-US" : "pt-BR";

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
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("history.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("history.subtitle")}</p>
        </div>

        {!hasData ? (
          <div className="max-w-lg mx-auto text-center space-y-4 py-20">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="font-heading text-xl font-bold text-foreground">{t("history.emptyTitle")}</h2>
            <p className="text-muted-foreground">{t("history.emptyDesc")}</p>
            <Button onClick={() => navigate("/portfolio/import")}>{t("history.importBtn")}</Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">{t("history.th.date")}</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">{t("history.th.status")}</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">{t("history.th.risk")}</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">{t("history.th.diversification")}</th>
                  <th className="text-center text-xs font-medium text-muted-foreground p-4">{t("history.th.liquidity")}</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">{t("history.th.summary")}</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((a) => {
                  const date = new Date(a.created_at);
                  const formatted = new Intl.DateTimeFormat(dateLocale, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
                  const statusLabel =
                    a.status === "completed" ? t("history.status.completed") :
                    a.status === "error" ? t("history.status.error") :
                    t("history.status.processing");
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="text-sm text-foreground p-4 whitespace-nowrap">{formatted}</td>
                      <td className="text-center p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${a.status === "completed" ? "bg-success/10 text-success" : a.status === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                          {statusLabel}
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
