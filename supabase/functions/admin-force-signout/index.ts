// admin-force-signout — revoga TODAS as sessões ativas de um usuário.
// Uso: incidente de segurança (token vazado, conta comprometida).
// Acesso: apenas admins (validado via tabela user_roles).
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
  email: z.string().email().optional(),
  user_id: z.string().uuid().optional(),
}).refine((v) => !!(v.email || v.user_id), { message: "email ou user_id obrigatório" });

serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    // 1. Autentica quem chamou
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Sem autorização");
    const { data: userData, error: userErr } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userErr || !userData.user) throw new Error("Token inválido");

    // 2. Confirma que é admin
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Valida payload
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Resolve user_id (por email se necessário)
    let targetUserId = parsed.data.user_id;
    if (!targetUserId && parsed.data.email) {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const found = list?.users?.find((u: any) => u.email?.toLowerCase() === parsed.data.email!.toLowerCase());
      if (!found) throw new Error("Usuário não encontrado pelo email");
      targetUserId = found.id;
    }
    if (!targetUserId) throw new Error("user_id não resolvido");

    // 5. Revoga TODAS as sessões (global signout)
    const { error: signOutErr } = await admin.auth.admin.signOut(targetUserId, "global");
    if (signOutErr) throw new Error(signOutErr.message);

    // 6. Audit log
    await admin.from("audit_logs").insert({
      user_id: userData.user.id,
      action: "admin_force_signout",
      table_name: "auth.users",
      record_id: targetUserId,
      new_data: { reason: "security_incident" },
    });

    return new Response(
      JSON.stringify({ ok: true, user_id: targetUserId, message: "Todas as sessões foram revogadas." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[admin-force-signout]", (e as Error).message);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
