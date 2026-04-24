// Edge Function: sync-cdi-tesouro-rates
//
// Atualiza CDI e TESOURO_{POS,PRE,IPCA} na tabela `market_reference_rates`
// usando fontes OFICIAIS:
//   - CDI:     SGS 12 (CDI diário) → anualizado em 252 dias úteis.
//              Fallback: SGS 1178 (Selic Meta) - 0.10 p.p.
//   - Tesouro: CSV oficial do Tesouro Transparente (Tesouro Nacional)
//              https://www.tesourotransparente.gov.br/ → "PrecoTaxaTesouroDireto.csv"
//              Lido em streaming, mantendo apenas o registro mais recente por tipo.
//
// SELIC e IPCA NÃO são tocados aqui (são responsabilidade da função
// sync-market-reference-rates).
//
// Resiliência: se uma fonte falhar, NÃO sobrescreve o valor existente na tabela.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BCB_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
const TESOURO_CSV_URL =
  "https://www.tesourotransparente.gov.br/ckan/dataset/df56aa42-484a-4a59-8184-7676580c81e3/resource/796d2059-14e9-44e3-80c9-2d9e30b405c1/download/PrecoTaxaTesouroDireto.csv";

interface BcbPoint {
  data: string;
  valor: string;
}

function parseBcbDateToISO(ddmmyyyy: string): string {
  const [d, m, y] = ddmmyyyy.split("/");
  if (!d || !m || !y) return new Date().toISOString().slice(0, 10);
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

async function fetchBcbLast(sgsId: number, signal: AbortSignal): Promise<BcbPoint | null> {
  const url = `${BCB_BASE}.${sgsId}/dados/ultimos/1?formato=json`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`BCB ${sgsId} HTTP ${res.status}`);
  const json = (await res.json()) as BcbPoint[];
  return Array.isArray(json) && json[0] ? json[0] : null;
}

async function computeCdi(signal: AbortSignal): Promise<{
  annual_rate: number;
  reference_date: string;
  source: string;
  metadata: Record<string, unknown>;
}> {
  try {
    const point = await fetchBcbLast(12, signal);
    if (!point) throw new Error("CDI SGS 12 vazio");
    const daily = Number(String(point.valor).replace(",", "."));
    if (!Number.isFinite(daily)) throw new Error(`CDI SGS 12 inválido: ${point.valor}`);
    const annual = Math.pow(1 + daily / 100, 252) - 1;
    return {
      annual_rate: annual,
      reference_date: parseBcbDateToISO(point.data),
      source: "bcb-sgs-12",
      metadata: { sgs: 12, basis: "diario->anual-252", rawDailyPercent: daily },
    };
  } catch (e) {
    const selicPoint = await fetchBcbLast(1178, signal);
    if (!selicPoint) throw new Error(`CDI fallback Selic indisponível (${(e as Error).message})`);
    const selicPct = Number(String(selicPoint.valor).replace(",", "."));
    if (!Number.isFinite(selicPct)) throw new Error("CDI fallback: Selic inválida");
    return {
      annual_rate: (selicPct - 0.1) / 100,
      reference_date: parseBcbDateToISO(selicPoint.data),
      source: "derived-selic-minus-0.10",
      metadata: {
        sgs: 1178,
        basis: "selic_meta_anual_minus_10bp",
        selicAnnualPercent: selicPct,
        fallbackReason: (e as Error).message,
      },
    };
  }
}

// ---------- Tesouro Direto via CSV oficial ----------

type TesouroCode = "TESOURO_POS" | "TESOURO_PRE" | "TESOURO_IPCA";

interface TesouroPick {
  code: TesouroCode;
  annual_rate: number;     // decimal
  reference_date: string;  // ISO
  metadata: Record<string, unknown>;
}

/**
 * Normaliza "Tipo Titulo" para nosso código interno.
 * Foco apenas nos títulos PUROS (sem "Juros Semestrais"), que são os
 * representativos para investidor pessoa física padrão.
 */
function classifyTesouroType(tipo: string): TesouroCode | null {
  const t = tipo.trim();
  if (t === "Tesouro Selic") return "TESOURO_POS";
  if (t === "Tesouro Prefixado") return "TESOURO_PRE";
  if (t === "Tesouro IPCA+") return "TESOURO_IPCA";
  return null;
}

/** dd/MM/yyyy → ISO yyyy-MM-dd. Retorna "" se inválido. */
function brDateToIso(s: string): string {
  const [d, m, y] = s.split("/");
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

/**
 * Faz streaming do CSV grande do Tesouro Transparente e mantém em memória
 * APENAS o registro com Data Base mais recente para cada tipo, e dentro do
 * mesmo dia, o de maior vencimento (mais "longo").
 */
async function fetchTesouroRates(signal: AbortSignal): Promise<TesouroPick[]> {
  const res = await fetch(TESOURO_CSV_URL, {
    headers: { Accept: "text/csv" },
    signal,
  });
  if (!res.ok) throw new Error(`Tesouro CSV HTTP ${res.status}`);
  if (!res.body) throw new Error("Tesouro CSV: body vazio");

  type Best = {
    rate: number;
    refDateIso: string;     // Data Base
    maturityIso: string;    // Data Vencimento
    rawRow: string;
  };
  const best: Partial<Record<TesouroCode, Best>> = {};

  const reader = res.body
    .pipeThrough(new TextDecoderStream("utf-8"))
    .getReader();

  let buffer = "";
  let headerSeen = false;
  let colTipo = -1;
  let colVenc = -1;
  let colDataBase = -1;
  let colTaxaVenda = -1;

  const processLine = (line: string) => {
    if (!line) return;
    if (!headerSeen) {
      const headers = line.split(";").map((h) => h.trim());
      colTipo = headers.indexOf("Tipo Titulo");
      colVenc = headers.indexOf("Data Vencimento");
      colDataBase = headers.indexOf("Data Base");
      colTaxaVenda = headers.indexOf("Taxa Venda Manha");
      if ([colTipo, colVenc, colDataBase, colTaxaVenda].some((i) => i < 0)) {
        throw new Error("Tesouro CSV: cabeçalho inesperado");
      }
      headerSeen = true;
      return;
    }
    const cols = line.split(";");
    if (cols.length < 5) return;
    const code = classifyTesouroType(cols[colTipo] ?? "");
    if (!code) return;
    const refDateIso = brDateToIso(cols[colDataBase] ?? "");
    if (!refDateIso) return;
    const maturityIso = brDateToIso(cols[colVenc] ?? "");
    const rate = Number(String(cols[colTaxaVenda] ?? "").replace(",", "."));
    if (!Number.isFinite(rate)) return;

    const cur = best[code];
    if (
      !cur ||
      refDateIso > cur.refDateIso ||
      (refDateIso === cur.refDateIso && maturityIso > cur.maturityIso)
    ) {
      best[code] = { rate, refDateIso, maturityIso, rawRow: line };
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += value;
      let nl = buffer.indexOf("\n");
      while (nl !== -1) {
        const line = buffer.slice(0, nl).replace(/\r$/, "");
        processLine(line);
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf("\n");
      }
    }
    if (buffer) processLine(buffer);
  } finally {
    try { await reader.cancel(); } catch { /* noop */ }
  }

  const out: TesouroPick[] = [];
  for (const code of ["TESOURO_POS", "TESOURO_PRE", "TESOURO_IPCA"] as const) {
    const b = best[code];
    if (!b) continue;
    out.push({
      code,
      annual_rate: b.rate / 100,
      reference_date: b.refDateIso,
      metadata: {
        maturity: b.maturityIso,
        rawAnnualPercent: b.rate,
        basis: "anual_taxa_venda_manha",
      },
    });
  }
  if (out.length === 0) throw new Error("Tesouro CSV: nenhum título classificável");
  return out;
}

// ---------- Upsert ----------

const LABELS: Record<string, string> = {
  CDI: "CDI",
  TESOURO_POS: "Tesouro Selic (pós-fixado)",
  TESOURO_PRE: "Tesouro Prefixado",
  TESOURO_IPCA: "Tesouro IPCA+",
};

interface UpsertRow {
  code: string;
  label: string;
  annual_rate: number;
  source: string;
  reference_date: string;
  frequency: string;
  metadata: Record<string, unknown>;
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

  // Timeout generoso (CSV do Tesouro tem ~14MB).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  const results: Array<
    | { code: string; status: "updated"; annual_rate: number; reference_date: string; source: string }
    | { code: string; status: "error"; error: string }
  > = [];
  const rowsToUpsert: UpsertRow[] = [];

  // CDI
  try {
    const cdi = await computeCdi(controller.signal);
    rowsToUpsert.push({
      code: "CDI",
      label: LABELS.CDI,
      annual_rate: cdi.annual_rate,
      source: cdi.source,
      reference_date: cdi.reference_date,
      frequency: "daily",
      metadata: cdi.metadata,
    });
  } catch (e) {
    results.push({
      code: "CDI",
      status: "error",
      error: e instanceof Error ? e.message : String(e),
    });
  }

  // TESOURO_*
  try {
    const picks = await fetchTesouroRates(controller.signal);
    for (const p of picks) {
      rowsToUpsert.push({
        code: p.code,
        label: LABELS[p.code],
        annual_rate: p.annual_rate,
        source: "tesouro-transparente-csv",
        reference_date: p.reference_date,
        frequency: "daily",
        metadata: p.metadata,
      });
    }
    const got = new Set(picks.map((p) => p.code));
    for (const code of ["TESOURO_POS", "TESOURO_PRE", "TESOURO_IPCA"] as const) {
      if (!got.has(code)) {
        results.push({
          code,
          status: "error",
          error: "título não encontrado no CSV oficial",
        });
      }
    }
  } catch (e) {
    for (const code of ["TESOURO_POS", "TESOURO_PRE", "TESOURO_IPCA"] as const) {
      results.push({
        code,
        status: "error",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  // Upsert apenas o que conseguimos coletar.
  // Códigos que falharam mantêm o valor anterior na tabela (resiliência).
  for (const row of rowsToUpsert) {
    const { error } = await admin
      .from("market_reference_rates")
      .upsert(
        { ...row, updated_at: new Date().toISOString() },
        { onConflict: "code" },
      );
    if (error) {
      results.push({ code: row.code, status: "error", error: error.message });
    } else {
      results.push({
        code: row.code,
        status: "updated",
        annual_rate: row.annual_rate,
        reference_date: row.reference_date,
        source: row.source,
      });
    }
  }

  clearTimeout(timeout);

  const ok = results.every((r) => r.status === "updated");
  return new Response(
    JSON.stringify({ ok, results, ran_at: new Date().toISOString() }),
    {
      status: ok ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
