// Edge function: gera PDF branded LUCIUS a partir da última análise do usuário.
// Server-side: valida plano (Stripe), monta PDF com jsPDF, salva no bucket "reports"
// e cria registro em public.reports com signed URL.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { jsPDF } from "npm:jspdf@2.5.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAID_PRODUCT_IDS = new Set(["prod_UKvbpwN51mHV2B", "prod_UL9kxDPtv9xpCp"]);

// Brand LUCIUS — Sonserina
const BRAND = {
  emerald: [47, 133, 90] as [number, number, number],
  emeraldDark: [27, 79, 53] as [number, number, number],
  silver: [192, 192, 192] as [number, number, number],
  ink: [20, 24, 28] as [number, number, number],
  muted: [110, 116, 122] as [number, number, number],
  bg: [248, 249, 250] as [number, number, number],
};

function scoreLabel(score: number | null): string {
  if (score == null) return "—";
  if (score <= 40) return "Ruim";
  if (score <= 60) return "Atenção";
  if (score <= 80) return "Bom";
  return "Excelente";
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

function buildPdf(opts: {
  userName: string;
  reportId: string;
  analysis: any;
  positions: any[];
  recommendations: any[];
}): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 0;

  const drawHeader = () => {
    doc.setFillColor(...BRAND.emeraldDark);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LUCIUS", margin, 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Diagnóstico de Carteira", margin + 22, 14);
    doc.setFontSize(8);
    doc.text(`Gerado em ${fmtDate(new Date())}`, pageW - margin, 14, { align: "right" });
    y = 30;
  };

  const drawFooter = (pageNum: number, total: number) => {
    doc.setDrawColor(...BRAND.silver);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setTextColor(...BRAND.muted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`ID ${opts.reportId.slice(0, 8)} · LUCIUS · luciuscopiloto.lovable.app`, margin, pageH - 7);
    doc.text(`Página ${pageNum} de ${total}`, pageW - margin, pageH - 7, { align: "right" });
    doc.setFontSize(6);
    doc.text(
      "Conteúdo informativo. Não constitui recomendação personalizada de investimento (CVM 592/17).",
      pageW / 2,
      pageH - 4,
      { align: "center" }
    );
  };

  const ensureSpace = (need: number) => {
    if (y + need > pageH - 18) {
      doc.addPage();
      drawHeader();
    }
  };

  const sectionTitle = (txt: string) => {
    ensureSpace(12);
    doc.setFillColor(...BRAND.emerald);
    doc.rect(margin, y, 3, 6, "F");
    doc.setTextColor(...BRAND.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(txt, margin + 6, y + 5);
    y += 10;
  };

  const paragraph = (txt: string) => {
    doc.setTextColor(...BRAND.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(txt, pageW - margin * 2);
    ensureSpace(lines.length * 4.5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 2;
  };

  drawHeader();

  // Capa: nome + título
  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Diagnóstico da sua carteira", margin, y + 6);
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Para: ${opts.userName}`, margin, y);
  y += 8;

  // Cards de score
  const scores = [
    { label: "Risco", value: opts.analysis?.risk_score },
    { label: "Diversificação", value: opts.analysis?.diversification_score },
    { label: "Liquidez", value: opts.analysis?.liquidity_score },
  ];
  const cardW = (pageW - margin * 2 - 8) / 3;
  scores.forEach((s, i) => {
    const x = margin + i * (cardW + 4);
    doc.setFillColor(...BRAND.bg);
    doc.roundedRect(x, y, cardW, 22, 2, 2, "F");
    doc.setTextColor(...BRAND.muted);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(s.label, x + 4, y + 6);
    doc.setTextColor(...BRAND.emeraldDark);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(s.value != null ? String(s.value) : "—", x + 4, y + 14);
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(scoreLabel(s.value ?? null), x + 4, y + 19);
  });
  y += 28;

  if (opts.analysis?.summary) {
    sectionTitle("Resumo");
    paragraph(opts.analysis.summary);
  }

  if (opts.analysis?.ai_insights) {
    sectionTitle("Insights");
    paragraph(opts.analysis.ai_insights);
  }

  // Alertas de concentração
  const alerts = (opts.analysis?.concentration_alerts || []) as string[];
  if (alerts.length > 0) {
    sectionTitle("Alertas de concentração");
    alerts.forEach((a) => paragraph(`• ${a}`));
  }

  // Posições (tabela enxuta)
  if (opts.positions.length > 0) {
    sectionTitle("Posições da carteira");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    ensureSpace(8);
    doc.text("Ativo", margin, y);
    doc.text("Classe", margin + 60, y);
    doc.text("Qtd.", margin + 105, y);
    doc.text("Valor", margin + 130, y);
    doc.text("Liquidez", margin + 160, y);
    y += 2;
    doc.setDrawColor(...BRAND.silver);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...BRAND.ink);
    opts.positions.slice(0, 30).forEach((p) => {
      ensureSpace(6);
      const ticker = String(p.ticker || "").slice(0, 18);
      const name = String(p.name || "").slice(0, 30);
      doc.text(`${ticker} — ${name}`, margin, y);
      doc.text(String(p.asset_class || "").slice(0, 18), margin + 60, y);
      doc.text(String(p.quantity ?? "—"), margin + 105, y);
      const cv = p.current_value;
      doc.text(
        cv != null
          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: p.currency || "BRL" }).format(cv)
          : "—",
        margin + 130,
        y
      );
      doc.text(String(p.liquidity || "—"), margin + 160, y);
      y += 5;
    });
  }

  // Oportunidades
  if (opts.recommendations.length > 0) {
    sectionTitle("Oportunidades de melhoria");
    opts.recommendations.slice(0, 10).forEach((r, i) => {
      ensureSpace(14);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.emeraldDark);
      doc.text(`${i + 1}. ${r.title}`, margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...BRAND.ink);
      if (r.description) {
        const lines = doc.splitTextToSize(r.description, pageW - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 4.2;
      }
      if (r.estimated_impact) {
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...BRAND.muted);
        doc.text(`Impacto: ${r.estimated_impact}`, margin, y);
        y += 5;
      }
      y += 2;
    });
  }

  // Aviso final
  ensureSpace(20);
  doc.setFillColor(...BRAND.bg);
  doc.roundedRect(margin, y, pageW - margin * 2, 16, 2, 2, "F");
  doc.setTextColor(...BRAND.muted);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    "Este relatório é informativo e educacional. As decisões de investimento são de sua exclusiva responsabilidade.",
    margin + 4,
    y + 6,
    { maxWidth: pageW - margin * 2 - 8 }
  );
  doc.text("LUCIUS não executa ordens nem promete rentabilidade.", margin + 4, y + 11);
  y += 20;

  // Rodapés
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    drawFooter(i, total);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Sem autorização");
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    const user = u.user;
    if (!user?.email) throw new Error("Não autenticado");

    // Gating server-side via Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY ausente");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let productId: string | null = null;
    if (customers.data.length > 0) {
      const subs = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: "active",
        limit: 1,
      });
      if (subs.data.length > 0) {
        const product = subs.data[0].items?.data?.[0]?.price?.product;
        productId = typeof product === "string" ? product : (product as any)?.id ?? null;
      }
    }
    if (!productId || !PAID_PRODUCT_IDS.has(productId)) {
      return new Response(
        JSON.stringify({ error: "Geração de PDF disponível apenas em planos pagos." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Carrega análise mais recente, posições e oportunidades
    const [{ data: analysis }, { data: profile }] = await Promise.all([
      supabase
        .from("analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
    ]);

    if (!analysis) throw new Error("Nenhuma análise disponível. Rode um diagnóstico primeiro.");

    const [{ data: positions = [] }, { data: recs = [] }] = await Promise.all([
      supabase
        .from("portfolio_positions")
        .select("*")
        .eq("portfolio_id", analysis.portfolio_id)
        .order("current_value", { ascending: false, nullsFirst: false }),
      supabase
        .from("recommendations")
        .select("*")
        .eq("analysis_id", analysis.id)
        .order("created_at", { ascending: false }),
    ]);

    // Cria registro pending
    const { data: report, error: rErr } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        portfolio_id: analysis.portfolio_id,
        analysis_id: analysis.id,
        title: `Diagnóstico ${fmtDate(new Date(analysis.created_at))}`,
        report_type: "diagnostico",
        status: "generating",
      })
      .select("*")
      .single();
    if (rErr) throw new Error(rErr.message);

    try {
      const pdfBytes = buildPdf({
        userName: profile?.full_name || "Investidor",
        reportId: report.id,
        analysis,
        positions: positions ?? [],
        recommendations: recs ?? [],
      });

      const path = `${user.id}/${report.id}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("reports")
        .upload(path, pdfBytes, { contentType: "application/pdf", upsert: true });
      if (upErr) throw new Error(upErr.message);

      await supabase
        .from("reports")
        .update({ status: "generated", file_url: path })
        .eq("id", report.id);

      // Signed URL de 7 dias para download imediato
      const { data: signed } = await supabase.storage
        .from("reports")
        .createSignedUrl(path, 60 * 60 * 24 * 7);

      return new Response(
        JSON.stringify({ report_id: report.id, url: signed?.signedUrl ?? null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (genErr) {
      await supabase.from("reports").update({ status: "error" }).eq("id", report.id);
      throw genErr;
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
