import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, FileText, File, CheckCircle2, Loader2, X, Sparkles, CalendarRange } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInvestorProfile, useProfile, useUploadPortfolioFile } from "@/hooks/usePortfolio";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRunPortfolioDiagnosis } from "@/hooks/usePortfolioAnalysis";
import { AnalysisLoading } from "@/components/AnalysisLoading";

const formats = [
  { icon: <FileSpreadsheet className="w-8 h-8" />, name: "CSV", desc: "Extrato de corretora em CSV" },
  { icon: <FileSpreadsheet className="w-8 h-8" />, name: "XLSX", desc: "Planilha Excel com posições" },
  { icon: <File className="w-8 h-8" />, name: "OFX", desc: "Arquivo bancário OFX/OFC" },
  { icon: <FileText className="w-8 h-8" />, name: "PDF", desc: "Extrato ou nota de corretagem" },
];

const ACCEPTED = ".csv,.xlsx,.xls,.ofx,.ofc,.pdf";

type FileStatus = "uploading" | "uploaded" | "processing" | "done" | "error";

interface UploadedFile {
  file: File;
  status: FileStatus;
  path?: string;
  error?: string;
}

interface ProcessResult {
  positionsCount: number;
  recommendationsCount: number;
  analysisId?: string;
  periodLabel: string;
}

const toDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatPeriodLabel = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${formatter.format(start)} a ${formatter.format(end)}`;
};

export default function PortfolioImport() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [periodStart, setPeriodStart] = useState(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    return toDateInputValue(start);
  });
  const [periodEnd, setPeriodEnd] = useState(() => toDateInputValue(new Date()));
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadPortfolioFile();
  const diagnosisMutation = useRunPortfolioDiagnosis();
  const { data: profile } = useProfile();
  const { data: investorProfile } = useInvestorProfile();
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const isPeriodValid = !!periodStart && !!periodEnd && periodStart <= periodEnd;
  const uploadedFile = files.find((file) => file.status === "uploaded" && file.path);
  const isBusy = uploadMutation.isPending || diagnosisMutation.isPending || files.some((file) => file.status === "uploading" || file.status === "processing");
  const canAnalyze = !!uploadedFile && isPeriodValid && !!profile?.onboarding_completed && !!investorProfile && !isBusy;
  const periodLabel = useMemo(() => {
    if (!isPeriodValid) return "";
    return formatPeriodLabel(periodStart, periodEnd);
  }, [isPeriodValid, periodEnd, periodStart]);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const [file] = Array.from(fileList);
    if (!file) return;

    setFiles([{ file, status: "uploading" }]);
    setProcessResult(null);

    try {
      const path = await uploadMutation.mutateAsync(file);
      setFiles([{ file, status: "uploaded", path }]);
      toast.info("Arquivo pronto. Configure o período e inicie a análise da performance da carteira.");
    } catch (e) {
      setFiles([{ file, status: "error", error: (e as Error).message }]);
      toast.error(`Erro: ${(e as Error).message}`);
    }
  }, [uploadMutation]);

  const handleRunDiagnosis = useCallback(async () => {
    if (!uploadedFile?.path) {
      toast.error("Envie um arquivo antes de iniciar a análise.");
      return;
    }

    if (!profile?.onboarding_completed) {
      toast.error("Complete seu perfil de investidor antes de rodar o diagnóstico.");
      return;
    }

    if (!isPeriodValid) {
      toast.error("Informe um período válido para a análise.");
      return;
    }

    setFiles((current) => current.map((file) => file.file === uploadedFile.file ? { ...file, status: "processing", error: undefined } : file));
    setProcessResult(null);

    try {
      const result = await diagnosisMutation.mutateAsync({
        filePath: uploadedFile.path,
        fileName: uploadedFile.file.name,
        analysisPeriod: {
          startDate: periodStart,
          endDate: periodEnd,
          label: periodLabel,
        },
      });

      setFiles((current) => current.map((file) => file.file === uploadedFile.file ? { ...file, status: "done" } : file));
      setProcessResult({
        positionsCount: result.positionsCount || 0,
        recommendationsCount: result.recommendationsCount || 0,
        analysisId: result.analysisId,
        periodLabel,
      });
      toast.success("Diagnóstico pronto! Redirecionando...");
    } catch (e) {
      setFiles((current) => current.map((file) => file.file === uploadedFile.file ? { ...file, status: "error", error: (e as Error).message } : file));
      toast.error(`Erro: ${(e as Error).message}`);
    }
  }, [diagnosisMutation, isPeriodValid, periodEnd, periodLabel, periodStart, profile?.onboarding_completed, uploadedFile, uploadedFile?.path]);

  const removeFile = (file: File) => setFiles(prev => prev.filter(f => f.file !== file));

  const statusLabel: Record<FileStatus, string> = {
    uploading: "Enviando...",
    uploaded: "Pronto para diagnóstico",
    processing: "Analisando com IA...",
    done: "Análise completa",
    error: "Erro",
  };

  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Importar Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">Envie seus extratos e posições para análise automática com IA</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer bg-card ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          onClick={() => !isBusy && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length && !isBusy) handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-heading font-semibold text-foreground mb-1">Envie o arquivo que será a base do diagnóstico</p>
          <p className="text-sm text-muted-foreground mb-4">Após o upload, você escolhe o período e aciona manualmente a inteligência do sistema</p>
          <Button variant="outline" size="sm" type="button" disabled={isBusy}>Selecionar arquivo</Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-card">
          <div>
            <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-primary" /> Configurar diagnóstico
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              O sistema vai cruzar o arquivo enviado com o período analisado e seu perfil de investidor para montar diagnóstico e recomendações.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="period-start" className="text-sm font-medium text-foreground">Data inicial</label>
              <Input id="period-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} max={periodEnd} />
            </div>
            <div className="space-y-2">
              <label htmlFor="period-end" className="text-sm font-medium text-foreground">Data final</label>
              <Input id="period-end" type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} min={periodStart} max={toDateInputValue(new Date())} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            {profile?.onboarding_completed
              ? "Seu perfil investidor já será usado como contexto para personalizar as recomendações." 
              : "Antes do diagnóstico, complete o perfil do investidor para liberar recomendações personalizadas."}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {!profile?.onboarding_completed && (
              <Button variant="outline" onClick={() => navigate("/onboarding")}>
                Completar perfil investidor
              </Button>
            )}
            <Button onClick={handleRunDiagnosis} disabled={!canAnalyze} className="gap-2 sm:min-w-[260px]">
              {diagnosisMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Executar diagnóstico completo
            </Button>
          </div>

          {!canAnalyze && !isBusy && (
            <div className="space-y-1">
              {!uploadedFile && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">❌ Envie o arquivo da carteira</p>
              )}
              {uploadedFile && (
                <p className="text-xs text-success flex items-center gap-1">✅ Arquivo enviado</p>
              )}
              {!isPeriodValid && (
                <p className="text-xs text-destructive flex items-center gap-1">❌ Informe um período válido (data inicial ≤ data final)</p>
              )}
              {isPeriodValid && (
                <p className="text-xs text-success flex items-center gap-1">✅ Período configurado</p>
              )}
              {!profile?.onboarding_completed && (
                <p className="text-xs text-destructive flex items-center gap-1">❌ Complete o perfil do investidor (onboarding)</p>
              )}
              {profile?.onboarding_completed && (
                <p className="text-xs text-success flex items-center gap-1">✅ Perfil do investidor completo</p>
              )}
              {!investorProfile && (
                <p className="text-xs text-destructive flex items-center gap-1">❌ Perfil investidor não encontrado</p>
              )}
              {investorProfile && (
                <p className="text-xs text-success flex items-center gap-1">✅ Perfil investidor encontrado</p>
              )}
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-heading font-semibold text-sm text-foreground">Arquivo enviado</h2>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
                <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(f.file.size / 1024).toFixed(0)} KB · {statusLabel[f.status]}
                  </p>
                </div>
                {(f.status === "uploading" || f.status === "processing") && (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                )}
                {f.status === "processing" && (
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                )}
                {f.status === "done" && <CheckCircle2 className="w-5 h-5 text-success" />}
                {f.status === "error" && (
                  <span className="text-xs text-destructive max-w-[200px] truncate">{f.error || "Erro"}</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); removeFile(f.file); }} className="text-muted-foreground hover:text-foreground" disabled={isBusy}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Result + navigation */}
        {processResult && processResult.positionsCount > 0 && (
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-heading font-bold text-foreground">Análise concluída!</h3>
                <p className="text-sm text-muted-foreground">
                  {processResult.positionsCount} posições identificadas · {processResult.recommendationsCount} recomendações geradas
                </p>
                <p className="text-xs text-muted-foreground mt-1">Período analisado: {processResult.periodLabel}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/diagnosis")} size="sm" className="gap-1">
                Ver Diagnóstico <ArrowRight className="w-4 h-4" />
              </Button>
              <Button onClick={() => navigate("/dashboard")} variant="outline" size="sm">
                Ver Dashboard
              </Button>
              <Button onClick={() => navigate("/recommendations")} variant="outline" size="sm">
                Ver Recomendações
              </Button>
            </div>
          </div>
        )}

        {/* Supported formats */}
        <div>
          <h2 className="font-heading font-semibold text-sm text-foreground mb-3">Formatos aceitos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {formats.map((f) => (
              <div key={f.name} className="bg-card border border-border rounded-lg p-4 text-center shadow-card">
                <div className="text-muted-foreground mb-2 flex justify-center">{f.icon}</div>
                <p className="font-heading font-semibold text-sm text-foreground">{f.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Seus dados são criptografados e nunca compartilhados. Usados exclusivamente para análise da sua carteira.
        </p>
      </div>
    </AppSidebar>
  );
}
