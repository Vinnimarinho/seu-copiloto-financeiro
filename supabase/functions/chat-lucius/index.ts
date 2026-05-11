import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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

const SYSTEM_PROMPT = `Você é o LUCIUS — copiloto educacional brasileiro de apoio à compreensão da performance da carteira de investimentos. Atua como um sênior didático com profundo conhecimento do mercado financeiro brasileiro e internacional.

PERSONALIDADE:
- Sofisticado, direto e perspicaz como um membro da Casa Sonserina
- Use linguagem clara e acessível — NUNCA use jargão sem explicar
- Quando usar termos técnicos, sempre explique entre parênteses
- Didático, com analogias do dia a dia
- Confiante mas nunca arrogante. Empático com investidores iniciantes

REGRAS ABSOLUTAS (compliance CVM):
1. Você NÃO é consultor, assessor de investimento ou analista de valores mobiliários registrado.
2. NUNCA emita recomendação personalizada de compra/venda de ativos específicos.
3. NUNCA execute ou intermedie ordens.
4. NUNCA prometa rentabilidade, ganho garantido ou superioridade frente a bancos/corretoras.
5. NUNCA priorize ou favoreça bancos, corretoras, fundos ou gestores específicos.
6. Use os termos: "diagnóstico", "insight", "sugestão", "oportunidade", "ação possível", "caminho sugerido", "possível melhoria", "leitura da performance da carteira". NUNCA use "recomendação" sozinho — sempre qualifique com "educacional/de apoio".
7. Sempre deixe explícito que a decisão final é do usuário.
8. Se não souber algo, diga claramente — nunca invente dados de mercado.

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
  const corsHeaders = corsFor(req);
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

    const userId = userData.user.id;

    // Gate anti-duplicidade: usuário precisa ter CPF cadastrado
    const { data: cpfProfile } = await supabase
      .from("profiles")
      .select("cpf_hash")
      .eq("user_id", userId)
      .maybeSingle();
    if (!cpfProfile?.cpf_hash) {
      return new Response(
        JSON.stringify({ error: "cpf_required", message: "CPF é obrigatório para conversar com o LUCIUS." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Trial: plano gratuito só por 10 dias
    const { data: trial } = await supabase.rpc("user_trial_status", { _user_id: userId });
    const trialInfo = (trial ?? {}) as { is_paid?: boolean; trial_expired?: boolean };
    if (!trialInfo.is_paid && trialInfo.trial_expired) {
      return new Response(
        JSON.stringify({ error: "trial_expired", message: "Seu período gratuito de 10 dias acabou. Assine um plano ou compre créditos." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // SECURITY: ensure the user has credits before consuming AI gateway tokens.
    const { data: wallet, error: walletError } = await supabase
      .from("credit_wallets")
      .select("id, balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (walletError) throw new Error(`Erro ao consultar créditos: ${walletError.message}`);
    if (!wallet || wallet.balance <= 0) {
      return new Response(
        JSON.stringify({ error: "no_credits", message: "Você não tem créditos suficientes para conversar com o LUCIUS." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user context (portfolio, profile) for personalized answers
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

    // Deduct 1 credit for this chat turn (service-role bypasses RLS).
    const newBalance = wallet.balance - 1;
    await supabase.from("credit_wallets").update({ balance: newBalance }).eq("id", wallet.id);
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      wallet_id: wallet.id,
      amount: -1,
      resulting_balance: newBalance,
      type: "usage",
      reference_type: "chat_lucius",
      description: "Mensagem ao LUCIUS",
    });

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
