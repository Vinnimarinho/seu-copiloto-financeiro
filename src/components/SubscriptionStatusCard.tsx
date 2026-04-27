import { useQueryClient } from "@tanstack/react-query";
import { useSubscription, getPlanByProductId, PLANS, type SubscriptionStatus } from "@/hooks/useSubscription";
import { Crown, Sparkles, AlertTriangle, RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface StatusMeta {
  label: string;
  tone: "success" | "warning" | "danger" | "muted";
  icon: typeof Crown;
}

function metaFor(status: SubscriptionStatus, subscribed: boolean, cancelAtEnd: boolean): StatusMeta {
  if (subscribed && cancelAtEnd) return { label: "Cancelando no fim do período", tone: "warning", icon: Clock };
  if (status === "active") return { label: "Ativa", tone: "success", icon: CheckCircle2 };
  if (status === "trialing") return { label: "Em teste", tone: "success", icon: Sparkles };
  if (status === "past_due" || status === "unpaid") return { label: "Pagamento pendente", tone: "danger", icon: AlertTriangle };
  if (status === "canceled" || status === "incomplete_expired") return { label: "Expirada", tone: "danger", icon: XCircle };
  if (status === "incomplete") return { label: "Pagamento incompleto", tone: "warning", icon: Clock };
  return { label: "Sem assinatura", tone: "muted", icon: Sparkles };
}

const toneClass: Record<StatusMeta["tone"], string> = {
  success: "bg-primary/10 text-primary border-primary/30",
  warning: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  muted: "bg-muted text-muted-foreground border-border",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function SubscriptionStatusCard() {
  const { user } = useAuth();
  const { data, isLoading, isFetching } = useSubscription();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 animate-pulse h-24" />
    );
  }

  const planKey = getPlanByProductId(data.product_id);
  const planName = PLANS[planKey].name;
  const isPaid = planKey !== "free";
  const meta = metaFor(data.status, data.subscribed, data.cancel_at_period_end);
  const Icon = meta.icon;

  const handleRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPaid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {isPaid ? <Crown className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Assinatura</p>
            <h3 className="font-heading text-base font-bold text-foreground">Plano {planName}</h3>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border ${toneClass[meta.tone]}`}>
          <Icon className="w-3 h-3" />
          {meta.label}
        </span>
      </div>

      {isPaid && (
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/60">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Período atual</p>
            <p className="text-xs font-medium text-foreground mt-0.5">
              {formatDate(data.subscription_start)} → {formatDate(data.subscription_end)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {data.cancel_at_period_end ? "Encerra em" : "Próxima cobrança"}
            </p>
            <p className="text-xs font-medium text-foreground mt-0.5">{formatDate(data.subscription_end)}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant={isPaid ? "outline" : "default"}
          onClick={() => navigate(isPaid ? "/billing" : "/pricing")}
          className="flex-1"
        >
          {isPaid ? "Gerenciar assinatura" : "Fazer upgrade"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={refreshing || isFetching}
          aria-label="Atualizar status"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing || isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Sincronizado com Stripe {data.source === "local" ? "(via webhook)" : data.source === "stripe-by-customer-id" ? "(consulta direta)" : ""}
      </p>
    </div>
  );
}
