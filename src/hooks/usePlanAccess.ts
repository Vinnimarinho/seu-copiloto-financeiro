import { useSubscription, getPlanByProductId, type PlanKey } from "@/hooks/useSubscription";

/**
 * Centraliza o gating de funcionalidades por plano.
 * Usuários "free" ficam bloqueados de funcionalidades pagas (Oportunidades).
 *
 * O gating server-side é validado pela edge function `check-subscription`,
 * que consulta o Stripe diretamente — nunca confiamos apenas no front.
 */
export function usePlanAccess() {
  const { data, isLoading } = useSubscription();

  const planKey: PlanKey = data ? getPlanByProductId(data.product_id ?? null) : "free";
  const isPaid = planKey !== "free";

  return {
    isLoading,
    planKey,
    isPaid,
    /** Acesso a "Oportunidades" — apenas planos pagos */
    canAccessOpportunities: isPaid,
    /** Geração de relatórios PDF — apenas planos pagos */
    canGenerateReports: isPaid,
  };
}
