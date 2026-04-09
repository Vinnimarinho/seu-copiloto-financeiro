import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, FileText, File } from "lucide-react";

const formats = [
  { icon: <FileSpreadsheet className="w-8 h-8" />, name: "CSV", desc: "Extrato de corretora em CSV" },
  { icon: <FileSpreadsheet className="w-8 h-8" />, name: "XLSX", desc: "Planilha Excel com posições" },
  { icon: <File className="w-8 h-8" />, name: "OFX", desc: "Arquivo bancário OFX/OFC" },
  { icon: <FileText className="w-8 h-8" />, name: "PDF", desc: "Extrato ou nota de corretagem" },
];

export default function PortfolioImport() {
  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Importar Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">Envie seus extratos e posições para análise</p>
        </div>

        {/* Upload area */}
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-card">
          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="font-heading font-semibold text-foreground mb-1">Arraste seus arquivos aqui</p>
          <p className="text-sm text-muted-foreground mb-4">ou clique para selecionar</p>
          <Button variant="outline" size="sm">Selecionar arquivos</Button>
        </div>

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
