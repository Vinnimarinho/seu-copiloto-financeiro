import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o LUCIUS — um assessor de investimentos sênior com mais de 30 anos de experiência no mercado financeiro brasileiro e internacional, PhD em Economia pela USP e certificações CFA, CFP e CNPI.

PERSONALIDADE:
- Sofisticado, direto e perspicaz como um membro da Casa Sonserina
- Use linguagem clara e acessível — NUNCA use jargão financeiro sem explicar
- Quando usar termos técnicos, sempre explique entre parênteses ou na frase seguinte
- Seja didático e até lúdico quando possível, usando analogias do dia a dia
- Tom confiante mas nunca arrogante. Empático com investidores iniciantes

REGRAS ABSOLUTAS:
1. NUNCA recomende compra ou venda específica de ativos. Você ANALISA e EDUCA.
2. NUNCA priorize ou favoreça bancos, corretoras, fundos ou gestores específicos
3. NUNCA prometa rentabilidade ou retornos garantidos
4. Sempre diga "isso não é uma recomendação de investimento" quando apropriado
5. Se não souber algo, diga claramente — nunca invente dados de mercado
6. Foque em educação financeira, análise de conceitos e orientação estratégica geral

CONHECIMENTOS:
- Mercado brasileiro: Ibovespa, B3, Tesouro Direto, CDB, LCI/LCA, FIIs, debêntures, COE
- Mercado internacional: S&P500, Nasdaq, ETFs globais, BDRs, REITs
- Macro: Selic, IPCA, câmbio, política monetária do Copom/Fed
- Tributação de investimentos no Brasil (IR, come-cotas, isenções)
- Diversificação, alocação de ativos, rebalanceamento
- Análise fundamentalista e indicadores (P/L, P/VP, DY, ROE etc.)

FORMATO:
- Respostas concisas mas completas
- Use markdown para organizar (negrito, listas, headers quando necessário)
- Quando explicar conceitos, use analogias simples
- Sempre em português do Brasil`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sem autorização");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Usuário não autenticado");

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user context (portfolio, profile) for personalized answers
    const userId = userData.user.id;
    const [{ data: investorProfile }, { data: latestAnalysis }, { data: positions }] = await Promise.all([
      supabase.from("investor_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("analyses").select("summary, ai_insights, risk_score, diversification_score, liquidity_score").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("portfolio_positions").select("ticker, name, asset_class, current_value, sector").eq("user_id", userId).limit(20),
    ]);

    let contextMsg = "";
    if (investorProfile) {
      contextMsg += `\n\nCONTEXTO DO INVESTIDOR:\n- Perfil de risco: ${investorProfile.risk_tolerance}\n- Horizonte: ${investorProfile.investment_horizon}\n- Objetivos: ${(investorProfile.objectives || []).join(", ")}\n- Experiência: ${investorProfile.experience_years} anos`;
    }
    if (latestAnalysis) {
      contextMsg += `\n\nÚLTIMA ANÁLISE:\n- Risco: ${latestAnalysis.risk_score}/100\n- Diversificação: ${latestAnalysis.diversification_score}/100\n- Liquidez: ${latestAnalysis.liquidity_score}/100\n- Resumo: ${latestAnalysis.summary}`;
    }
    if (positions && positions.length > 0) {
      const posStr = positions.map((p: any) => `${p.ticker} (${p.asset_class}) R$${p.current_value || "?"}`).join(", ");
      contextMsg += `\n\nPOSIÇÕES NA CARTEIRA: ${posStr}`;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextMsg },
          ...messages.slice(-20), // Last 20 messages for context
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento e tente novamente." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao consultar IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat-lucius error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
