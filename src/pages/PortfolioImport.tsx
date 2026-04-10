import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, FileText, File, CheckCircle2, Loader2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useUploadPortfolioFile } from "@/hooks/usePortfolio";

const formats = [
  { icon: <FileSpreadsheet className="w-8 h-8" />, name: "CSV", desc: "Extrato de corretora em CSV" },
  { icon: <FileSpreadsheet className="w-8 h-8" />, name: "XLSX", desc: "Planilha Excel com posições" },
  { icon: <File className="w-8 h-8" />, name: "OFX", desc: "Arquivo bancário OFX/OFC" },
  { icon: <FileText className="w-8 h-8" />, name: "PDF", desc: "Extrato ou nota de corretagem" },
];

const ACCEPTED = ".csv,.xlsx,.xls,.ofx,.ofc,.pdf";

interface UploadedFile {
  file: File;
  status: "uploading" | "done" | "error";
  path?: string;
  error?: string;
}

export default function PortfolioImport() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadPortfolioFile();
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList);
    const entries: UploadedFile[] = newFiles.map(f => ({ file: f, status: "uploading" as const }));
    setFiles(prev => [...prev, ...entries]);

    for (let i = 0; i < newFiles.length; i++) {
      try {
        const path = await uploadMutation.mutateAsync(newFiles[i]);
        setFiles(prev => prev.map(f => f.file === newFiles[i] ? { ...f, status: "done", path } : f));
      } catch (e) {
        setFiles(prev => prev.map(f => f.file === newFiles[i] ? { ...f, status: "error", error: (e as Error).message } : f));
      }
    }
  }, [uploadMutation]);

  const removeFile = (file: File) => setFiles(prev => prev.filter(f => f.file !== file));

  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Importar Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">Envie seus extratos e posições para análise</p>
        </div>

        {/* Upload area */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer bg-card ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-heading font-semibold text-foreground mb-1">Arraste seus arquivos aqui</p>
          <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
          <Button variant="outline" size="sm" type="button">Selecionar arquivos</Button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {/* Uploaded files list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h2 className="font-heading font-semibold text-sm text-foreground">Arquivos enviados</h2>
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3">
                <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                  <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(0)} KB</p>
                </div>
                {f.status === "uploading" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                {f.status === "done" && <CheckCircle2 className="w-5 h-5 text-success" />}
                {f.status === "error" && (
                  <span className="text-xs text-destructive">{f.error || "Erro"}</span>
                )}
                <button onClick={() => removeFile(f.file)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
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
