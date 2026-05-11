import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Check, Zap, Loader2, Settings2, Coins, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSubscription,
  getPlanByProductId,
  startCheckout,
  PLANS,
} from "@/hooks/useSubscription";
import { CREDIT_PACKS, buyCreditPack, useTrialStatus } from "@/hooks/useTrialStatus";
import { useUserCredits } from "@/hooks/usePortfolio";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";

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
    features: ["3 carteiras", "Diagnóstico completo", "20 créditos de análise/mês", "Relatórios PDF", "Oportunidades de melhoria", "Calculadora de projeção", "Histórico 12 meses"],
    highlight: true,
    note: "Assinatura anual com pagamento mensal (12x de R$ 39,99)",
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "R$ 89,99",
    period: "/mês",
    desc: "Para quem leva a sério",
    features: ["Carteiras ilimitadas", "Diagnóstico avançado", "100 créditos de análise/mês", "Relatórios completos", "Oportunidades prioritárias", "Calculadora de projeção", "Simulações de cenários", "Histórico completo", "Suporte prioritário"],
    note: "Assinatura anual com pagamento mensal (12x de R$ 89,99)",
  },
];

// USD/EUR ocultos até validação Stripe ponta a ponta (price em multimoeda + KYC live).
// Para reativar: criar prices multimoeda no Stripe, validar checkout/webhook em cada moeda.

export default function Pricing() {
  const { data: subscription, isLoading } = useSubscription();
  const { data: trial } = useTrialStatus();
  const { data: credits } = useUserCredits();
  const currentPlan = getPlanByProductId(subscription?.product_id ?? null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#credits") {
      document.getElementById("credits")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

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

  const handleBuyPack = async (pack: "10" | "50" | "200") => {
    setLoadingPack(pack);
    try {
      await buyCreditPack(pack);
    } catch {
      toast.error("Erro ao iniciar compra de créditos");
    } finally {
      setLoadingPack(null);
    }
  };

  const handleManage = () => navigate("/billing");

  return (
    <AppSidebar>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">Planos e Preços</h1>
          <p className="text-sm text-muted-foreground">Escolha o plano ideal para suas necessidades</p>
          <p className="text-[11px] text-muted-foreground">
            Cobrança em BRL. Pagamento processado pelo Stripe.
          </p>
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
                {isCurrent && currentPlan !== "free" ? (
                  <Button variant="outline" className="w-full" onClick={handleManage} disabled={loadingPlan === "manage"}>
                    <Settings2 className="w-4 h-4" /> Gerenciar assinatura
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

        {/* Pacotes de créditos avulsos */}
        <section id="credits" className="pt-8 border-t border-border space-y-6 scroll-mt-20">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-3 py-1">
              <Coins className="w-3 h-3" /> Créditos avulsos
            </span>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              Comprar créditos sem assinar
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Cada análise, relatório PDF ou conversa com o LUCIUS consome 1 crédito.
              Os pacotes não expiram e ficam disponíveis em qualquer plano (inclusive o gratuito).
            </p>
            {trial && !trial.is_paid && (
              <p className="text-xs text-muted-foreground">
                Seu saldo atual: <span className="font-semibold text-foreground">{credits ?? 0} créditos</span>
                {trial.trial_expired
                  ? " · período gratuito encerrado"
                  : ` · ${trial.days_left} dias restantes do plano gratuito`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.id}
                className={cn(
                  "bg-card border rounded-xl p-6 flex flex-col text-center",
                  pack.highlight ? "border-primary ring-2 ring-primary/20" : "border-border",
                )}
              >
                {pack.highlight && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-2 mx-auto">
                    <Zap className="w-3 h-3" /> Mais escolhido
                  </span>
                )}
                <div className="font-heading text-3xl font-bold text-foreground">{pack.credits}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">créditos</div>
                <div className="font-heading text-2xl font-bold text-foreground mb-1">{pack.price}</div>
                <p className="text-xs text-muted-foreground mb-5 flex-1">{pack.desc}</p>
                <Button
                  variant={pack.highlight ? "hero" : "outline"}
                  className="w-full gap-2"
                  onClick={() => handleBuyPack(pack.id)}
                  disabled={!!loadingPack}
                >
                  {loadingPack === pack.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  Comprar
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            Pagamento único em BRL processado pelo Stripe. Créditos liberados automaticamente após confirmação.
          </p>
        </section>
      </div>
    </AppSidebar>
  );
}
