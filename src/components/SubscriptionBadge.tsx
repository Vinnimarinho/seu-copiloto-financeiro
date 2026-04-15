import { useSubscription, getPlanByProductId, PLANS } from "@/hooks/useSubscription";
import { Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SubscriptionBadge() {
  const { data: subscription, isLoading } = useSubscription();
  const navigate = useNavigate();

  if (isLoading || !subscription) return null;

  const planKey = getPlanByProductId(subscription.product_id ?? null);
  const planName = PLANS[planKey].name;
  const isPaid = planKey !== "free";

  return (
    <button
      onClick={() => navigate("/pricing")}
      className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 hover:border-primary/40 transition-colors cursor-pointer"
    >
      {isPaid ? (
        <Crown className="w-4 h-4 text-primary" />
      ) : (
        <Sparkles className="w-4 h-4 text-muted-foreground" />
      )}
      <span className="text-xs font-medium text-foreground">
        Plano {planName}
      </span>
      {isPaid && subscription.subscription_end && (
        <span className="text-[10px] text-muted-foreground">
          até {new Date(subscription.subscription_end).toLocaleDateString("pt-BR")}
        </span>
      )}
      {!isPaid && (
        <span className="text-[10px] text-primary font-medium">Fazer upgrade</span>
      )}
    </button>
  );
}
