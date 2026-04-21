import { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertTriangle, XCircle, Shield, Download } from "lucide-react";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useNoIndex } from "@/hooks/useNoIndex";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";

type Status = "ok" | "warn" | "fail";

interface CheckItem {
  category: "Auth" | "Billing" | "RLS" | "SEO" | "Compliance" | "Build";
  name: string;
  status: Status;
  detail: string;
  validatedAt: string; // ISO date
  evidence?: string;
}

const LAST_REVIEW = "2026-04-21";

const CHECKLIST: CheckItem[] = [
  // ─── Auth ───────────────────────────────────────────────
  {
    category: "Auth",
    name: "Confirmação de e-mail obrigatória",
    status: "ok",
    detail: "Cadastro exige verificação de e-mail antes do acesso ao app.",
    validatedAt: LAST_REVIEW,
    evidence: "supabase/config.toml + Signup.tsx",
  },
  {
    category: "Auth",
    name: "Rotas privadas protegidas",
    status: "ok",
    detail: "ProtectedRoute valida sessão, profile e onboarding.",
    validatedAt: LAST_REVIEW,
    evidence: "src/components/ProtectedRoute.tsx",
  },
  {
    category: "Auth",
    name: "RBAC para área admin",
    status: "ok",
    detail: "Tabela user_roles + has_role() com SECURITY DEFINER.",
    validatedAt: LAST_REVIEW,
    evidence: "user_roles + admin-metrics edge fn",
  },

  // ─── Billing / Stripe ───────────────────────────────────
  {
    category: "Billing",
    name: "Webhook Stripe com verificação HMAC",
    status: "ok",
    detail: "constructEventAsync valida stripe-signature com STRIPE_WEBHOOK_SECRET.",
    validatedAt: LAST_REVIEW,
    evidence: "supabase/functions/stripe-webhook/index.ts",
  },
  {
    category: "Billing",
    name: "Idempotência de eventos Stripe",
    status: "ok",
    detail: "Tabela stripe_events_processed bloqueia replays.",
    validatedAt: LAST_REVIEW,
    evidence: "stripe_events_processed (RLS deny-all)",
  },
  {
    category: "Billing",
    name: "Fonte de verdade local de assinatura",
    status: "ok",
    detail: "billing_subscriptions é consultada em verify-plan-access; Stripe é fallback.",
    validatedAt: LAST_REVIEW,
    evidence: "billing_subscriptions + verify-plan-access",
  },
  {
    category: "Billing",
    name: "Gating do plano gratuito",
    status: "ok",
    detail: "Oportunidades e funções premium bloqueadas no front e no backend.",
    validatedAt: LAST_REVIEW,
    evidence: "usePlanAccess + verify-plan-access",
  },

  // ─── RLS / Banco ────────────────────────────────────────
  {
    category: "RLS",
    name: "RLS habilitado em todas as tabelas",
    status: "ok",
    detail: "16 tabelas com RLS, incluindo billing_subscriptions e stripe_events_processed.",
    validatedAt: LAST_REVIEW,
  },
  {
    category: "RLS",
    name: "Tabelas sensíveis sem acesso de cliente",
    status: "ok",
    detail: "billing_subscriptions e stripe_events_processed: deny-all para clientes.",
    validatedAt: LAST_REVIEW,
  },
  {
    category: "RLS",
    name: "Ownership por auth.uid()",
    status: "ok",
    detail: "profiles, portfolios, analyses, reports, recommendations restritas ao usuário.",
    validatedAt: LAST_REVIEW,
  },
  {
    category: "RLS",
    name: "Buckets privados para arquivos sensíveis",
    status: "ok",
    detail: "Relatórios PDF acessíveis apenas via signed URL com TTL curto.",
    validatedAt: LAST_REVIEW,
    evidence: "report-download-url edge fn",
  },

  // ─── SEO / noindex ──────────────────────────────────────
  {
    category: "SEO",
    name: "Áreas privadas com noindex",
    status: "ok",
    detail: "useNoIndex aplicado em AppSidebar e Onboarding.",
    validatedAt: LAST_REVIEW,
    evidence: "src/hooks/useNoIndex.ts",
  },
  {
    category: "SEO",
    name: "robots.txt e sitemap.xml publicados",
    status: "ok",
    detail: "Sitemap com hreflang pt-BR / en / es.",
    validatedAt: LAST_REVIEW,
    evidence: "public/robots.txt + public/sitemap.xml",
  },
  {
    category: "SEO",
    name: "Metadados landing (OG, Twitter, JSON-LD)",
    status: "ok",
    detail: "title <60ch, description <160ch, canonical, og:image, schema SoftwareApplication.",
    validatedAt: LAST_REVIEW,
    evidence: "index.html",
  },

  // ─── Compliance / CVM / LGPD ────────────────────────────
  {
    category: "Compliance",
    name: "Copy regulatória CVM",
    status: "ok",
    detail: "Termos como 'recomendação' e 'consultoria' usados apenas em contexto de negação regulatória.",
    validatedAt: LAST_REVIEW,
    evidence: "RegulatoryDisclaimer + Terms.tsx",
  },
  {
    category: "Compliance",
    name: "Termos de Uso publicados",
    status: "ok",
    detail: "Página /terms acessível e referenciada no signup e no checkout.",
    validatedAt: LAST_REVIEW,
    evidence: "src/pages/Terms.tsx",
  },
  {
    category: "Compliance",
    name: "Política de Privacidade publicada",
    status: "ok",
    detail: "Página /privacy com base LGPD e canal do encarregado.",
    validatedAt: LAST_REVIEW,
    evidence: "src/pages/Privacy.tsx",
  },
  {
    category: "Compliance",
    name: "Aceite de termos com timestamp",
    status: "ok",
    detail: "DataConsentDialog + profiles.data_consent_accepted_at.",
    validatedAt: LAST_REVIEW,
    evidence: "DataConsentDialog.tsx",
  },
  {
    category: "Compliance",
    name: "Banner de cookies LGPD",
    status: "ok",
    detail: "CookieConsent exibido no primeiro acesso.",
    validatedAt: LAST_REVIEW,
  },

  // ─── Build / Qualidade ──────────────────────────────────
  {
    category: "Build",
    name: "npm ci sem erros",
    status: "ok",
    detail: "package.json e lockfile sincronizados.",
    validatedAt: LAST_REVIEW,
  },
  {
    category: "Build",
    name: "Lint limpo (0 erros / 0 warnings)",
    status: "ok",
    detail: "ESLint sem ocorrências em src/.",
    validatedAt: LAST_REVIEW,
  },
  {
    category: "Build",
    name: "Build otimizado",
    status: "ok",
    detail: "Bundle principal 267 kB (71 kB gzip) com code-splitting.",
    validatedAt: LAST_REVIEW,
    evidence: "vite.config.ts manualChunks",
  },
  {
    category: "Build",
    name: "Suite de testes",
    status: "ok",
    detail: "20/20 testes passando (score, planAccess, i18n, webhook idempotency).",
    validatedAt: LAST_REVIEW,
  },
  {
    category: "Build",
    name: "npm audit (high/critical)",
    status: "warn",
    detail: "Endpoint indisponível no sandbox — validar localmente antes do release.",
    validatedAt: LAST_REVIEW,
  },
];

const STATUS_META: Record<Status, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ok: { label: "OK", icon: CheckCircle2, className: "bg-success/15 text-success border-success/30" },
  warn: { label: "Atenção", icon: AlertTriangle, className: "bg-warning/15 text-warning-foreground border-warning/30" },
  fail: { label: "Falha", icon: XCircle, className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={meta.className}>
      <Icon className="w-3.5 h-3.5 mr-1" />
      {meta.label}
    </Badge>
  );
}

export default function Compliance() {
  useNoIndex();
  const { data: isAdmin, isLoading } = useIsAdmin();

  const summary = useMemo(() => {
    const total = CHECKLIST.length;
    const ok = CHECKLIST.filter((c) => c.status === "ok").length;
    const warn = CHECKLIST.filter((c) => c.status === "warn").length;
    const fail = CHECKLIST.filter((c) => c.status === "fail").length;
    return { total, ok, warn, fail, score: Math.round((ok / total) * 100) };
  }, []);

  const grouped = useMemo(() => {
    return CHECKLIST.reduce<Record<string, CheckItem[]>>((acc, item) => {
      (acc[item.category] ||= []).push(item);
      return acc;
    }, {});
  }, []);

  const exportJson = () => {
    const payload = {
      project: "Lucius",
      generated_at: new Date().toISOString(),
      last_review: LAST_REVIEW,
      summary,
      checks: CHECKLIST,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lucius-compliance-${LAST_REVIEW}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando…</div>;
  }
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin">
            <Logo size="sm" />
          </Link>
          <Button variant="outline" size="sm" onClick={exportJson}>
            <Download className="w-4 h-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            Painel administrativo · não indexado
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Checklist de Conformidade</h1>
          <p className="text-muted-foreground">
            Última validação: <strong className="text-foreground">{LAST_REVIEW}</strong> · Auth, Billing, RLS, SEO, Compliance e Build.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Score geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{summary.score}%</div>
              <p className="text-xs text-muted-foreground mt-1">{summary.ok}/{summary.total} verificações OK</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">OK</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{summary.ok}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Atenção</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning-foreground">{summary.warn}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Falhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-destructive">{summary.fail}</div>
            </CardContent>
          </Card>
        </div>

        {/* Grouped tables */}
        {Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Verificação</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-36">Última validação</TableHead>
                    <TableHead className="hidden md:table-cell">Evidência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="pl-6">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.detail}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.validatedAt}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground font-mono">
                        {item.evidence ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        <p className="text-xs text-muted-foreground pt-4">
          Este checklist é apoio operacional. Para auditoria externa, exporte o JSON e anexe aos artefatos da release.
        </p>
      </main>
    </div>
  );
}
