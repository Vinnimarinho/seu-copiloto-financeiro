// Webhook Stripe — fonte da verdade para estado de assinatura.
// Verifica assinatura HMAC, é idempotente (stripe_events_processed) e
// sincroniza public.billing_subscriptions via service role.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PLAN_BY_PRODUCT: Record<string, string> = {
  prod_UKvbpwN51mHV2B: "essencial",
  prod_UL9kxDPtv9xpCp: "pro",
};

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

function planFromProduct(productId: string | null | undefined): string {
  if (!productId) return "free";
  return PLAN_BY_PRODUCT[productId] ?? "free";
}

function tsToIso(ts: number | null | undefined): string | null {
  if (!ts || typeof ts !== "number") return null;
  return new Date(ts * 1000).toISOString();
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    log("Missing secrets");
    return new Response("misconfigured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    log("Invalid signature", { err: (err as Error).message });
    return new Response("invalid signature", { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  // Idempotência — ignora se já processado
  const { data: alreadyProcessed } = await supabase
    .from("stripe_events_processed")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (alreadyProcessed) {
    log("Already processed", { id: event.id });
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const upsertSubscription = async (sub: Stripe.Subscription, userIdHint?: string) => {
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      // Resolve user_id — primeiro pela metadata, depois por lookup
      let userId = userIdHint || (sub.metadata?.user_id ?? null);
      if (!userId) {
        // Busca em billing_subscriptions existentes pelo customer
        const { data: existing } = await supabase
          .from("billing_subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        userId = existing?.user_id ?? null;
      }
      if (!userId) {
        // Fallback: lookup do customer no Stripe -> email -> auth user
        const customer = await stripe.customers.retrieve(customerId);
        const email = !("deleted" in customer) ? customer.email : null;
        if (email) {
          const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          userId = users?.users?.find((u) => u.email === email)?.id ?? null;
        }
      }
      if (!userId) {
        log("Could not resolve user_id for subscription", { sub: sub.id });
        return;
      }

      const item = sub.items?.data?.[0];
      const product = item?.price?.product;
      const productId = typeof product === "string" ? product : (product as { id?: string })?.id ?? null;
      const planCode = planFromProduct(productId);

      await supabase
        .from("billing_subscriptions")
        .upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            plan_code: planCode,
            status: sub.status,
            price_id: item?.price?.id ?? null,
            currency: item?.price?.currency ?? null,
            current_period_start: tsToIso(sub.current_period_start as unknown as number),
            current_period_end: tsToIso(sub.current_period_end as unknown as number),
            cancel_at_period_end: !!sub.cancel_at_period_end,
            trial_end: tsToIso(sub.trial_end ?? null),
          },
          { onConflict: "user_id" },
        );
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.user_id || undefined;
        if (session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await upsertSubscription(sub, userId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.trial_will_end": {
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(typeof subId === "string" ? subId : subId.id);
          await upsertSubscription(sub);
        }
        break;
      }
      default:
        log("Ignored event type", { type: event.type });
    }

    await supabase.from("stripe_events_processed").insert({
      stripe_event_id: event.id,
      type: event.type,
      status: "ok",
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    log("Handler error", { err: (err as Error).message });
    await supabase
      .from("stripe_events_processed")
      .insert({ stripe_event_id: event.id, type: event.type, status: "error" })
      .select()
      .maybeSingle();
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
