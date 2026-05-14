// geo-detect — detecta país do visitante via headers (CF/Vercel) com fallback para ipapi.co.
// Público (sem JWT). Usado pelo frontend para definir moeda padrão (BR→BRL, demais→USD).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Tenta headers de proxies/CDNs (Cloudflare, Vercel, Supabase Edge)
    let country =
      req.headers.get("cf-ipcountry") ??
      req.headers.get("x-vercel-ip-country") ??
      req.headers.get("x-country-code") ??
      null;

    if (!country || country === "XX" || country === "T1") {
      // Fallback: ipapi.co (gratuito, sem chave, ~1k req/dia por IP)
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "";
      try {
        const r = await fetch(`https://ipapi.co/${ip || ""}/country/`, {
          signal: AbortSignal.timeout(2500),
        });
        if (r.ok) {
          const txt = (await r.text()).trim().toUpperCase();
          if (txt && txt.length === 2) country = txt;
        }
      } catch {
        // silencioso — devolve default
      }
    }

    country = (country ?? "BR").toUpperCase();
    const currency = country === "BR" ? "BRL" : "USD";
    const language = country === "BR" || country === "PT" ? "pt-BR" : "en";

    return new Response(
      JSON.stringify({ country, currency, language }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ country: "BR", currency: "BRL", language: "pt-BR", error: (err as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  }
});
