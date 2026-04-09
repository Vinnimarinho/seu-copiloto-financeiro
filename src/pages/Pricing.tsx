import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    desc: "Para conhecer a plataforma",
    features: ["1 carteira", "Diagnóstico básico", "3 créditos de análise/mês", "Sem relatórios PDF"],
    cta: "Plano atual",
    current: true,
  },
  {
    name: "Essencial",
    price: "R$ 39",
    period: "/mês",
    desc: "Para investidores ativos",
    features: ["3 carteiras", "Diagnóstico completo", "20 créditos de análise/mês", "Relatórios PDF", "Recomendações assistidas", "Histórico 12 meses"],
    cta: "Assinar Essencial",
    highlight: true,
  },
  {
    name: "Pro",
    price: "R$ 89",
    period: "/mês",
    desc: "Para quem leva a sério",
    features: ["Carteiras ilimitadas", "Diagnóstico avançado", "100 créditos de análise/mês", "Relatórios completos", "Recomendações prioritárias", "Histórico completo", "Suporte prioritário"],
    cta: "Assinar Pro",
  },
];

export default function Pricing() {
  return (
    <AppSidebar>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Planos e Preços</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para suas necessidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.name} className={cn(
              "bg-card border rounded-xl p-6 shadow-card flex flex-col",
              plan.highlight ? "border-primary ring-2 ring-primary/20" : "border-border"
            )}>
              {plan.highlight && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-3">
                  <Zap className="w-3 h-3" /> Mais popular
                </span>
              )}
              <h3 className="font-heading font-semibold text-lg text-foreground">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="font-heading text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlight ? "hero" : plan.current ? "outline" : "default"}
                className="w-full"
                disabled={plan.current}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">Precisa de mais créditos?</p>
          <Button variant="link" className="text-sm">Comprar créditos avulsos →</Button>
        </div>
      </div>
    </AppSidebar>
  );
}
