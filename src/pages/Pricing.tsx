import { AppSidebar } from "@/components/AppSidebar";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Check, Zap, Loader2, Settings2, Coins, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useSubscription,
  getPlanByProductId,
  startCheckout,
  PLANS,
  type PlanKey,
} from "@/hooks/useSubscription";
import { CREDIT_PACKS, buyCreditPack, useTrialStatus } from "@/hooks/useTrialStatus";
import { useUserCredits } from "@/hooks/usePortfolio";
import { useCurrency, type Currency } from "@/contexts/CurrencyContext";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Pricing() {
  const { t, i18n } = useTranslation();
  const { data: subscription, isLoading } = useSubscription();
  const { data: trial } = useTrialStatus();
  const { data: credits } = useUserCredits();
  const { currency, setCurrency, formatPrice } = useCurrency();
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

  const planKeys: PlanKey[] = ["free", "essencial", "pro"];
  const planNames: Record<PlanKey, string> = {
    free: t("pricing.free"),
    essencial: t("pricing.essential"),
    pro: t("pricing.pro"),
  };
  const noteKey = (k: PlanKey): string => {
    if (k === "free") return t("pricing.planNotes.free");
    const cur = currency;
    if (k === "essencial") return cur === "USD" ? t("pricing.planNotes.essencialUSD") : t("pricing.planNotes.essencialBRL");
    return cur === "USD" ? t("pricing.planNotes.proUSD") : t("pricing.planNotes.proBRL");
  };

  const handleSubscribe = async (planKey: PlanKey) => {
    const priceId = PLANS[planKey].prices?.[currency];
    if (!priceId) return;
    setLoadingPlan(planKey);
    try {
      await startCheckout(priceId);
    } catch {
      toast.error(t("pricing.checkoutError"));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleBuyPack = async (pack: "10" | "50" | "200") => {
    setLoadingPack(pack);
    try {
      await buyCreditPack(pack);
    } catch {
      toast.error(t("pricing.buyError"));
    } finally {
      setLoadingPack(null);
    }
  };

  const handleManage = () => navigate("/billing");

  return (
    <AppSidebar>
      <SEO
        title={i18n.language === "en" ? "Plans & Pricing — Lucius" : "Planos e Preços — Lucius"}
        description={t("pricing.subtitle")}
        path="/pricing"
      />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("pricing.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("pricing.subtitle")}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">{t("pricing.currency")}:</span>
            <div className="inline-flex rounded-md border border-border overflow-hidden text-xs">
              {(["BRL", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "px-3 py-1 transition-colors",
                    currency === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("pricing.currencyNote", { currency })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planKeys.map((key) => {
            const plan = PLANS[key];
            const isCurrent = currentPlan === key;
            const isUpgrade = !isCurrent && key !== "free";
            const features = t(`pricing.planFeatures.${key}`, { returnObjects: true }) as string[];
            const desc = t(`pricing.planDescriptions.${key}`);
            const highlight = key === "essencial";
            const amount = plan.amount[currency];
            const priceLabel = key === "free" ? formatPrice(0) : formatPrice(amount);
            return (
              <div
                key={key}
                className={cn(
                  "bg-card border rounded-xl p-6 shadow-card flex flex-col",
                  highlight ? "border-primary ring-2 ring-primary/20" : "border-border",
                  isCurrent && "ring-2 ring-success/30 border-success",
                )}
              >
                {highlight && !isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-3">
                    <Zap className="w-3 h-3" /> {t("pricing.popular")}
                  </span>
                )}
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-success mb-3">
                    <Check className="w-3 h-3" /> {t("pricing.yourPlan")}
                  </span>
                )}
                <h3 className="font-heading font-semibold text-lg text-foreground">{planNames[key]}</h3>
                <p className="text-xs text-muted-foreground mb-4">{desc}</p>
                <div className="mb-6">
                  <span className="font-heading text-3xl font-bold text-foreground">{priceLabel}</span>
                  {key !== "free" && (
                    <span className="text-sm text-muted-foreground">{t("pricing.perMonth")}</span>
                  )}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground mb-4 text-center">{noteKey(key)}</p>
                {isCurrent && currentPlan !== "free" ? (
                  <Button variant="outline" className="w-full" onClick={handleManage}>
                    <Settings2 className="w-4 h-4" /> {t("pricing.manage")}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>{t("pricing.currentPlan")}</Button>
                ) : isUpgrade ? (
                  <Button
                    variant={highlight ? "hero" : "default"}
                    className="w-full"
                    onClick={() => handleSubscribe(key)}
                    disabled={!!loadingPlan || isLoading}
                  >
                    {loadingPlan === key ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `${t("pricing.subscribe")} ${planNames[key]}`
                    )}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>

        {subscription?.subscription_end && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("pricing.renewsOn", {
                date: new Date(subscription.subscription_end).toLocaleDateString(
                  i18n.language === "en" ? "en-US" : "pt-BR",
                ),
              })}
            </p>
          </div>
        )}

        <section id="credits" className="pt-8 border-t border-border space-y-6 scroll-mt-20">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-3 py-1">
              <Coins className="w-3 h-3" /> {t("pricing.creditsKicker")}
            </span>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {t("pricing.creditsTitle")}
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">{t("pricing.creditsDesc")}</p>
            {trial && !trial.is_paid && (
              <p className="text-xs text-muted-foreground">
                {t("pricing.balance")}{" "}
                <span className="font-semibold text-foreground">
                  {credits ?? 0} {t("pricing.credits")}
                </span>
                {" · "}
                {trial.trial_expired
                  ? t("pricing.trialEnded")
                  : t("pricing.trialDaysLeft", { days: trial.days_left })}
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
                <div className="font-heading text-3xl font-bold text-foreground">{pack.credits}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                  {t("pricing.credits")}
                </div>
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
                  {t("pricing.buy")}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            {t("pricing.creditsFooter", { currency })}
          </p>
        </section>
      </div>
    </AppSidebar>
  );
}
