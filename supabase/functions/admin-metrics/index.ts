import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS: (string | RegExp)[] = [
  "https://luciuscopiloto.lovable.app",
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const userId = userData.user?.id;
    if (!userId) throw new Error("User not found");

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch metrics using service role (bypasses RLS)
    const [
      { count: totalUsers },
      { data: profiles },
      { data: subscriptions },
      { data: investorProfiles },
      { count: totalPortfolios },
      { count: totalAnalyses },
      { data: recentSignups },
      { data: creditWallets },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("user_id, full_name, phone, created_at, onboarding_completed"),
      supabase.from("subscriptions").select("user_id, plan, status, created_at"),
      supabase.from("investor_profiles").select("user_id, risk_tolerance, investment_horizon, experience_years, objectives, approximate_patrimony"),
      supabase.from("portfolios").select("*", { count: "exact", head: true }),
      supabase.from("analyses").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("user_id, full_name, created_at").order("created_at", { ascending: false }).limit(10),
      supabase.from("credit_wallets").select("user_id, balance"),
    ]);

    // Get user emails from auth (admin only, no passwords exposed)
    const { data: authUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const emailMap: Record<string, { email: string; created_at: string; last_sign_in_at: string | null }> = {};
    authUsers?.users?.forEach((u: any) => {
      emailMap[u.id] = {
        email: u.email ?? "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      };
    });

    // Combine into a safe user list (NO sensitive data)
    const subMap: Record<string, any> = {};
    subscriptions?.forEach((s: any) => { subMap[s.user_id] = s; });

    const investorMap: Record<string, any> = {};
    investorProfiles?.forEach((ip: any) => { investorMap[ip.user_id] = ip; });

    const creditMap: Record<string, number> = {};
    creditWallets?.forEach((w: any) => { creditMap[w.user_id] = w.balance; });

    const users = (profiles ?? []).map((p: any) => {
      const auth = emailMap[p.user_id] ?? {};
      const sub = subMap[p.user_id];
      const inv = investorMap[p.user_id];
      return {
        user_id: p.user_id,
        full_name: p.full_name,
        email: auth.email ?? "—",
        phone: p.phone,
        created_at: p.created_at,
        last_sign_in_at: auth.last_sign_in_at,
        onboarding_completed: p.onboarding_completed,
        plan: sub?.plan ?? "free",
        subscription_status: sub?.status ?? "—",
        risk_tolerance: inv?.risk_tolerance,
        investment_horizon: inv?.investment_horizon,
        experience_years: inv?.experience_years,
        approximate_patrimony: inv?.approximate_patrimony,
        credits_balance: creditMap[p.user_id] ?? 0,
      };
    });

    // Aggregated metrics
    const activeSubs = subscriptions?.filter((s: any) => s.status === "active" && s.plan !== "free").length ?? 0;
    const planBreakdown: Record<string, number> = {};
    subscriptions?.forEach((s: any) => {
      planBreakdown[s.plan] = (planBreakdown[s.plan] || 0) + 1;
    });

    const riskBreakdown: Record<string, number> = {};
    investorProfiles?.forEach((ip: any) => {
      riskBreakdown[ip.risk_tolerance] = (riskBreakdown[ip.risk_tolerance] || 0) + 1;
    });

    return new Response(JSON.stringify({
      metrics: {
        total_users: totalUsers ?? 0,
        active_subscribers: activeSubs,
        total_portfolios: totalPortfolios ?? 0,
        total_analyses: totalAnalyses ?? 0,
        plan_breakdown: planBreakdown,
        risk_breakdown: riskBreakdown,
      },
      users,
      recent_signups: recentSignups ?? [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[ADMIN-METRICS]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
