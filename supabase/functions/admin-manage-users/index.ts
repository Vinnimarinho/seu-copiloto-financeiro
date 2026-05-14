// admin-manage-users — cria (convida) ou exclui usuários (apenas admins).
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

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    email: z.string().email(),
    full_name: z.string().min(1).max(200).optional(),
    password: z.string().min(8).max(128).optional(),
    make_admin: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("delete"),
    user_id: z.string().uuid(),
  }),
]);

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

    if (parsed.data.action === "create") {
      const { email, full_name, password, make_admin } = parsed.data;
      let newUserId: string;

      if (password) {
        // Cria já com senha e email confirmado
        const { data: created, error: cErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: full_name ? { full_name } : undefined,
        });
        if (cErr || !created.user) throw new Error(cErr?.message ?? "create_failed");
        newUserId = created.user.id;
      } else {
        // Convite por email (define senha via link)
        const { data: invited, error: iErr } = await admin.auth.admin.inviteUserByEmail(email, {
          data: full_name ? { full_name } : undefined,
        });
        if (iErr || !invited.user) throw new Error(iErr?.message ?? "invite_failed");
        newUserId = invited.user.id;
      }

      if (make_admin) {
        await admin.from("user_roles").insert({ user_id: newUserId, role: "admin" });
      }

      await admin.from("audit_logs").insert({
        user_id: userData.user.id,
        action: "admin_create_user",
        table_name: "auth.users",
        record_id: newUserId,
        new_data: { email, full_name: full_name ?? null, with_password: !!password, make_admin: !!make_admin },
      });

      return new Response(JSON.stringify({ ok: true, user_id: newUserId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE
    const targetId = parsed.data.user_id;
    if (targetId === userData.user.id) {
      return new Response(JSON.stringify({ error: "cannot_delete_self" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limpa dados operacionais (mantém billing_subscriptions por retenção fiscal)
    const tables = [
      "credit_transactions", "credit_wallets", "recommendations", "reports",
      "analyses", "portfolio_positions", "portfolios", "imports",
      "investor_profiles", "profiles", "user_roles", "scenario_simulations",
    ];
    for (const t of tables) {
      await admin.from(t).delete().eq("user_id", targetId);
    }
    await admin.from("billing_subscriptions")
      .update({ status: "deleted_account" }).eq("user_id", targetId);

    // Audit antes de remover do auth
    await admin.from("audit_logs").insert({
      user_id: userData.user.id,
      action: "admin_delete_user",
      table_name: "auth.users",
      record_id: targetId,
    });

    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) throw new Error(delErr.message);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[admin-manage-users]", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
