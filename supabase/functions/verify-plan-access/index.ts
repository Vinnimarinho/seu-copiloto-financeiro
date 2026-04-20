// Edge function: validação server-side de acesso por plano.
// Front-end NUNCA é fonte da verdade — toda feature paga consulta esta function.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAID_PRODUCT_IDS = new Set([
  "prod_UKvbpwN51mHV2B", // Essencial
  "prod_UL9kxDPtv9xpCp", // Pro
]);

const PRO_PRODUCT_ID = "prod_UL9kxDPtv9xpCp";

const FEATURES = {
  opportunities: "opportunities",
  reports_pdf: "reports_pdf",
  unlimited_portfolios: "unlimited_portfolios",
} as const;

const BodySchema = z.object({
  feature: z.enum(["opportunities", "reports_pdf", "unlimited_portfolios"]),
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Sem autorização");
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!u.user?.email) throw new Error("Não autenticado");

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "feature inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { feature } = parsed.data;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY ausente");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: u.user.email, limit: 1 });
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

    const isPaid = productId ? PAID_PRODUCT_IDS.has(productId) : false;
    const isPro = productId === PRO_PRODUCT_ID;

    let allowed = false;
    if (feature === FEATURES.opportunities) allowed = isPaid;
    if (feature === FEATURES.reports_pdf) allowed = isPaid;
    if (feature === FEATURES.unlimited_portfolios) allowed = isPro;

    return new Response(
      JSON.stringify({ allowed, plan: isPro ? "pro" : isPaid ? "essencial" : "free", product_id: productId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ allowed: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
