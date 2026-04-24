// Edge Function: sync-cdi-tesouro-rates
//
// Atualiza CDI e TESOURO_{POS,PRE,IPCA} na tabela `market_reference_rates`
// a partir de fontes oficiais:
//   - CDI: SGS 12 (CDI diário) → anualizado em 252 dias úteis.
//          Fallback: SGS 1178 (Selic Meta) - 0.10 p.p.
//   - Tesouro Direto: API pública oficial
//          https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json
//
// Princípios:
//   - Se a fonte externa falhar, NÃO sobrescreve o valor existente.
//   - Cada código é tratado de forma independente (uma falha não derruba os outros).
//   - SELIC e IPCA NÃO são tocados aqui (são responsabilidade da função
//     sync-market-reference-rates).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BCB_BASE = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";
const TESOURO_URL =
  "https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json";

interface BcbPoint {
  data: string; // dd/MM/yyyy
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
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`BCB ${sgsId} HTTP ${res.status}`);
  const json = (await res.json()) as BcbPoint[];
  return Array.isArray(json) && json[0] ? json[0] : null;
}

/**
 * Calcula o CDI anualizado.
 * Tenta SGS 12 (CDI diário em %) → (1 + d/100)^252 - 1.
 * Se falhar, usa Selic Meta (SGS 1178) menos 0,10 p.p.
 */
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
    // Fallback: Selic Meta - 0.10 p.p.
    const selicPoint = await fetchBcbLast(1178, signal);
    if (!selicPoint) throw new Error(`CDI fallback Selic indisponível (${(e as Error).message})`);
    const selicPct = Number(String(selicPoint.valor).replace(",", "."));
    if (!Number.isFinite(selicPct)) throw new Error("CDI fallback: Selic inválida");
    const annual = (selicPct - 0.1) / 100;
    return {
      annual_rate: annual,
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

interface TesouroBond {
  TrsrBd?: {
    nm?: string;          // ex.: "Tesouro Selic 2027"
    featrs?: string;      // descrição
    anulInvstmtRate?: number; // taxa anual de compra (%)
    anulRedRate?: number;     // taxa anual de venda (%)
    mtrtyDt?: string;     // ISO date vencimento
  };
}

interface TesouroResponse {
  response?: {
    TrsrBdTradgList?: TesouroBond[];
    BizSts?: { dtTm?: string };
  };
}

interface TesouroNormalized {
  code: "TESOURO_POS" | "TESOURO_PRE" | "TESOURO_IPCA";
  annual_rate: number; // decimal
  reference_date: string;
  source: string;
  metadata: Record<string, unknown>;
}

/**
 * Classifica um título do Tesouro Direto pelo nome.
 * Usa a taxa de COMPRA (anulInvstmtRate) — é a que o investidor "trava" ao comprar.
 */
function classifyBond(name: string): TesouroNormalized["code"] | null {
  const n = name.toLowerCase();
  if (n.includes("selic")) return "TESOURO_POS";
  if (n.includes("ipca")) return "TESOURO_IPCA";
  if (n.includes("prefixado") || n.includes("prefixed")) return "TESOURO_PRE";
  return null;
}

async function fetchTesouroRates(signal: AbortSignal): Promise<{
  rates: TesouroNormalized[];
  fetchedAt: string;
}> {
  const res = await fetch(TESOURO_URL, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Tesouro HTTP ${res.status}`);
  const json = (await res.json()) as TesouroResponse;
  const list = json?.response?.TrsrBdTradgList ?? [];
  if (list.length === 0) throw new Error("Tesouro: lista vazia");

  // Para cada categoria, escolhe o título com MAIOR vencimento (mais "longo"),
  // que costuma ser o mais ofertado/representativo.
  type Bucket = { rate: number; maturity: string; name: string };
  const buckets: Partial<Record<TesouroNormalized["code"], Bucket>> = {};

  for (const item of list) {
    const bond = item?.TrsrBd;
    if (!bond?.nm) continue;
    const rate = Number(bond.anulInvstmtRate);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    const code = classifyBond(bond.nm);
    if (!code) continue;
    const maturity = String(bond.mtrtyDt ?? "").slice(0, 10);
    const cur = buckets[code];
    if (!cur || maturity > cur.maturity) {
      buckets[code] = { rate, maturity, name: bond.nm };
    }
  }

  const fetchedAtIso = (json?.response?.BizSts?.dtTm ?? new Date().toISOString()).slice(0, 10);

  const out: TesouroNormalized[] = [];
  (["TESOURO_POS", "TESOURO_PRE", "TESOURO_IPCA"] as const).forEach((code) => {
    const b = buckets[code];
    if (!b) return;
    out.push({
      code,
      annual_rate: b.rate / 100,
      reference_date: fetchedAtIso,
      source: "tesouro-direto",
      metadata: {
        bondName: b.name,
        maturity: b.maturity,
        rawAnnualPercent: b.rate,
        basis: "anual_compra",
      },
    });
  });

  if (out.length === 0) throw new Error("Tesouro: nenhum título classificável");
  return { rates: out, fetchedAt: fetchedAtIso };
}

interface UpsertRow {
  code: string;
  label: string;
  annual_rate: number;
  source: string;
  reference_date: string;
  frequency: string;
  metadata: Record<string, unknown>;
}

const LABELS: Record<string, string> = {
  CDI: "CDI",
  TESOURO_POS: "Tesouro Selic (pós-fixado)",
  TESOURO_PRE: "Tesouro Prefixado",
  TESOURO_IPCA: "Tesouro IPCA+",
};

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const results: Array<
    | { code: string; status: "updated"; annual_rate: number; reference_date: string; source: string }
    | { code: string; status: "skipped"; reason: string }
    | { code: string; status: "error"; error: string }
  > = [];

  const rowsToUpsert: UpsertRow[] = [];

  // --- CDI ---
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

  // --- TESOURO_* ---
  try {
    const { rates } = await fetchTesouroRates(controller.signal);
    const got = new Set(rates.map((r) => r.code));
    for (const r of rates) {
      rowsToUpsert.push({
        code: r.code,
        label: LABELS[r.code],
        annual_rate: r.annual_rate,
        source: r.source,
        reference_date: r.reference_date,
        frequency: "daily",
        metadata: r.metadata,
      });
    }
    for (const code of ["TESOURO_POS", "TESOURO_PRE", "TESOURO_IPCA"] as const) {
      if (!got.has(code)) {
        results.push({
          code,
          status: "skipped",
          reason: "título não retornado pelo Tesouro Direto hoje",
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

  // Upsert apenas o que conseguimos coletar (preserva valores antigos para os
  // códigos que falharam).
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

  const ok = results.every((r) => r.status === "updated" || r.status === "skipped");
  return new Response(
    JSON.stringify({ ok, results, ran_at: new Date().toISOString() }),
    {
      status: ok ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
