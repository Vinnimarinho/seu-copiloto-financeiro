import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2 } from "lucide-react";
import { useReports, useGenerateReport, useReportDownload, useLatestAnalysis } from "@/hooks/usePortfolio";
import { useNavigate } from "react-router-dom";
import { usePlanAccess } from "@/hooks/usePlanAccess";
import { PaidFeatureOverlay } from "@/components/PaidFeatureOverlay";
import { useTranslation } from "react-i18next";

export default function Reports() {
  const { t, i18n } = useTranslation();
  const { data: dbReports, isLoading } = useReports();
  const { data: latestAnalysis } = useLatestAnalysis();
  const { canGenerateReports, isLoading: planLoading } = usePlanAccess();
  const generate = useGenerateReport();
  const download = useReportDownload();
  const navigate = useNavigate();
  const dateLocale = i18n.language?.startsWith("en") ? "en-US" : "pt-BR";

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
            <h1 className="font-heading text-2xl font-bold text-foreground">{t("reports.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("reports.subtitle")}</p>
          </div>
          {canGenerateReports && hasAnalysis && (
            <Button onClick={() => generate.mutate()} disabled={generate.isPending} className="gap-2">
              {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              {t("reports.generate")}
            </Button>
          )}
        </div>

        {!canGenerateReports && (
          <PaidFeatureOverlay
            active
            plan="essencial"
            title={t("reports.paidTitle")}
            description={t("reports.paidDesc")}
          >
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{t("reports.previewTitle")}</h3>
                  <p className="text-xs text-muted-foreground">{t("reports.previewDesc")}</p>
                </div>
              </div>
              <div className="h-32 bg-secondary/40 rounded-lg" />
              <div className="h-24 bg-secondary/40 rounded-lg" />
            </div>
          </PaidFeatureOverlay>
        )}

        {canGenerateReports && (
          <p className="text-[11px] text-muted-foreground -mt-2">{t("reports.acceptedNote")}</p>
        )}

        {canGenerateReports && !hasAnalysis && (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <h2 className="font-heading text-lg font-semibold text-foreground">{t("reports.noAnalysisTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("reports.noAnalysisDesc")}</p>
            <Button onClick={() => navigate("/portfolio/import")}>{t("reports.importBtn")}</Button>
          </div>
        )}

        {canGenerateReports && hasAnalysis && !hasReports && (
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
            <h2 className="font-heading text-lg font-semibold text-foreground">{t("reports.empty")}</h2>
            <p className="text-sm text-muted-foreground">{t("reports.emptyDesc")}</p>
          </div>
        )}

        {hasReports && (
          <div className="space-y-3">
            {dbReports.map((r) => {
              const formatted = new Intl.DateTimeFormat(dateLocale, {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).format(new Date(r.created_at));
              const ready = r.status === "generated" && !!r.file_url;
              const statusLabel = ready
                ? t("reports.ready")
                : r.status === "generating"
                ? t("reports.generatingStatus")
                : t("reports.errorStatus");
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
                      <p className="text-xs text-muted-foreground mt-0.5">{statusLabel}</p>
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
                    {t("reports.pdfBtn")}
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
