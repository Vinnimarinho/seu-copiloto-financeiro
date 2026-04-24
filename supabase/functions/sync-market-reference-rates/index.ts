// Edge Function: sync-market-reference-rates
// Atualiza SELIC e IPCA na tabela `market_reference_rates` a partir da
// API pública do Banco Central (SGS). CDI e TESOURO_* não são tocados.
//
// Pode ser chamada manualmente (POST) ou agendada via pg_cron.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BcbPoint {
  data: string;   // dd/MM/yyyy
  valor: string;  // numérico em string, percentual
}

interface SeriesConfig {
  code: "SELIC" | "IPCA";
  label: string;
  sgsId: number;
  frequency: "daily" | "monthly";
  /** Converte o valor cru retornado pelo BCB para taxa anual decimal. */
  toAnnualRate: (rawPercent: number) => number;
  metadata: Record<string, unknown>;
}

const SERIES: SeriesConfig[] = [
  {
    code: "SELIC",
    label: "Selic Meta",
    sgsId: 1178,
    frequency: "daily",
    toAnnualRate: (v) => v / 100,
    metadata: { sgs: 1178, basis: "anual" },
  },
  {
    code: "IPCA",
    label: "IPCA (anualizado)",
    sgsId: 433,
    frequency: "monthly",
    toAnnualRate: (v) => Math.pow(1 + v / 100, 12) - 1,
    metadata: { sgs: 433, basis: "mensal->anual" },
  },
];

function parseBcbDateToISO(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  if (!d || !m || !y) return new Date().toISOString().slice(0, 10);
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

async function fetchSeries(cfg: SeriesConfig, signal: AbortSignal) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${cfg.sgsId}/dados/ultimos/1?formato=json`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) {
    throw new Error(`BCB ${cfg.sgsId} HTTP ${res.status}`);
  }
  const json = (await res.json()) as BcbPoint[];
  const point = Array.isArray(json) ? json[0] : null;
  if (!point) throw new Error(`BCB ${cfg.sgsId} empty payload`);
  const raw = Number(String(point.valor).replace(",", "."));
  if (!Number.isFinite(raw)) {
    throw new Error(`BCB ${cfg.sgsId} valor inválido: ${point.valor}`);
  }
  return {
    code: cfg.code,
    label: cfg.label,
    annual_rate: cfg.toAnnualRate(raw),
    source: "bcb-sgs",
    reference_date: parseBcbDateToISO(point.data),
    frequency: cfg.frequency,
    metadata: { ...cfg.metadata, rawValue: raw, sgsId: cfg.sgsId },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Missing service env vars" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Timeout global de 8s para o fetch ao BCB.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  const results: Array<
    | { code: string; status: "updated"; annual_rate: number; reference_date: string }
    | { code: string; status: "error"; error: string }
  > = [];

  try {
    const settled = await Promise.allSettled(
      SERIES.map((cfg) => fetchSeries(cfg, controller.signal)),
    );

    for (let i = 0; i < settled.length; i++) {
      const cfg = SERIES[i];
      const r = settled[i];
      if (r.status !== "fulfilled") {
        results.push({
          code: cfg.code,
          status: "error",
          error: r.reason instanceof Error ? r.reason.message : String(r.reason),
        });
        continue;
      }

      const row = r.value;
      const { error: upsertError } = await admin
        .from("market_reference_rates")
        .upsert(
          {
            code: row.code,
            label: row.label,
            annual_rate: row.annual_rate,
            source: row.source,
            reference_date: row.reference_date,
            frequency: row.frequency,
            metadata: row.metadata,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "code" },
        );

      if (upsertError) {
        results.push({
          code: cfg.code,
          status: "error",
          error: upsertError.message,
        });
        continue;
      }

      results.push({
        code: cfg.code,
        status: "updated",
        annual_rate: row.annual_rate,
        reference_date: row.reference_date,
      });
    }
  } finally {
    clearTimeout(timeout);
  }

  const ok = results.every((r) => r.status === "updated");
  return new Response(
    JSON.stringify({ ok, results, ran_at: new Date().toISOString() }),
    {
      status: ok ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
