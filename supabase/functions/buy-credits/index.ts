// buy-credits — checkout one-off Stripe para pacotes de crédito.
// Catálogo é hardcoded server-side para evitar adulteração via client.
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

// Catálogo server-side. Em LIVE, sobrescreva via env.
export const CREDIT_PACKS: Record<string, { credits: number; price_id: string; label: string }> = {
  "10": {
    credits: 10,
    price_id: Deno.env.get("STRIPE_PRICE_PACK_10") || "price_1TVxQZK2nJVoAQb07yJmo2cx",
    label: "Pacote 10 créditos",
  },
  "50": {
    credits: 50,
    price_id: Deno.env.get("STRIPE_PRICE_PACK_50") || "price_1TVxQaK2nJVoAQb0W4k5KCzr",
    label: "Pacote 50 créditos",
  },
  "200": {
    credits: 200,
    price_id: Deno.env.get("STRIPE_PRICE_PACK_200") || "price_1TVxQbK2nJVoAQb0B02ysb0N",
    label: "Pacote 200 créditos",
  },
};

const BodySchema = z.object({
  pack: z.enum(["10", "50", "200"]),
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
    const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const user = data.user;
    if (!user?.email) throw new Error("Não autenticado");

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "pack inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pack = CREDIT_PACKS[parsed.data.pack];

    // Reuso de customer existente
    const { data: localSub } = await supabase
      .from("billing_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    const customerId = localSub?.stripe_customer_id ?? undefined;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const origin = req.headers.get("origin") || "https://luciuscopiloto.lovable.app";
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        kind: "credits",
        pack: parsed.data.pack,
        credits: String(pack.credits),
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          kind: "credits",
          pack: parsed.data.pack,
          credits: String(pack.credits),
        },
      },
      line_items: [{ price: pack.price_id, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/payment/success?type=credits`,
      cancel_url: `${origin}/pricing`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
