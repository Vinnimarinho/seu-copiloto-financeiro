import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useSubscription, getPlanByProductId, PLANS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, PartyPopper, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

export default function PaymentSuccess() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [syncing, setSyncing] = useState(true);
  const [planName, setPlanName] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10; // ~20s — webhook normalmente sincroniza em <5s

    // Fonte de verdade: webhook escreve em billing_subscriptions; check-subscription
    // lê primeiro essa tabela. Pollamos só para confirmar a propagação no front.
    const poll = async () => {
      while (!cancelled && attempts < maxAttempts) {
        attempts++;
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed && data?.product_id) {
            const planKey = getPlanByProductId(data.product_id);
            setPlanName(PLANS[planKey].name);
            setSyncing(false);
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            return;
          }
        } catch {
          // Ignora erro transitório — próxima iteração tenta de novo
        }
        if (!cancelled && attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, 2000));
        }
      }
      if (!cancelled) {
        setSyncing(false);
        setFailed(true);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [user?.id, queryClient]);

  return (
    <AppSidebar>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 max-w-md mx-auto">
        {syncing ? (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <h1 className="font-heading text-2xl font-bold text-foreground">{t("paymentSuccess.syncingTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("paymentSuccess.syncingDesc")}</p>
          </>
        ) : failed ? (
          <>
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-warning" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{t("paymentSuccess.receivedTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("paymentSuccess.receivedDesc")}</p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/pricing")}>{t("paymentSuccess.viewPlan")}</Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>{t("paymentSuccess.goDashboard")}</Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
              <PartyPopper className="w-10 h-10 text-success" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{t("paymentSuccess.congrats")}</h1>
            <p className="text-lg font-medium text-primary">{t("paymentSuccess.planActivated", { plan: planName })}</p>
            <p className="text-sm text-muted-foreground">{t("paymentSuccess.enjoy", { plan: planName })}</p>
            <div className="bg-card border border-success/30 rounded-xl p-4 w-full space-y-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-success" /> {t("paymentSuccess.feat1")}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-success" /> {t("paymentSuccess.feat2")}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Check className="w-4 h-4 text-success" /> {t("paymentSuccess.feat3")}
              </div>
              <div className="flex items-center gap-2 text-sm text-foreground">
                <Crown className="w-4 h-4 text-primary" /> {t("paymentSuccess.feat4")}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={() => navigate("/dashboard")}>{t("paymentSuccess.goDash2")}</Button>
              <Button variant="outline" onClick={() => navigate("/diagnosis")}>{t("paymentSuccess.doDiagnosis")}</Button>
            </div>
          </>
        )}
      </div>
    </AppSidebar>
  );
}
