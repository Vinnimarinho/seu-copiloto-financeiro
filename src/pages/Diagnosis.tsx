import { AppSidebar } from "@/components/AppSidebar";
import { BentoCard, BentoGrid } from "@/components/BentoGrid";
import { mockPortfolio, mockAlerts, formatPercent } from "@/data/mockData";
import { CheckCircle2, AlertTriangle, XCircle, Target } from "lucide-react";

const diagnosisItems = [
  { label: "Aderência ao perfil", score: 72, status: "warning" as const, detail: "Exposição a cripto acima do recomendado para seu perfil moderado." },
  { label: "Concentração", score: 55, status: "warning" as const, detail: "PETR4 representa quase 10% da carteira. O ideal é máximo 5%." },
  { label: "Custos", score: 88, status: "good" as const, detail: "Taxa média de 0,3% ao ano. Dentro do razoável." },
  { label: "Ociosidade de caixa", score: 40, status: "bad" as const, detail: "R$ 8.623 parado sem render. Perde para a inflação." },
  { label: "Redundância", score: 65, status: "warning" as const, detail: "FIIs XPLG11 e HGLG11 têm 60% de sobreposição de imóveis." },
  { label: "Risco/retorno", score: 78, status: "good" as const, detail: "Relação risco/retorno adequada para seu horizonte de longo prazo." },
];

function ScoreBadge({ score, status }: { score: number; status: "good" | "warning" | "bad" }) {
  const config = {
    good: { bg: "bg-success/10", text: "text-success", icon: <CheckCircle2 className="w-4 h-4" /> },
    warning: { bg: "bg-warning/10", text: "text-warning", icon: <AlertTriangle className="w-4 h-4" /> },
    bad: { bg: "bg-destructive/10", text: "text-destructive", icon: <XCircle className="w-4 h-4" /> },
  };
  const c = config[status];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${c.bg}`}>
      <span className={c.text}>{c.icon}</span>
      <span className={`font-heading font-bold text-lg ${c.text}`}>{score}</span>
    </div>
  );
}

export default function Diagnosis() {
  const overallScore = Math.round(diagnosisItems.reduce((a, b) => a + b.score, 0) / diagnosisItems.length);

  return (
    <AppSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Diagnóstico da Carteira</h1>
          <p className="text-sm text-muted-foreground mt-1">Análise detalhada dos pontos fortes e fracos</p>
        </div>

        {/* Overall score */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-card flex items-center gap-6">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center">
            <span className="font-heading text-3xl font-bold text-primary-foreground">{overallScore}</span>
          </div>
          <div>
            <h2 className="font-heading font-semibold text-lg text-foreground">Nota geral da carteira</h2>
            <p className="text-sm text-muted-foreground">Baseado em 6 critérios de análise. Quanto maior, melhor.</p>
          </div>
        </div>

        {/* Diagnosis items */}
        <BentoGrid columns={2}>
          {diagnosisItems.map((item) => (
            <BentoCard key={item.label} title={item.label}>
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.detail}</p>
                <ScoreBadge score={item.score} status={item.status} />
              </div>
              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${item.status === "good" ? "bg-success" : item.status === "warning" ? "bg-warning" : "bg-destructive"}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </BentoCard>
          ))}
        </BentoGrid>

        <p className="text-xs text-muted-foreground text-center">
          Este diagnóstico é uma análise assistida e não constitui recomendação de investimento.
        </p>
      </div>
    </AppSidebar>
  );
}
