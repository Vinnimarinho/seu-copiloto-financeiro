import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) =>
  console.log(`[PROCESS-PORTFOLIO] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

const AnalysisPeriodSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string().min(1).max(120),
}).refine((value) => value.startDate <= value.endDate, {
  message: "Período inválido",
  path: ["endDate"],
});

const BodySchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().min(1),
  analysisPeriod: AnalysisPeriodSchema,
});

const normalizeText = (value: string) => value.replace(/\u0000/g, " ").trim();

async function extractPdfText(fileBytes: Uint8Array) {
  try {
    const pdfParse = (await import("npm:pdf-parse@1.1.1/lib/pdf-parse.js")).default;
    const { Buffer } = await import("node:buffer");
    const pdfData = await pdfParse(Buffer.from(fileBytes));
    const text = normalizeText(pdfData.text || "");

    if (text.length >= 20) {
      log("PDF text extracted with pdf-parse", { chars: text.length });
      return text;
    }
  } catch (error) {
    log("pdf-parse failed", { error: (error as Error).message });
  }

  try {
    const pdfjs = await import("npm:pdfjs-dist@4.8.69/legacy/build/pdf.mjs");
    const document = await pdfjs.getDocument({ data: fileBytes, useWorkerFetch: false, isEvalSupported: false }).promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 10); pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const textContent = await page.getTextContent();
      pageTexts.push(
        textContent.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ")
      );
    }

    const text = normalizeText(pageTexts.join("\n\n"));
    if (text.length >= 20) {
      log("PDF text extracted with pdfjs", { chars: text.length });
      return text;
    }
  } catch (error) {
    log("pdfjs failed", { error: (error as Error).message });
  }

  return "";
}

async function extractSpreadsheetText(fileBytes: Uint8Array) {
  try {
    const XLSX = await import("npm:xlsx@0.18.5");
    const workbook = XLSX.read(fileBytes, { type: "array" });
    const text = normalizeText(
      workbook.SheetNames
        .map((sheetName: string) => XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]))
        .join("\n")
    );

    if (text.length >= 20) {
      log("Spreadsheet text extracted", { chars: text.length });
      return text;
    }
  } catch (error) {
    log("Spreadsheet extraction failed", { error: (error as Error).message });
  }

  return "";
}

async function extractTextFromFile(fileBytes: Uint8Array, fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return extractPdfText(fileBytes);
  }

  if (ext === "xlsx" || ext === "xls") {
    return extractSpreadsheetText(fileBytes);
  }

  if (ext === "csv" || ext === "ofx" || ext === "ofc" || ext === "txt") {
    const text = normalizeText(new TextDecoder().decode(fileBytes));
    log("Text file decoded", { chars: text.length });
    return text;
  }

  return "";
}

function buildInvestorContext(profile: any, investorProfile: any) {
  return {
    onboardingCompleted: Boolean(profile?.onboarding_completed),
    objectives: investorProfile?.objectives ?? [],
    investment_horizon: investorProfile?.investment_horizon ?? null,
    liquidity_need: investorProfile?.liquidity_need ?? null,
    risk_tolerance: investorProfile?.risk_tolerance ?? null,
    monthly_income_range: investorProfile?.monthly_income_range ?? null,
    approximate_patrimony: investorProfile?.approximate_patrimony ?? null,
    experience_years: investorProfile?.experience_years ?? null,
    preference: investorProfile?.preference ?? null,
  };
}

function buildPrompt(extractedText: string, fileName: string, analysisPeriod: z.infer<typeof AnalysisPeriodSchema>, investorContext: ReturnType<typeof buildInvestorContext>) {
  return `Você é um analista de carteira brasileiro extremamente criterioso.

ARQUIVO ENVIADO: ${fileName}
PERÍODO INFORMADO PELO USUÁRIO: ${analysisPeriod.label} (${analysisPeriod.startDate} até ${analysisPeriod.endDate})

PERFIL DO INVESTIDOR:
${JSON.stringify(investorContext, null, 2)}

CONTEÚDO EXTRAÍDO DO ARQUIVO:
${extractedText.substring(0, 18000)}

REGRAS IMPORTANTES:
1. Extraia as posições atuais ou mais recentes encontradas no documento.
2. Faça o diagnóstico considerando o período informado PELO USUÁRIO e os dados presentes no arquivo.
3. Se o documento não tiver informação suficiente para calcular performance exata no período, deixe isso explícito no resumo e nos insights, sem inventar números.
4. As recomendações precisam ser coerentes com o perfil do investidor, especialmente risco, liquidez, objetivos e preferência.
5. Use linguagem simples em português do Brasil.
6. Retorne SOMENTE JSON válido, sem markdown.

Formato de resposta:
{
  "positions": [
    {
      "ticker": "PETR4",
      "name": "Petrobras PN",
      "asset_class": "Ações",
      "asset_subclass": "Ação Nacional",
      "quantity": 100,
      "avg_price": 35.5,
      "current_price": 38.2,
      "current_value": 3820,
      "sector": "Petróleo e Gás",
      "currency": "BRL",
      "liquidity": "D+2"
    }
  ],
  "analysis": {
    "risk_score": 65,
    "diversification_score": 45,
    "liquidity_score": 70,
    "summary": "Resumo em português simples, incluindo leitura da performance no período informado e eventual limitação de dados.",
    "ai_insights": "Insights detalhados incluindo performance, riscos, concentração e aderência ao perfil do investidor.",
    "allocation_breakdown": {"Ações": 40, "FIIs": 30, "Renda Fixa": 30},
    "concentration_alerts": ["PETR4 representa 25% da carteira"]
  },
  "recommendations": [
    {
      "title": "Reduzir concentração em PETR4",
      "description": "Explique a ação recomendada e a relação com o perfil do investidor.",
      "recommendation_type": "rebalance",
      "estimated_impact": "Descreva o impacto esperado na carteira"
    }
  ]
}

Se não encontrar posições, retorne positions como array vazio, mas ainda gere analysis e recommendations contextualizadas.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  let importId: string | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sem autorização");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Erro de auth: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Usuário não autenticado");
    log("Auth OK", { userId: user.id });

    const parsedBody = BodySchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({ error: parsedBody.error.flatten().fieldErrors }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { filePath, fileName, analysisPeriod } = parsedBody.data;
    log("Processing file", { filePath, fileName, analysisPeriod });

    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("portfolio-files")
      .download(filePath);
    if (downloadErr) throw new Error(`Erro ao baixar arquivo: ${downloadErr.message}`);
    log("File downloaded", { size: fileData.size });

    const fileBytes = new Uint8Array(await fileData.arrayBuffer());
    const extractedText = await extractTextFromFile(fileBytes, fileName);

    if (!extractedText || extractedText.length < 20) {
      throw new Error("Não foi possível extrair conteúdo legível do arquivo. Tente um PDF com texto selecionável, planilha Excel ou CSV.");
    }

    const [
      { data: existingPortfolio, error: portfolioError },
      { data: profile, error: profileError },
      { data: investorProfile, error: investorProfileError },
      { data: wallet, error: walletError },
    ] = await Promise.all([
      supabase.from("portfolios").select("id").eq("user_id", user.id).limit(1).maybeSingle(),
      supabase.from("profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle(),
      supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("credit_wallets").select("id, balance").eq("user_id", user.id).maybeSingle(),
    ]);

    if (portfolioError) throw new Error(`Erro ao consultar carteira: ${portfolioError.message}`);
    if (profileError) throw new Error(`Erro ao consultar perfil: ${profileError.message}`);
    if (investorProfileError) throw new Error(`Erro ao consultar perfil de investidor: ${investorProfileError.message}`);
    if (walletError) throw new Error(`Erro ao consultar créditos: ${walletError.message}`);
    if (!profile?.onboarding_completed) throw new Error("Complete seu perfil de investidor antes de executar o diagnóstico.");
    if (!wallet) throw new Error("Carteira de créditos não encontrada.");
    if (wallet.balance <= 0) throw new Error("Você não tem créditos suficientes para rodar o diagnóstico.");

    let portfolioId: string;
    if (existingPortfolio) {
      portfolioId = existingPortfolio.id;
    } else {
      const { data: newPortfolio, error: pErr } = await supabase
        .from("portfolios")
        .insert({ user_id: user.id, name: "Minha Carteira" })
        .select("id")
        .single();
      if (pErr) throw new Error(`Erro ao criar carteira: ${pErr.message}`);
      portfolioId = newPortfolio.id;
    }
    log("Portfolio ready", { portfolioId });

    const ext = fileName?.split(".").pop()?.toLowerCase() || "pdf";
    const formatMap: Record<string, string> = { csv: "csv", xlsx: "xlsx", xls: "xlsx", pdf: "pdf", ofx: "ofx", ofc: "ofx" };
    const { data: importRecord, error: importErr } = await supabase
      .from("imports")
      .insert({
        user_id: user.id,
        portfolio_id: portfolioId,
        file_name: fileName || "arquivo.pdf",
        file_url: filePath,
        format: formatMap[ext] || "csv",
        status: "processing",
      })
      .select("id")
      .single();
    if (importErr) throw new Error(`Erro ao criar import: ${importErr.message}`);
    importId = importRecord.id;
    log("Import record created", { importId: importRecord.id });

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const aiPrompt = buildPrompt(
      extractedText,
      fileName,
      analysisPeriod,
      buildInvestorContext(profile, investorProfile)
    );

    log("Calling AI...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiPrompt }],
        temperature: 0.2,
      }),
    });

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      throw new Error(`AI API error: ${aiResponse.status} ${errBody}`);
    }

    const aiResult = await aiResponse.json();
    const aiText = aiResult.choices?.[0]?.message?.content || "";
    log("AI response received", { length: aiText.length });

    let parsed: any;
    try {
      const jsonMatch = aiText.replace(/```json|```/g, "").match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      log("Failed to parse AI response", { error: (e as Error).message, aiText: aiText.substring(0, 500) });
      throw new Error("IA não conseguiu processar o documento. Tente novamente ou use um arquivo diferente.");
    }

    const positions = parsed.positions || [];
    let positionsSaved = 0;

    if (positions.length > 0) {
      await supabase
        .from("portfolio_positions")
        .delete()
        .eq("portfolio_id", portfolioId)
        .eq("user_id", user.id);

      const positionsToInsert = positions.map((p: any) => ({
        user_id: user.id,
        portfolio_id: portfolioId,
        ticker: p.ticker || "N/A",
        name: p.name || p.ticker || "Desconhecido",
        asset_class: p.asset_class || "Outros",
        asset_subclass: p.asset_subclass || null,
        quantity: p.quantity || 0,
        avg_price: p.avg_price || 0,
        current_price: p.current_price || null,
        current_value: p.current_value || null,
        sector: p.sector || null,
        currency: p.currency || "BRL",
        liquidity: p.liquidity || "D+1",
      }));

      const { error: posErr } = await supabase
        .from("portfolio_positions")
        .insert(positionsToInsert);
      if (posErr) log("Error saving positions", { error: posErr.message });
      else positionsSaved = positionsToInsert.length;
    }
    log("Positions saved", { count: positionsSaved });

    const analysis = parsed.analysis || {};
    const { data: analysisRecord, error: analysisErr } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        portfolio_id: portfolioId,
        status: "completed",
        risk_score: analysis.risk_score || null,
        diversification_score: analysis.diversification_score || null,
        liquidity_score: analysis.liquidity_score || null,
        summary: analysis.summary || null,
        ai_insights: analysis.ai_insights || null,
        allocation_breakdown: analysis.allocation_breakdown || {},
        concentration_alerts: analysis.concentration_alerts || [],
        credits_used: 1,
      })
      .select("id")
      .single();
    if (analysisErr) log("Error saving analysis", { error: analysisErr.message });
    log("Analysis saved", { id: analysisRecord?.id });

    const recommendations = parsed.recommendations || [];
    if (recommendations.length > 0 && analysisRecord) {
      await supabase
        .from("recommendations")
        .delete()
        .eq("portfolio_id", portfolioId)
        .eq("user_id", user.id);

      const recsToInsert = recommendations.map((r: any) => ({
        user_id: user.id,
        portfolio_id: portfolioId,
        analysis_id: analysisRecord.id,
        title: r.title || "Recomendação",
        description: r.description || null,
        recommendation_type: r.recommendation_type || "general",
        estimated_impact: r.estimated_impact || null,
        status: "pending",
      }));

      const { error: recErr } = await supabase
        .from("recommendations")
        .insert(recsToInsert);
      if (recErr) log("Error saving recommendations", { error: recErr.message });
      else log("Recommendations saved", { count: recsToInsert.length });
    }

    await supabase
      .from("imports")
      .update({
        status: "completed",
        rows_processed: positionsSaved,
        rows_total: positionsSaved,
      })
      .eq("id", importRecord.id);

    const newBalance = wallet.balance - 1;
    await supabase
      .from("credit_wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id);

    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      wallet_id: wallet.id,
      type: "usage",
      amount: -1,
      resulting_balance: newBalance,
      description: `Análise de carteira (${analysisPeriod.label})`,
      reference_type: "analysis",
      reference_id: analysisRecord?.id,
    });
    log("Credit deducted", { newBalance });

    return new Response(
      JSON.stringify({
        success: true,
        portfolioId,
        analysisId: analysisRecord?.id,
        positionsCount: positionsSaved,
        recommendationsCount: recommendations.length,
        analysisPeriod,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = (error as Error).message;
    log("ERROR", { message });

    if (importId) {
      await supabase
        .from("imports")
        .update({ status: "error", error_message: message })
        .eq("id", importId);
    }

    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
