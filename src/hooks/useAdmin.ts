import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AdminUser {
  user_id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  onboarding_completed: boolean;
  plan: string;
  subscription_status: string;
  risk_tolerance: string | null;
  investment_horizon: string | null;
  experience_years: number | null;
  approximate_patrimony: string | null;
  credits_balance: number;
}

export interface AdminMetrics {
  total_users: number;
  active_subscribers: number;
  total_portfolios: number;
  total_analyses: number;
  plan_breakdown: Record<string, number>;
  risk_breakdown: Record<string, number>;
}

export interface AdminData {
  metrics: AdminMetrics;
  users: AdminUser[];
  recent_signups: any[];
}

export function useAdminMetrics() {
  const { user } = useAuth();
  return useQuery<AdminData>({
    queryKey: ["admin-metrics", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-metrics");
      if (error) throw error;
      return data as AdminData;
    },
  });
}

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // Try calling admin-metrics; if 403 => not admin
      const { data, error } = await supabase.functions.invoke("admin-metrics");
      if (error) return false;
      return !!data?.metrics;
    },
  });
}
