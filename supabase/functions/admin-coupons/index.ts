// admin-coupons — lista e cria cupons no Stripe (apenas admins).
// GET  → lista cupons + códigos promocionais associados
// POST → cria cupom + (opcional) código promocional
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import Stripe from "npm:stripe@17.0.0";
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
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}

const CreateSchema = z.object({
  percent_off: z.union([z.literal(10), z.literal(35), z.literal(50), z.literal(100)]),
  duration: z.enum(["once", "forever", "repeating"]).default("once"),
  duration_in_months: z.number().int().min(1).max(36).optional(),
  name: z.string().min(2).max(80),
  promo_code: z.string().min(3).max(40).regex(/^[A-Z0-9_-]+$/i).optional(),
  max_redemptions: z.number().int().min(1).max(100000).optional(),
  redeem_by_days: z.number().int().min(1).max(365).optional(),
});

serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("no_auth");
    const { data: userData, error: userErr } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData.user) throw new Error("invalid_token");

    const { data: role } = await admin
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2024-06-20" });

    if (req.method === "GET") {
      const coupons = await stripe.coupons.list({ limit: 100 });
      const promos = await stripe.promotionCodes.list({ limit: 100 });
      const promosByCoupon: Record<string, any[]> = {};
      promos.data.forEach((p) => {
        const cid = typeof p.coupon === "string" ? p.coupon : p.coupon.id;
        (promosByCoupon[cid] ??= []).push({
          id: p.id, code: p.code, active: p.active,
          max_redemptions: p.max_redemptions, times_redeemed: p.times_redeemed,
          expires_at: p.expires_at,
        });
      });
      const data = coupons.data.map((c) => ({
        id: c.id, name: c.name, percent_off: c.percent_off,
        amount_off: c.amount_off, currency: c.currency,
        duration: c.duration, duration_in_months: c.duration_in_months,
        valid: c.valid, times_redeemed: c.times_redeemed, max_redemptions: c.max_redemptions,
        created: c.created, redeem_by: c.redeem_by,
        promotion_codes: promosByCoupon[c.id] ?? [],
      }));
      return new Response(JSON.stringify({ coupons: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const parsed = CreateSchema.safeParse(body);
      if (!parsed.success) {
        return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const p = parsed.data;
      const couponParams: Stripe.CouponCreateParams = {
        percent_off: p.percent_off,
        duration: p.duration,
        name: p.name,
      };
      if (p.duration === "repeating") {
        if (!p.duration_in_months) throw new Error("duration_in_months_required");
        couponParams.duration_in_months = p.duration_in_months;
      }
      if (p.max_redemptions) couponParams.max_redemptions = p.max_redemptions;
      if (p.redeem_by_days) couponParams.redeem_by = Math.floor(Date.now() / 1000) + p.redeem_by_days * 86400;

      const coupon = await stripe.coupons.create(couponParams);
      let promo: Stripe.PromotionCode | null = null;
      if (p.promo_code) {
        promo = await stripe.promotionCodes.create({
          coupon: coupon.id,
          code: p.promo_code.toUpperCase(),
          ...(p.max_redemptions ? { max_redemptions: p.max_redemptions } : {}),
        });
      }

      await admin.from("audit_logs").insert({
        user_id: userData.user.id,
        action: "admin_create_coupon",
        table_name: "stripe.coupons",
        record_id: null,
        new_data: { coupon_id: coupon.id, percent_off: p.percent_off, name: p.name, promo_code: promo?.code ?? null },
      });

      return new Response(JSON.stringify({ ok: true, coupon, promotion_code: promo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[admin-coupons]", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
