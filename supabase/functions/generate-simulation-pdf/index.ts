// Edge function: gera PDF elegante de uma Simulação de Cenário do LUCIUS.
// Server-side: valida o usuário (JWT), carrega a simulação por id (com RLS),
// gera o PDF com jsPDF e devolve uma signed URL do bucket "simulation-reports".
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { jsPDF } from "npm:jspdf@2.5.2";

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "https://luciuscopiloto.lovable.app",
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovable\.dev$/,
  "http://localhost:8080",
  "http://localhost:5173",
];

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.some((r) => (typeof r === "string" ? r === origin : r.test(origin)));
  return {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}

const BRAND = {
  emerald: [47, 133, 90] as [number, number, number],
  emeraldDark: [27, 79, 53] as [number, number, number],
  silver: [192, 192, 192] as [number, number, number],
  ink: [20, 24, 28] as [number, number, number],
  muted: [110, 116, 122] as [number, number, number],
};

const BRL = (n: number) =>
  (Number(n) || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
const PCT = (n: number) => `${(Number(n) * 100).toFixed(2)}%`;
const PP = (n: number) => `${n > 0 ? "+" : ""}${Number(n).toFixed(2)} pp`;

interface SimRow {
  id: string;
  name: string;
  mode: string;
  preset: string | null;
  user_inputs: Record<string, unknown>;
  assumptions: { horizonMonths?: number; ratesUsed?: Array<{ code: string; label: string; annualRate: number }>; notes?: string[] };
  baseline_snapshot: { totalValue: number; weightedYieldAnnual: number; weightedRiskScore: number; topConcentrationPct: number };
  scenario_snapshot: { totalValue: number; weightedYieldAnnual: number; weightedRiskScore: number; topConcentrationPct: number };
  results: { delta: { yieldAnnualPct: number; estimatedReturn12m: number; liquidityScore: number; concentrationPct: number; riskScore: number } };
  created_at: string;
}

function buildPdf(sim: SimRow, userName: string): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 18;
  let y = 20;

  // Header
  doc.setFillColor(...BRAND.emeraldDark);
  doc.rect(0, 0, W, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LUCIUS · Simulação de Cenário", margin, 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(new Date(sim.created_at).toLocaleString("pt-BR"), W - margin, 18, { align: "right" });

  y = 38;
  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(sim.name, margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Investidor: ${userName}`, margin, y);
  y += 5;
  doc.text(`Modo: ${sim.mode}${sim.preset ? ` · Preset: ${sim.preset}` : ""}`, margin, y);
  y += 10;

  // Comparativo Antes x Depois
  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Comparativo Antes × Depois", margin, y);
  y += 6;

  const rows: Array<[string, string, string, string]> = [
    ["Valor investido", BRL(sim.baseline_snapshot.totalValue), BRL(sim.scenario_snapshot.totalValue), "—"],
    [
      "Rentabilidade estimada (a.a.)",
      PCT(sim.baseline_snapshot.weightedYieldAnnual),
      PCT(sim.scenario_snapshot.weightedYieldAnnual),
      PP(sim.results.delta.yieldAnnualPct),
    ],
    [
      "Concentração (maior peso)",
      PCT(sim.baseline_snapshot.topConcentrationPct),
      PCT(sim.scenario_snapshot.topConcentrationPct),
      PP(sim.results.delta.concentrationPct),
    ],
    [
      "Risco médio (0–100)",
      sim.baseline_snapshot.weightedRiskScore.toFixed(0),
      sim.scenario_snapshot.weightedRiskScore.toFixed(0),
      `${sim.results.delta.riskScore >= 0 ? "+" : ""}${sim.results.delta.riskScore.toFixed(0)}`,
    ],
    [
      "Resultado estimado em 12 meses",
      BRL(sim.baseline_snapshot.totalValue * sim.baseline_snapshot.weightedYieldAnnual),
      BRL(sim.scenario_snapshot.totalValue * sim.scenario_snapshot.weightedYieldAnnual),
      `${sim.results.delta.estimatedReturn12m >= 0 ? "+" : ""}${BRL(sim.results.delta.estimatedReturn12m)}`,
    ],
  ];

  // Table header
  doc.setFillColor(245, 247, 246);
  doc.rect(margin, y, W - 2 * margin, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BRAND.muted);
  doc.text("Métrica", margin + 2, y + 5.5);
  doc.text("Hoje", margin + 80, y + 5.5);
  doc.text("Cenário", margin + 120, y + 5.5);
  doc.text("Δ", margin + 160, y + 5.5);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.ink);
  for (const r of rows) {
    doc.text(r[0], margin + 2, y);
    doc.text(r[1], margin + 80, y);
    doc.text(r[2], margin + 120, y);
    doc.text(r[3], margin + 160, y);
    y += 7;
    doc.setDrawColor(230, 232, 235);
    doc.line(margin, y - 2, W - margin, y - 2);
  }

  y += 6;

  // Premissas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Premissas usadas", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Horizonte: ${sim.assumptions.horizonMonths ?? 12} meses`, margin, y);
  y += 5;
  for (const r of sim.assumptions.ratesUsed ?? []) {
    doc.text(`• ${r.label}: ${PCT(r.annualRate)} a.a.`, margin, y);
    y += 5;
  }
  for (const note of sim.assumptions.notes ?? []) {
    const lines = doc.splitTextToSize(`• ${note}`, W - 2 * margin);
    doc.text(lines, margin, y);
    y += lines.length * 4.5;
  }

  // Aviso compliance — sempre ao final
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  y = Math.max(y + 10, 260);
  doc.setDrawColor(...BRAND.silver);
  doc.line(margin, y, W - margin, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  const disclaimer =
    "As simulações têm caráter informativo e educacional, baseadas em parâmetros de mercado e hipóteses definidas pelo usuário. Não representam garantia de retorno nem substituem avaliação profissional regulada quando necessária. A decisão final é sempre do investidor.";
  const wrapped = doc.splitTextToSize(disclaimer, W - 2 * margin);
  doc.text(wrapped, margin, y);

  return new Uint8Array(doc.output("arraybuffer"));
}

serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Cliente com JWT do usuário (respeita RLS)
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const simulationId = String(body?.simulation_id ?? "").trim();
    if (!simulationId) {
      return new Response(JSON.stringify({ error: "simulation_id is required" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: sim, error: simErr } = await userClient
      .from("scenario_simulations")
      .select("*")
      .eq("id", simulationId)
      .maybeSingle();
    if (simErr || !sim) {
      return new Response(JSON.stringify({ error: "simulation not found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: profile } = await userClient
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = profile?.full_name || user.email?.split("@")[0] || "Investidor";

    const pdfBytes = buildPdf(sim as SimRow, userName);

    const path = `${user.id}/${simulationId}-${Date.now()}.pdf`;

    // Upload com service role para garantir gravação
    const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
    const { error: upErr } = await adminClient.storage
      .from("simulation-reports")
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (upErr) {
      return new Response(JSON.stringify({ error: `upload failed: ${upErr.message}` }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: signed, error: signErr } = await adminClient.storage
      .from("simulation-reports")
      .createSignedUrl(path, 60 * 60); // 1h
    if (signErr || !signed?.signedUrl) {
      return new Response(JSON.stringify({ error: "failed to sign url" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ url: signed.signedUrl, path }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message ?? "internal error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
