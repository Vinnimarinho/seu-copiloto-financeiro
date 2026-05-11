// signup-precheck — valida CPF antes do signup e verifica unicidade do hash.
// Retorna o hash que o cliente deve embutir em user_metadata.cpf_hash no signUp.
// Acesso: público (sem JWT). Não cria usuário aqui — apenas pré-valida.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.25.76";
import { createHash } from "node:crypto";

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
  cpf: z.string().min(11).max(20),
});

function onlyDigits(s: string) {
  return (s ?? "").replace(/\D/g, "");
}

function validateCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i);
  let v1 = 11 - (sum % 11);
  if (v1 >= 10) v1 = 0;
  if (v1 !== parseInt(d[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i);
  let v2 = 11 - (sum % 11);
  if (v2 >= 10) v2 = 0;
  if (v2 !== parseInt(d[10], 10)) return false;
  return true;
}

function hashCpf(digits: string): string {
  // Pepper deve bater com o usado pela função SQL hash_cpf.
  // Mantemos o default sincronizado; se configurar app.cpf_pepper via secret, alinhar aqui também.
  const pepper = Deno.env.get("CPF_HASH_PEPPER") ?? "lucius-cpf-pepper-v1";
  return createHash("sha256").update(`${digits}:${pepper}`).digest("hex");
}

serve(async (req) => {
  const corsHeaders = corsFor(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "invalid_payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const digits = onlyDigits(parsed.data.cpf);
    if (!validateCpf(digits)) {
      return new Response(JSON.stringify({ error: "invalid_cpf" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cpfHash = hashCpf(digits);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const { data: exists, error } = await admin.rpc("cpf_hash_exists", { _hash: cpfHash });
    if (error) {
      console.error("[signup-precheck] rpc error", error.message);
      return new Response(JSON.stringify({ error: "internal" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (exists === true) {
      return new Response(JSON.stringify({ error: "cpf_already_in_use" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, cpf_hash: cpfHash }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[signup-precheck]", (e as Error).message);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
