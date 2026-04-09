import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

const reports = [
  { id: "1", title: "Resumo Executivo", desc: "Visão geral da carteira com principais indicadores", date: "09/04/2026", type: "Resumo" },
  { id: "2", title: "Diagnóstico Detalhado", desc: "Análise completa de riscos, concentração e oportunidades", date: "09/04/2026", type: "Diagnóstico" },
  { id: "3", title: "Plano de Ação", desc: "Recomendações priorizadas com impacto esperado", date: "09/04/2026", type: "Ação" },
];

export default function Reports() {
  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">Exporte análises em PDF para consulta ou compartilhamento</p>
        </div>

        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.date}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" /> PDF
              </Button>
            </div>
          ))}
        </div>

        <Button variant="default" className="w-full">Gerar novo relatório</Button>
      </div>
    </AppSidebar>
  );
}
