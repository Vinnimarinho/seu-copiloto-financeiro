// subscription-manage — aplica ações de gerenciamento de assinatura:
//   action=change_plan      → troca de price com proração imediata
//   action=cancel_at_period_end → mantém acesso até o fim do período (1 clique)
//   action=resume           → cancela o cancelamento agendado
//
// O webhook do Stripe sincroniza billing_subscriptions; aqui só disparamos a
// ação. Toda checagem de propriedade é feita via stripe_subscription_id
// vinculado ao user_id na tabela local.
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

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("change_plan"),
    newPriceId: z.string().min(1),
  }),
  z.object({ action: z.literal("cancel_at_period_end") }),
  z.object({ action: z.literal("resume") }),
]);

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

    const { data: localSub } = await supabase
      .from("billing_subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, price_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!localSub?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: "no_active_subscription" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    if (parsed.data.action === "change_plan") {
      const sub = await stripe.subscriptions.retrieve(localSub.stripe_subscription_id);
      // Garante que a sub pertence ao usuário (defesa em profundidade)
      const subUserId = sub.metadata?.user_id;
      if (subUserId && subUserId !== user.id) {
        throw new Error("Subscription does not belong to user");
      }
      if (localSub.price_id === parsed.data.newPriceId) {
        return new Response(
          JSON.stringify({ error: "same_plan" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const item = sub.items.data[0];
      const updated = await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: parsed.data.newPriceId, quantity: 1 }],
        proration_behavior: "create_prorations",
        cancel_at_period_end: false,
        metadata: { ...(sub.metadata ?? {}), user_id: user.id },
      });
      return new Response(
        JSON.stringify({
          ok: true,
          action: "change_plan",
          subscription_id: updated.id,
          status: updated.status,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (parsed.data.action === "cancel_at_period_end") {
      const updated = await stripe.subscriptions.update(localSub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      const periodEnd = updated.current_period_end as unknown as number;
      return new Response(
        JSON.stringify({
          ok: true,
          action: "cancel_at_period_end",
          access_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (parsed.data.action === "resume") {
      const updated = await stripe.subscriptions.update(localSub.stripe_subscription_id, {
        cancel_at_period_end: false,
      });
      return new Response(
        JSON.stringify({ ok: true, action: "resume", status: updated.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "unknown_action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[SUBSCRIPTION-MANAGE]", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
