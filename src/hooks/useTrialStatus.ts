import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TrialStatus {
  is_paid: boolean;
  plan: string;
  trial_end: string;
  days_left: number;
  trial_expired: boolean;
}

export function useTrialStatus() {
  const { user } = useAuth();
  return useQuery<TrialStatus>({
    queryKey: ["trial-status", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("user_trial_status", { _user_id: user!.id });
      if (error) throw error;
      return (data ?? {}) as unknown as TrialStatus;
    },
  });
}

export const CREDIT_PACKS = [
  { id: "10" as const, credits: 10, price: "R$ 19,90", desc: "Para testar e experimentar" },
  { id: "50" as const, credits: 50, price: "R$ 79,00", desc: "Mais popular", highlight: true },
  { id: "200" as const, credits: 200, price: "R$ 249,00", desc: "Melhor custo por crédito" },
];

export async function buyCreditPack(pack: "10" | "50" | "200") {
  const { data, error } = await supabase.functions.invoke("buy-credits", { body: { pack } });
  if (error) throw error;
  if ((data as { url?: string })?.url) window.location.assign((data as { url: string }).url);
}
