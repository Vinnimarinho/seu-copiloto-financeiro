// admin-grant-credits — concede créditos gratuitos a um usuário (apenas admins).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

const BodySchema = z.object({
  user_id: z.string().uuid(),
  amount: z.number().int().min(1).max(10000),
  reason: z.string().min(2).max(200).optional(),
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

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { user_id, amount, reason } = parsed.data;

    // Ensure wallet exists, then increment + log transaction
    await admin.from("credit_wallets")
      .upsert({ user_id, balance: 0 }, { onConflict: "user_id", ignoreDuplicates: true });

    const { data: wallet, error: wErr } = await admin
      .from("credit_wallets").select("id, balance").eq("user_id", user_id).single();
    if (wErr || !wallet) throw new Error("wallet_not_found");

    const newBalance = wallet.balance + amount;
    const { error: updErr } = await admin
      .from("credit_wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("user_id", user_id);
    if (updErr) throw new Error(updErr.message);

    const { error: txErr } = await admin.from("credit_transactions").insert({
      user_id,
      wallet_id: wallet.id,
      type: "purchase",
      amount,
      resulting_balance: newBalance,
      description: reason ?? `Crédito concedido pelo admin`,
      reference_type: "admin_grant",
      reference_id: userData.user.id,
    });
    if (txErr) throw new Error(txErr.message);

    await admin.from("audit_logs").insert({
      user_id: userData.user.id,
      action: "admin_grant_credits",
      table_name: "credit_wallets",
      record_id: user_id,
      new_data: { amount, reason: reason ?? null, new_balance: newBalance },
    });

    return new Response(JSON.stringify({ ok: true, balance: newBalance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[admin-grant-credits]", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
