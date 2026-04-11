import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) =>
  console.log(`[PROCESS-PORTFOLIO] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sem autorização");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Erro de auth: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Usuário não autenticado");
    log("Auth OK", { userId: user.id });

    const { filePath, fileName } = await req.json();
    if (!filePath) throw new Error("filePath é obrigatório");
    log("Processing file", { filePath, fileName });

    // Download file from storage
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from("portfolio-files")
      .download(filePath);
    if (downloadErr) throw new Error(`Erro ao baixar arquivo: ${downloadErr.message}`);
    log("File downloaded", { size: fileData.size });

    // Extract text from PDF
    let extractedText = "";
    const fileBytes = new Uint8Array(await fileData.arrayBuffer());

    // Try native PDF text extraction
    try {
      const pdfParse = (await import("npm:pdf-parse@1.1.1/lib/pdf-parse.js")).default;
      const { Buffer } = await import("node:buffer");
      const pdfData = await pdfParse(Buffer.from(fileBytes));
      extractedText = pdfData.text;
      log("PDF text extracted", { chars: extractedText.length });
    } catch (e) {
      log("PDF parse failed, treating as raw text", { error: (e as Error).message });
    }

    // For CSV/XLSX/OFX, decode as text
    if (!extractedText && fileName) {
      const ext = fileName.split(".").pop()?.toLowerCase();
      if (ext === "csv" || ext === "ofx" || ext === "ofc" || ext === "txt") {
        extractedText = new TextDecoder().decode(fileBytes);
        log("Text file decoded", { chars: extractedText.length });
      }
    }

    if (!extractedText || extractedText.trim().length < 20) {
      throw new Error("Não foi possível extrair texto do arquivo. Tente um PDF com texto selecionável ou CSV.");
    }

    // Ensure portfolio exists
    const { data: existingPortfolio } = await supabase
      .from("portfolios")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

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

    // Create import record
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
    log("Import record created", { importId: importRecord.id });

    // Call AI to extract positions and generate analysis
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY não configurada");

    const aiPrompt = `Você é um analista financeiro. Analise o extrato/documento abaixo e extraia as informações de investimentos.

DOCUMENTO:
${extractedText.substring(0, 15000)}

Retorne SOMENTE um JSON válido (sem markdown, sem \`\`\`) com este formato:
{
  "positions": [
    {
      "ticker": "PETR4",
      "name": "Petrobras PN",
      "asset_class": "Ações",
      "asset_subclass": "Ação Nacional",
      "quantity": 100,
      "avg_price": 35.50,
      "current_price": 38.20,
      "current_value": 3820.00,
      "sector": "Petróleo e Gás",
      "currency": "BRL",
      "liquidity": "D+2"
    }
  ],
  "analysis": {
    "risk_score": 65,
    "diversification_score": 45,
    "liquidity_score": 70,
    "summary": "Breve resumo da carteira em português simples",
    "ai_insights": "Insights detalhados sobre a carteira, pontos fortes e fracos",
    "allocation_breakdown": {"Ações": 40, "FIIs": 30, "Renda Fixa": 30},
    "concentration_alerts": ["PETR4 representa 25% da carteira"]
  },
  "recommendations": [
    {
      "title": "Reduzir concentração em PETR4",
      "description": "Sua posição em PETR4 está acima do recomendado. Considere diversificar.",
      "recommendation_type": "rebalance",
      "estimated_impact": "Redução de risco de concentração"
    }
  ]
}

Se não conseguir identificar posições, retorne positions como array vazio. Sempre retorne analysis e recommendations.
Use linguagem simples, sem jargões financeiros complexos.`;

    log("Calling AI...");
    const aiResponse = await fetch("https://ai.lovable.dev/api/chat", {
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

    // Parse AI response
    let parsed: any;
    try {
      // Try to extract JSON from response (handle possible markdown wrapping)
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in AI response");
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      log("Failed to parse AI response", { error: (e as Error).message, aiText: aiText.substring(0, 500) });
      throw new Error("IA não conseguiu processar o documento. Tente novamente ou use um arquivo diferente.");
    }

    // Save positions
    const positions = parsed.positions || [];
    let positionsSaved = 0;

    if (positions.length > 0) {
      // Clear existing positions for this portfolio
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

    // Save analysis
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

    // Save recommendations
    const recommendations = parsed.recommendations || [];
    if (recommendations.length > 0 && analysisRecord) {
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

    // Update import status
    await supabase
      .from("imports")
      .update({
        status: "completed",
        rows_processed: positionsSaved,
        rows_total: positionsSaved,
      })
      .eq("id", importRecord.id);

    // Deduct 1 credit
    const { data: wallet } = await supabase
      .from("credit_wallets")
      .select("id, balance")
      .eq("user_id", user.id)
      .single();

    if (wallet && wallet.balance > 0) {
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
        description: "Análise de carteira",
        reference_type: "analysis",
        reference_id: analysisRecord?.id,
      });
      log("Credit deducted", { newBalance });
    }

    return new Response(
      JSON.stringify({
        success: true,
        portfolioId,
        analysisId: analysisRecord?.id,
        positionsCount: positionsSaved,
        recommendationsCount: recommendations.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    log("ERROR", { message: (error as Error).message });
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
