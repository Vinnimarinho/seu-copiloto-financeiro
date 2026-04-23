import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Sparkles, Lock } from "lucide-react";
import { useReports, useGenerateReport, useReportDownload, useLatestAnalysis } from "@/hooks/usePortfolio";
import { useNavigate } from "react-router-dom";
import { usePlanAccess } from "@/hooks/usePlanAccess";

export default function Reports() {
  const { data: dbReports, isLoading } = useReports();
  const { data: latestAnalysis } = useLatestAnalysis();
  const { canGenerateReports, isLoading: planLoading } = usePlanAccess();
  const generate = useGenerateReport();
  const download = useReportDownload();
  const navigate = useNavigate();

  if (isLoading || planLoading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppSidebar>
    );
  }

  const hasReports = dbReports && dbReports.length > 0;
  const hasAnalysis = !!latestAnalysis;

  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              PDFs gerados a partir do diagnóstico mais recente da sua carteira.
            </p>
          </div>
          {canGenerateReports && hasAnalysis && (
            <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="gap-2">
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Gerar PDF
            </Button>
          )}
        </div>

        {!canGenerateReports && (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-heading text-lg font-semibold text-foreground">Relatórios PDF estão nos planos pagos</h2>
            <p className="text-sm text-muted-foreground">
              Faça upgrade para gerar relatórios PDF com a identidade do LUCIUS, contendo diagnóstico,
              posições e somente as oportunidades que você aceitou.
            </p>
            <Button onClick={() => navigate("/pricing")} className="gap-2">
              <Sparkles className="w-4 h-4" /> Ver planos
            </Button>
          </div>
        )}

        {canGenerateReports && (
          <p className="text-[11px] text-muted-foreground -mt-2">
            O PDF inclui apenas as oportunidades que você marcou como aceitas.
          </p>
        )}

        {canGenerateReports && !hasAnalysis && (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">Nenhum diagnóstico disponível</h2>
            <p className="text-sm text-muted-foreground">
              Importe sua carteira e rode um diagnóstico para liberar a geração de PDF.
            </p>
            <Button onClick={() => navigate("/portfolio/import")}>Importar carteira</Button>
          </div>
        )}

        {canGenerateReports && hasAnalysis && !hasReports && (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
            <h2 className="font-heading text-lg font-semibold text-foreground">Nenhum PDF gerado ainda</h2>
            <p className="text-sm text-muted-foreground">
              Clique em "Gerar PDF" para produzir o primeiro relatório do seu diagnóstico atual.
            </p>
          </div>
        )}

        {hasReports && (
          <div className="space-y-3">
            {dbReports.map((r) => {
              const formatted = new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(r.created_at));
              const ready = r.status === "generated" && !!r.file_url;
              return (
                <div
                  key={r.id}
                  className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading font-semibold text-sm text-foreground truncate">{r.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {r.report_type} · {formatted}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ready ? "Pronto" : r.status === "generating" ? "Gerando..." : "Erro"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!ready || download.isPending}
                    onClick={() => ready && download.mutate(r.id)}
                    className="gap-2"
                  >
                    {download.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    PDF
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
