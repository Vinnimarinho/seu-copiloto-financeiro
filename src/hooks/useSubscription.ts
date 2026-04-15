import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Stripe product/price mapping
export const PLANS = {
  free: { name: "Gratuito", product_id: null, price_id: null },
  essencial: {
    name: "Essencial",
    product_id: "prod_UKvbpwN51mHV2B",
    price_id: "price_1TMFkWGlgACWhSKnOIdAPcmq",
  },
  pro: {
    name: "Pro",
    product_id: "prod_UL9kxDPtv9xpCp",
    price_id: "price_1TMTQjGlgACWhSKnnSTH435t",
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string | null): PlanKey {
  if (!productId) return "free";
  if (productId === PLANS.essencial.product_id) return "essencial";
  if (productId === PLANS.pro.product_id) return "pro";
  return "free";
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as {
        subscribed: boolean;
        product_id: string | null;
        subscription_end: string | null;
      };
    },
  });
}

export async function startCheckout(priceId: string) {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceId },
  });
  if (error) throw error;
  if (data?.url) {
    window.open(data.url, "_blank");
  }
}

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error) throw error;
  if (data?.url) {
    window.open(data.url, "_blank");
  }
}
