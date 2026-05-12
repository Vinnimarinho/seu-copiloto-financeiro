// subscription-preview — calcula proração e impacto financeiro de uma troca
// de plano ANTES de aplicar. NÃO altera nada no Stripe; apenas simula via
// invoices.createPreview e devolve um resumo claro.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.25.76";

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "https://luciuscopiloto.lovable.app",
  "https://luciusinvest.com.br",
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovable\.dev$/,
  "http://localhost:8080",
  "http://localhost:5173",
];
function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.some((r) =>
    typeof r === "string" ? r === origin : r.test(origin),
  );
  return {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}

const BodySchema = z.object({
  newPriceId: z.string().min(1),
});

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
    if (!authHeader) throw new Error("Sem autorização");
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError) throw new Error(userError.message);
    const user = userData.user;
    if (!user) throw new Error("Usuário não autenticado");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { newPriceId } = parsed.data;

    const { data: localSub } = await supabase
      .from("billing_subscriptions")
      .select("stripe_customer_id, stripe_subscription_id, price_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!localSub?.stripe_subscription_id || !localSub?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "no_active_subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (localSub.price_id === newPriceId) {
      return new Response(
        JSON.stringify({ error: "same_plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const sub = await stripe.subscriptions.retrieve(localSub.stripe_subscription_id);
    const currentItem = sub.items.data[0];

    // Preview da fatura com a troca aplicada AGORA com proração
    const preview = await stripe.invoices.createPreview({
      customer: localSub.stripe_customer_id,
      subscription: sub.id,
      subscription_details: {
        items: [
          { id: currentItem.id, price: newPriceId, quantity: 1 },
        ],
        proration_behavior: "create_prorations",
        proration_date: Math.floor(Date.now() / 1000),
      },
    });

    const newPrice = await stripe.prices.retrieve(newPriceId, { expand: ["product"] });
    const currentPrice = currentItem.price;

    const periodEnd = (sub.current_period_end as unknown as number) ?? null;

    return new Response(
      JSON.stringify({
        currency: preview.currency,
        amount_due_now: preview.amount_due, // em centavos; pode ser negativo (crédito)
        subtotal: preview.subtotal,
        total: preview.total,
        starting_balance: preview.starting_balance,
        ending_balance: preview.ending_balance,
        next_payment_attempt: preview.next_payment_attempt
          ? new Date(preview.next_payment_attempt * 1000).toISOString()
          : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        current_price: {
          id: currentPrice.id,
          unit_amount: currentPrice.unit_amount,
          interval: currentPrice.recurring?.interval ?? null,
        },
        new_price: {
          id: newPrice.id,
          unit_amount: newPrice.unit_amount,
          interval: newPrice.recurring?.interval ?? null,
          product_id:
            typeof newPrice.product === "string"
              ? newPrice.product
              : (newPrice.product as { id?: string })?.id ?? null,
        },
        // Para o cliente entender as linhas individuais
        lines: preview.lines.data.map((l) => ({
          description: l.description,
          amount: l.amount,
          proration: l.proration ?? false,
          period_start: l.period?.start ? new Date(l.period.start * 1000).toISOString() : null,
          period_end: l.period?.end ? new Date(l.period.end * 1000).toISOString() : null,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("[SUBSCRIPTION-PREVIEW]", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
