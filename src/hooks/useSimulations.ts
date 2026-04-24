import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fetchMarketRates } from "@/lib/simulations/marketDataProvider";
import type {
  ScenarioSimulationRow,
  SimulationAssumptions,
  SimulationInputs,
  SimulationResult,
} from "@/lib/simulations/types";

export function useMarketRates() {
  return useQuery({
    queryKey: ["market-rates"],
    staleTime: 5 * 60_000,
    queryFn: fetchMarketRates,
  });
}

export function useSimulations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["scenario_simulations", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scenario_simulations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ScenarioSimulationRow[];
    },
  });
}

export interface SaveSimulationInput {
  name: string;
  mode: "swap" | "rebalance" | "concentration";
  preset?: string | null;
  portfolio_id?: string | null;
  user_inputs: SimulationInputs;
  assumptions: SimulationAssumptions;
  baseline_snapshot: SimulationResult["baseline"];
  scenario_snapshot: SimulationResult["scenario"];
  results: SimulationResult;
  notes?: string | null;
}

export function useSaveSimulation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveSimulationInput) => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        portfolio_id: input.portfolio_id ?? null,
        name: input.name,
        mode: input.mode,
        preset: input.preset ?? null,
        user_inputs: input.user_inputs as unknown as Json,
        assumptions: input.assumptions as unknown as Json,
        baseline_snapshot: input.baseline_snapshot as unknown as Json,
        scenario_snapshot: input.scenario_snapshot as unknown as Json,
        results: input.results as unknown as Json,
        notes: input.notes ?? null,
      };
      const { data, error } = await supabase
        .from("scenario_simulations")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenario_simulations"] });
      toast.success("Simulação salva no histórico");
    },
    onError: (e) => toast.error((e as Error).message || "Erro ao salvar simulação"),
  });
}

export function useDeleteSimulation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("scenario_simulations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scenario_simulations"] });
      toast.success("Simulação removida");
    },
  });
}

export function useExportSimulationPdf() {
  return useMutation({
    mutationFn: async (simulationId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-simulation-pdf", {
        body: { simulation_id: simulationId },
      });
      if (error) throw error;
      const payload = data as { url?: string; error?: string };
      if (payload?.error) throw new Error(payload.error);
      if (!payload?.url) throw new Error("URL do PDF indisponível");
      return payload.url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
    onError: (e) => toast.error((e as Error).message || "Erro ao exportar PDF"),
  });
}
