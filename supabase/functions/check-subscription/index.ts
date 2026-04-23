// check-subscription — fonte primária: tabela local billing_subscriptions
// (sincronizada pelo webhook do Stripe). Stripe é apenas fallback defensivo
// quando o webhook ainda não escreveu nada para esse usuário.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRODUCT_BY_PLAN: Record<string, string> = {
  essencial: "prod_UKvbpwN51mHV2B",
  pro: "prod_UL9kxDPtv9xpCp",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // 1) Fonte primária: tabela local
    const { data: localSub } = await supabase
      .from("billing_subscriptions")
      .select("plan_code, status, current_period_end, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (localSub && (localSub.status === "active" || localSub.status === "trialing")) {
      const notExpired =
        !localSub.current_period_end || new Date(localSub.current_period_end) > new Date();
      if (notExpired && localSub.plan_code && localSub.plan_code !== "free") {
        const productId = PRODUCT_BY_PLAN[localSub.plan_code] ?? null;
        return new Response(
          JSON.stringify({
            subscribed: true,
            product_id: productId,
            subscription_end: localSub.current_period_end,
            source: "local",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 2) Fallback Stripe — apenas se a tabela local ainda não foi populada.
    //    Tenta primeiro pelo customer_id local; só recorre a busca por email
    //    como último recurso, com logging explícito.
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ subscribed: false, product_id: null, subscription_end: null, source: "local-empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let customerId = localSub?.stripe_customer_id ?? null;
    if (!customerId && user.email) {
      log("FALLBACK: customer lookup by email", { email: user.email });
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = customers.data[0]?.id ?? null;
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ subscribed: false, product_id: null, subscription_end: null, source: "no-customer" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subs.data.length === 0) {
      return new Response(
        JSON.stringify({ subscribed: false, product_id: null, subscription_end: null, source: "stripe" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sub = subs.data[0];
    const periodEnd = sub.current_period_end as unknown as number;
    const subscriptionEnd =
      typeof periodEnd === "number" && periodEnd > 0
        ? new Date(periodEnd * 1000).toISOString()
        : null;
    const product = sub.items?.data?.[0]?.price?.product;
    const productId = typeof product === "string" ? product : (product as { id?: string })?.id ?? null;

    return new Response(
      JSON.stringify({
        subscribed: true,
        product_id: productId,
        subscription_end: subscriptionEnd,
        source: "stripe",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    log("ERROR", { message: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
