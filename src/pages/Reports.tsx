import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Upload } from "lucide-react";
import { useReports } from "@/hooks/usePortfolio";
import { useNavigate } from "react-router-dom";

export default function Reports() {
  const { data: dbReports, isLoading } = useReports();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppSidebar>
    );
  }

  const hasReports = dbReports && dbReports.length > 0;

  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Relatórios gerados a partir dos diagnósticos da sua carteira</p>
        </div>

        {!hasReports ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card space-y-4">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="font-heading text-xl font-semibold text-foreground">Nenhum relatório gerado</h2>
            <p className="text-sm text-muted-foreground">
              Execute um diagnóstico completo da sua carteira para gerar relatórios automaticamente.
            </p>
            <Button onClick={() => navigate("/portfolio/import")}>Importar carteira</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {dbReports.map((r) => {
              const date = new Date(r.created_at);
              const formatted = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
              return (
                <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-sm text-foreground">{r.title}</h3>
                      <p className="text-xs text-muted-foreground">{r.report_type} · {formatted}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.status === "generated" ? "✅ Pronto" : r.status === "generating" ? "⏳ Gerando..." : "❌ Erro"}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled={!r.file_url}>
                    <Download className="w-4 h-4" /> PDF
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
