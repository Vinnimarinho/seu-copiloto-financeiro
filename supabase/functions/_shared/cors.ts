// CORS allowlist por domínio. Cobre preview Lovable, app publicado e custom domains.
// Para webhook (stripe-webhook) NÃO use este helper — webhook não vem do navegador.
const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "https://luciuscopiloto.lovable.app",
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovable\.dev$/,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

const BASE_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.some((rule) =>
    typeof rule === "string" ? rule === origin : rule.test(origin)
  );
  return {
    ...BASE_HEADERS,
    // Só ecoa origin se estiver na allowlist; caso contrário, nega (sem header).
    ...(allowed ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}
