import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Currency } from "@/contexts/CurrencyContext";

// Mapeamento Stripe product/price com suporte multi-moeda (BRL + USD).
// LIVE: defina VITE_STRIPE_* no ambiente. Defaults abaixo são os IDs de produção atuais.
const PROD_ESSENCIAL = import.meta.env.VITE_STRIPE_PRODUCT_ESSENCIAL || "prod_UKvbpwN51mHV2B";
const PROD_PRO = import.meta.env.VITE_STRIPE_PRODUCT_PRO || "prod_UL9kxDPtv9xpCp";

const PRICE_ESSENCIAL_BRL = import.meta.env.VITE_STRIPE_PRICE_ESSENCIAL_BRL || "price_1TMFkWGlgACWhSKnOIdAPcmq";
const PRICE_PRO_BRL = import.meta.env.VITE_STRIPE_PRICE_PRO_BRL || "price_1TMTQjGlgACWhSKnnSTH435t";

// USD prices criados em 2026-05 (Live) — ver STRIPE_RELEASE_CHECK
const PRICE_ESSENCIAL_USD = import.meta.env.VITE_STRIPE_PRICE_ESSENCIAL_USD || "price_1TX5RnK2nJVoAQb000emEHen";
const PRICE_PRO_USD = import.meta.env.VITE_STRIPE_PRICE_PRO_USD || "price_1TX5ScK2nJVoAQb0OwNSRwg0";

export const PLANS = {
  free: {
    name: "Gratuito",
    product_id: null as string | null,
    prices: { BRL: null, USD: null } as Record<Currency, string | null>,
    amount: { BRL: 0, USD: 0 },
  },
  essencial: {
    name: "Essencial",
    product_id: PROD_ESSENCIAL,
    prices: { BRL: PRICE_ESSENCIAL_BRL, USD: PRICE_ESSENCIAL_USD } as Record<Currency, string | null>,
    amount: { BRL: 39.99, USD: 9.9 },
  },
  pro: {
    name: "Pro",
    product_id: PROD_PRO,
    prices: { BRL: PRICE_PRO_BRL, USD: PRICE_PRO_USD } as Record<Currency, string | null>,
    amount: { BRL: 89.99, USD: 19.9 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string | null): PlanKey {
  if (!productId) return "free";
  if (productId === PLANS.essencial.product_id) return "essencial";
  if (productId === PLANS.pro.product_id) return "pro";
  return "free";
}

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "inactive"
  | "deleted_account";

export interface SubscriptionInfo {
  subscribed: boolean;
  product_id: string | null;
  status: SubscriptionStatus;
  subscription_start: string | null;
  subscription_end: string | null;
  cancel_at_period_end: boolean;
  source?: string;
}

export function useSubscription() {
  const { user } = useAuth();

  return useQuery<SubscriptionInfo>({
    queryKey: ["subscription", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      return data as SubscriptionInfo;
    },
  });
}

/**
 * Inicia o checkout Stripe redirecionando o usuário na MESMA aba.
 * Aceita priceId direto (de qualquer moeda) — moeda é determinada pelo próprio price no Stripe.
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

export async function openCustomerPortal() {
  const { data, error } = await supabase.functions.invoke("customer-portal");
  if (error) throw error;
  if (data?.url) {
    window.location.assign(data.url);
  }
}
