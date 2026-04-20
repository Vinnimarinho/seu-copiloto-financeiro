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
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .limit(1)
        .single();
      if (existing) return existing.id;

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

export function usePositions(portfolioId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["positions", portfolioId],
    enabled: !!user && !!portfolioId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_positions")
        .select("*")
        .eq("portfolio_id", portfolioId!)
        .order("current_value", { ascending: false, nullsFirst: false });
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

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-report");
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { report_id: string; url: string | null };
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Relatório PDF gerado!");
      if (res.url) window.open(res.url, "_blank", "noopener");
    },
    onError: (e) => toast.error((e as Error).message || "Erro ao gerar relatório"),
  });
}

export function useReportDownload() {
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase.functions.invoke("report-download-url", {
        body: { report_id: reportId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as { url: string }).url;
    },
    onSuccess: (url) => window.open(url, "_blank", "noopener"),
    onError: (e) => toast.error((e as Error).message || "Erro ao baixar relatório"),
  });
}

export function useUserCredits() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["credits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_wallets")
        .select("balance")
        .limit(1)
        .maybeSingle();
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
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useInvestorProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["investor_profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investor_profiles")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { full_name?: string; phone?: string }) => {
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

export function useUpdateInvestorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { risk_tolerance?: "conservador" | "moderado" | "arrojado"; investment_horizon?: string; objectives?: string[] }) => {
      const { error } = await supabase
        .from("investor_profiles")
        .update(updates)
        .eq("user_id", (await supabase.auth.getUser()).data.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investor_profile"] });
      toast.success("Perfil de investidor atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar perfil de investidor"),
  });
}

export function useLatestAnalysis() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["latest_analysis", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
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
