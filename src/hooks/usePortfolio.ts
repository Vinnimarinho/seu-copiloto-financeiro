import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function usePortfolios() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["portfolios", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useEnsurePortfolio() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      // Check if portfolio exists
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .limit(1)
        .single();
      if (existing) return existing.id;

      // Create default portfolio
      const { data, error } = await supabase
        .from("portfolios")
        .insert({ user_id: user.id, name: "Minha Carteira" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["portfolios"] }),
  });
}

export function useAssets(portfolioId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["assets", portfolioId],
    enabled: !!user && !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*")
        .eq("portfolio_id", portfolioId!)
        .order("current_value", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useRecommendations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["recommendations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "postponed" | "discarded" }) => {
      const { error } = await supabase
        .from("recommendations")
        .update({ status, decided_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recommendations"] }),
  });
}

export function useReports() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUserCredits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["credits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_credits")
        .select("balance")
        .limit(1)
        .single();
      if (error) throw error;
      return data?.balance ?? 0;
    },
  });
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { full_name?: string; phone?: string; investor_profile?: "conservador" | "moderado" | "arrojado" }) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", (await supabase.auth.getUser()).data.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar perfil"),
  });
}

export function useUploadPortfolioFile() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("portfolio-files")
        .upload(path, file, { upsert: false });
      if (error) throw error;
      return path;
    },
    onSuccess: () => toast.success("Arquivo enviado com sucesso!"),
    onError: (e) => toast.error(`Erro no upload: ${(e as Error).message}`),
  });
}
