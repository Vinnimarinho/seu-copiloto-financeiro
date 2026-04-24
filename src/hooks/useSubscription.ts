import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Mapeamento Stripe product/price.
// LIVE: defina VITE_STRIPE_PRODUCT_ESSENCIAL/_PRO e VITE_STRIPE_PRICE_ESSENCIAL_BRL/_PRO_BRL
// no ambiente. Os defaults abaixo são os IDs históricos para retrocompatibilidade
// e não devem ser tratados como verdade em produção.
const PROD_ESSENCIAL = import.meta.env.VITE_STRIPE_PRODUCT_ESSENCIAL || "prod_UKvbpwN51mHV2B";
const PROD_PRO = import.meta.env.VITE_STRIPE_PRODUCT_PRO || "prod_UL9kxDPtv9xpCp";
const PRICE_ESSENCIAL = import.meta.env.VITE_STRIPE_PRICE_ESSENCIAL_BRL || "price_1TMFkWGlgACWhSKnOIdAPcmq";
const PRICE_PRO = import.meta.env.VITE_STRIPE_PRICE_PRO_BRL || "price_1TMTQjGlgACWhSKnnSTH435t";

export const PLANS = {
  free: { name: "Gratuito", product_id: null as string | null, price_id: null as string | null },
  essencial: {
    name: "Essencial",
    product_id: PROD_ESSENCIAL,
    price_id: PRICE_ESSENCIAL,
  },
  pro: {
    name: "Pro",
    product_id: PROD_PRO,
    price_id: PRICE_PRO,
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

/**
 * Inicia o checkout Stripe redirecionando o usuário na MESMA aba.
 * Cobrança em BRL — multimoeda desativada até validação Stripe ponta a ponta.
 */
export async function startCheckout(priceId: string) {
  const { data, error } = await supabase.functions.invoke("create-checkout", {
    body: { priceId },
  });
  if (error) throw error;
  if (data?.url) {
    window.location.assign(data.url);
  }
}

/**
 * Abre o portal de assinatura Stripe na MESMA aba. O return_url da sessão
 * já aponta para /pricing, então o usuário volta naturalmente.
 */
export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error) throw error;
  if (data?.url) {
    window.location.assign(data.url);
  }
}
