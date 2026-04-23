// verify-plan-access — gating server-side de features pagas.
// Fonte primária: tabela local billing_subscriptions (sincronizada via webhook).
// Stripe é fallback defensivo, com prioridade de lookup por customer_id local.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.25.76";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PAID_PRODUCT_IDS = new Set(["prod_UKvbpwN51mHV2B", "prod_UL9kxDPtv9xpCp"]);
const PRO_PRODUCT_ID = "prod_UL9kxDPtv9xpCp";

const FEATURES = {
  opportunities: "opportunities",
  reports_pdf: "reports_pdf",
  unlimited_portfolios: "unlimited_portfolios",
} as const;

const BodySchema = z.object({
  feature: z.enum(["opportunities", "reports_pdf", "unlimited_portfolios"]),
});

const log = (step: string, details?: unknown) =>
  console.log(`[VERIFY-PLAN] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const auth = req.headers.get("Authorization");
    if (!auth) throw new Error("Sem autorização");
    const { data: u } = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    if (!u.user) throw new Error("Não autenticado");

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "feature inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { feature } = parsed.data;

    let productId: string | null = null;
    let isPaid = false;
    let isPro = false;
    let stripeCustomerId: string | null = null;

    // 1) Fonte primária: billing_subscriptions
    const { data: localSub } = await supabase
      .from("billing_subscriptions")
      .select("plan_code, status, price_id, current_period_end, stripe_customer_id")
      .eq("user_id", u.user.id)
      .maybeSingle();

    if (localSub) {
      stripeCustomerId = localSub.stripe_customer_id;
      if (localSub.status === "active" || localSub.status === "trialing") {
        const notExpired =
          !localSub.current_period_end || new Date(localSub.current_period_end) > new Date();
        if (notExpired) {
          isPaid = localSub.plan_code === "essencial" || localSub.plan_code === "pro";
          isPro = localSub.plan_code === "pro";
          productId = isPro ? PRO_PRODUCT_ID : isPaid ? "prod_UKvbpwN51mHV2B" : null;
        }
      }
    }

    // 2) Fallback Stripe — só se a tabela local não confirmou plano pago
    if (!isPaid) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        let customerId = stripeCustomerId;
        if (!customerId && u.user.email) {
          log("FALLBACK: customer lookup by email", { email: u.user.email });
          const customers = await stripe.customers.list({ email: u.user.email, limit: 1 });
          customerId = customers.data[0]?.id ?? null;
        }
        if (customerId) {
          const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "active",
            limit: 1,
          });
          if (subs.data.length > 0) {
            const product = subs.data[0].items?.data?.[0]?.price?.product;
            productId = typeof product === "string" ? product : (product as { id?: string })?.id ?? null;
            isPaid = productId ? PAID_PRODUCT_IDS.has(productId) : false;
            isPro = productId === PRO_PRODUCT_ID;
          }
        }
      }
    }

    let allowed = false;
    if (feature === FEATURES.opportunities) allowed = isPaid;
    if (feature === FEATURES.reports_pdf) allowed = isPaid;
    if (feature === FEATURES.unlimited_portfolios) allowed = isPro;

    return new Response(
      JSON.stringify({
        allowed,
        plan: isPro ? "pro" : isPaid ? "essencial" : "free",
        product_id: productId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ allowed: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
