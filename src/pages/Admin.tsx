import { AppSidebar } from "@/components/AppSidebar";
import { useAdminMetrics, AdminUser } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Briefcase, Target, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { getInvestorCategory } from "@/lib/investorProfile";

function MetricCard({ icon: Icon, label, value, sub, className }: { icon: any; label: string; value: string | number; sub?: string; className?: string }) {
  return (
    <Card className={cn("border-border", className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  essencial: "bg-primary/10 text-primary",
  pro: "bg-accent/10 text-accent",
};

const riskLabels: Record<string, string> = {
  conservador: "Herdeiro de Gringotes",
  moderado: "Estrategista da Sonserina",
  arrojado: "Lorde do Risco",
};

export default function Admin() {
  const { data, isLoading, error } = useAdminMetrics();
  const [search, setSearch] = useState("");

  if (error) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-heading font-semibold">Acesso negado</h2>
              <p className="text-sm text-muted-foreground mt-2">Você não tem permissão para acessar esta área.</p>
            </CardContent>
          </Card>
        </div>
      </AppSidebar>
    );
  }

  if (isLoading || !data) {
    return (
      <AppSidebar>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppSidebar>
    );
  }

  const { metrics, users } = data;
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q) ?? false) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone?.includes(q) ?? false)
    );
  });

  return (
    <AppSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Painel Administrativo 🐍</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral do desempenho da plataforma Lucius</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Total de Usuários" value={metrics.total_users} />
          <MetricCard icon={CreditCard} label="Assinantes Ativos" value={metrics.active_subscribers} sub={`${metrics.plan_breakdown?.essencial ?? 0} Essencial · ${metrics.plan_breakdown?.pro ?? 0} Pro`} />
          <MetricCard icon={Briefcase} label="Carteiras Criadas" value={metrics.total_portfolios} />
          <MetricCard icon={Target} label="Diagnósticos Realizados" value={metrics.total_analyses} />
        </div>

        {/* Distribution Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Distribuição por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(metrics.plan_breakdown ?? {}).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <Badge className={cn("text-xs", planColors[plan] ?? "bg-muted")}>{plan}</Badge>
                    <span className="text-sm font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Perfil de Risco dos Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 flex-wrap">
                {Object.entries(metrics.risk_breakdown ?? {}).map(([risk, count]) => (
                  <div key={risk} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-xs font-medium">{riskLabels[risk] ?? risk}</span>
                    <span className="text-sm font-semibold">{count as number}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="text-base font-heading">Base de Contatos</CardTitle>
                <CardDescription>Dados não-sensíveis para marketing e melhorias</CardDescription>
              </div>
              <Input placeholder="Buscar por nome, e-mail ou telefone…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Onboarding</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Último Acesso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{u.email}</TableCell>
                      <TableCell className="text-xs">{u.phone ?? "—"}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", planColors[u.plan] ?? "bg-muted")}>{u.plan}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{u.risk_tolerance ? riskLabels[u.risk_tolerance] ?? u.risk_tolerance : "—"}</TableCell>
                      <TableCell className="text-xs">{u.approximate_patrimony ?? "—"}</TableCell>
                      <TableCell className="text-xs font-mono">{u.credits_balance}</TableCell>
                      <TableCell>{u.onboarding_completed ? <Badge className="bg-success/10 text-success text-xs">Sim</Badge> : <Badge variant="outline" className="text-xs">Não</Badge>}</TableCell>
                      <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppSidebar>
  );
}
