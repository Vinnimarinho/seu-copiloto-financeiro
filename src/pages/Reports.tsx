import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useReports } from "@/hooks/usePortfolio";

const mockReports = [
  { id: "1", title: "Resumo Executivo", description: "Visão geral da carteira com principais indicadores", created_at: "2026-04-09", report_type: "Resumo" },
  { id: "2", title: "Diagnóstico Detalhado", description: "Análise completa de riscos, concentração e oportunidades", created_at: "2026-04-09", report_type: "Diagnóstico" },
  { id: "3", title: "Plano de Ação", description: "Recomendações priorizadas com impacto esperado", created_at: "2026-04-09", report_type: "Ação" },
];

export default function Reports() {
  const { data: dbReports, isLoading } = useReports();
  const reports = dbReports && dbReports.length > 0
    ? dbReports.map(r => ({ id: r.id, title: r.title, description: r.report_type, created_at: r.created_at.slice(0, 10), report_type: r.report_type, file_url: r.file_url, status: r.status }))
    : mockReports;

  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Exporte análises em PDF para consulta ou compartilhamento</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-sm text-foreground">{r.title}</h3>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.created_at}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={!("file_url" in r && r.file_url)}>
                  <Download className="w-4 h-4" /> PDF
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="default" className="w-full">Gerar novo relatório</Button>
      </div>
    </AppSidebar>
  );
}
