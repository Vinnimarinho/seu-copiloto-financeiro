import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Check, Zap, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscription, getPlanByProductId, startCheckout, openCustomerPortal, PLANS } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";

const plans = [
  {
    key: "free" as const,
    name: "Gratuito",
    price: "R$ 0",
    period: "",
    desc: "Para conhecer a plataforma",
    features: ["1 carteira", "1 crédito de análise", "Diagnóstico básico", "Sem download de relatórios"],
    note: "Experimente grátis — sem compromisso",
  },
  {
    key: "essencial" as const,
    name: "Essencial",
    price: "R$ 39,99",
    period: "/mês",
    desc: "Para investidores ativos",
    features: ["3 carteiras", "Diagnóstico completo", "20 créditos de análise/mês", "Relatórios PDF", "Oportunidades de melhoria", "Histórico 12 meses"],
    highlight: true,
    note: "Assinatura anual com pagamento mensal (12x de R$ 39,99)",
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "R$ 89",
    period: "/mês",
    desc: "Para quem leva a sério",
    features: ["Carteiras ilimitadas", "Diagnóstico avançado", "100 créditos de análise/mês", "Relatórios completos", "Oportunidades prioritárias", "Histórico completo", "Suporte prioritário"],
    note: "Assinatura anual com pagamento mensal (12x de R$ 89)",
  },
];

export default function Pricing() {
  const { data: subscription, isLoading } = useSubscription();
  const currentPlan = getPlanByProductId(subscription?.product_id ?? null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    const plan = PLANS[planKey as keyof typeof PLANS];
    if (!plan?.price_id) return;
    setLoadingPlan(planKey);
    try {
      await startCheckout(plan.price_id);
    } catch (e) {
      toast.error("Erro ao iniciar checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    setLoadingPlan("manage");
    try {
      await openCustomerPortal();
    } catch {
      toast.error("Erro ao abrir portal de assinatura");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <AppSidebar>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Planos e Preços</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha o plano ideal para suas necessidades</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const isUpgrade = !isCurrent && plan.key !== "free";
            return (
              <div key={plan.key} className={cn(
                "bg-card border rounded-xl p-6 shadow-card flex flex-col",
                plan.highlight ? "border-primary ring-2 ring-primary/20" : "border-border",
                isCurrent && "ring-2 ring-success/30 border-success"
              )}>
                {plan.highlight && !isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-3">
                    <Zap className="w-3 h-3" /> Mais popular
                  </span>
                )}
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success mb-3">
                    <Check className="w-3 h-3" /> Seu plano
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
                {plan.note && (
                  <p className="text-[11px] text-muted-foreground mb-4 text-center">{plan.note}</p>
                )}

                  <Button variant="outline" className="w-full" onClick={handleManage} disabled={loadingPlan === "manage"}>
                    {loadingPlan === "manage" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Gerenciar assinatura</>}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Plano atual</Button>
                ) : isUpgrade ? (
                  <Button
                    variant={plan.highlight ? "hero" : "default"}
                    className="w-full"
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={!!loadingPlan || isLoading}
                  >
                    {loadingPlan === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : `Assinar ${plan.name}`}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {subscription?.subscription_end && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sua assinatura renova em {new Date(subscription.subscription_end).toLocaleDateString("pt-BR")}
            </p>
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
