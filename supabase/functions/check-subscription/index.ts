// check-subscription — fonte primária: tabela local billing_subscriptions
// (sincronizada pelo webhook do Stripe). Lookup por email REMOVIDO; fallback
// só usa stripe_customer_id já persistido. Se não há registro local, retorna free.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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

// Em LIVE, defina STRIPE_PRODUCT_ESSENCIAL/STRIPE_PRODUCT_PRO com os product IDs reais.
const PRODUCT_BY_PLAN: Record<string, string> = {
  essencial: Deno.env.get("STRIPE_PRODUCT_ESSENCIAL") || "prod_UKvbpwN51mHV2B",
  pro: Deno.env.get("STRIPE_PRODUCT_PRO") || "prod_UL9kxDPtv9xpCp",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  const corsHeaders = corsFor(req);
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
      .select("plan_code, status, current_period_start, current_period_end, cancel_at_period_end, stripe_customer_id, stripe_subscription_id")
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
            status: localSub.status,
            subscription_start: localSub.current_period_start,
            subscription_end: localSub.current_period_end,
            cancel_at_period_end: localSub.cancel_at_period_end ?? false,
            source: "local",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // 2) Fallback Stripe — APENAS via stripe_customer_id já persistido localmente.
    //    Sem lookup por email (cross-account risk).
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const customerId = localSub?.stripe_customer_id ?? null;

    if (!stripeKey || !customerId) {
      // Considera "expirada" se há sub local mas vencida/cancelada
      const expired =
        !!localSub &&
        localSub.plan_code !== "free" &&
        (localSub.status === "canceled" ||
          localSub.status === "past_due" ||
          localSub.status === "unpaid" ||
          (!!localSub.current_period_end && new Date(localSub.current_period_end) <= new Date()));
      return new Response(
        JSON.stringify({
          subscribed: false,
          product_id: expired ? PRODUCT_BY_PLAN[localSub!.plan_code] ?? null : null,
          status: localSub?.status ?? "inactive",
          subscription_start: localSub?.current_period_start ?? null,
          subscription_end: localSub?.current_period_end ?? null,
          cancel_at_period_end: localSub?.cancel_at_period_end ?? false,
          source: customerId ? "no-stripe-key" : "local-empty",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subs.data.length === 0) {
      return new Response(
        JSON.stringify({
          subscribed: false,
          product_id: null,
          status: "inactive",
          subscription_start: null,
          subscription_end: null,
          cancel_at_period_end: false,
          source: "stripe",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sub = subs.data[0];
    const periodEnd = sub.current_period_end as unknown as number;
    const periodStart = sub.current_period_start as unknown as number;
    const subscriptionEnd =
      typeof periodEnd === "number" && periodEnd > 0
        ? new Date(periodEnd * 1000).toISOString()
        : null;
    const subscriptionStart =
      typeof periodStart === "number" && periodStart > 0
        ? new Date(periodStart * 1000).toISOString()
        : null;
    const product = sub.items?.data?.[0]?.price?.product;
    const productId = typeof product === "string" ? product : (product as { id?: string })?.id ?? null;
    const isActive = sub.status === "active" || sub.status === "trialing";

    return new Response(
      JSON.stringify({
        subscribed: isActive,
        product_id: productId,
        status: sub.status,
        subscription_start: subscriptionStart,
        subscription_end: subscriptionEnd,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        source: "stripe-by-customer-id",
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
