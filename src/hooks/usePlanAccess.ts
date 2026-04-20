import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type Feature = "opportunities" | "reports_pdf" | "unlimited_portfolios";

/**
 * Gating server-side: a edge function `verify-plan-access` consulta o Stripe
 * diretamente. O front é apenas um espelho — a UI nunca libera nada baseada só
 * em estado local.
 */
function useFeatureAccess(feature: Feature) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["feature-access", feature, user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("verify-plan-access", {
        body: { feature },
      });
      if (error) throw error;
      return data as { allowed: boolean; plan: "free" | "essencial" | "pro"; product_id: string | null };
    },
  });
}

export function usePlanAccess() {
  const opportunities = useFeatureAccess("opportunities");
  const reports = useFeatureAccess("reports_pdf");

  const planKey = opportunities.data?.plan ?? "free";
  const isPaid = planKey !== "free";

  return {
    isLoading: opportunities.isLoading || reports.isLoading,
    planKey,
    isPaid,
    canAccessOpportunities: opportunities.data?.allowed ?? false,
    canGenerateReports: reports.data?.allowed ?? false,
  };
}
