import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisPeriod {
  startDate: string;
  endDate: string;
  label: string;
}

interface RunPortfolioDiagnosisInput {
  filePath: string;
  fileName: string;
  analysisPeriod: AnalysisPeriod;
}

interface RunPortfolioDiagnosisResult {
  positionsCount: number;
  recommendationsCount: number;
  analysisId?: string;
  analysisPeriod?: AnalysisPeriod;
}

export function useRunPortfolioDiagnosis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ filePath, fileName, analysisPeriod }: RunPortfolioDiagnosisInput) => {
      const response = await supabase.functions.invoke("process-portfolio", {
        body: { filePath, fileName, analysisPeriod },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao iniciar o diagnóstico");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data as RunPortfolioDiagnosisResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["latest_analysis"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["imports"] });
      queryClient.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}