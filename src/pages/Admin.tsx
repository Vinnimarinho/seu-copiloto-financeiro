import { AppSidebar } from "@/components/AppSidebar";
import { useAdminMetrics, AdminUser } from "@/hooks/useAdmin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Briefcase, Target, Shield, Plus, Ticket, Coins, Loader2, UserPlus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

// ---------- Grant Credits Dialog ----------
function GrantCreditsDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [reason, setReason] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-grant-credits", {
        body: { user_id: user.user_id, amount, reason: reason || undefined },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`+${amount} créditos. Novo saldo: ${data.balance}`);
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      setOpen(false);
      setAmount(10);
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao conceder créditos"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
          <Coins className="w-3 h-3 mr-1" /> Créditos
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Conceder créditos grátis</DialogTitle>
          <CardDescription>{user.full_name ?? user.email} · saldo atual {user.credits_balance}</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="amount">Quantidade</Label>
            <Input id="amount" type="number" min={1} max={10000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Input id="reason" placeholder="Cortesia, suporte, brinde…" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || amount < 1}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Conceder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Create User Dialog ----------
function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-users", {
        body: {
          action: "create",
          email,
          full_name: fullName || undefined,
          password: password || undefined,
          make_admin: makeAdmin,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(typeof (data as any).error === "string" ? (data as any).error : JSON.stringify((data as any).error));
      return data;
    },
    onSuccess: () => {
      toast.success(password ? "Usuário criado" : "Convite enviado por email");
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      setOpen(false);
      setEmail(""); setFullName(""); setPassword(""); setMakeAdmin(false);
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao criar usuário"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> Novo usuário</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar usuário</DialogTitle>
          <CardDescription>Deixe a senha vazia para enviar convite por email.</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="new-email">E-mail *</Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@exemplo.com" />
          </div>
          <div>
            <Label htmlFor="new-name">Nome completo</Label>
            <Input id="new-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new-pass">Senha (opcional)</Label>
            <Input id="new-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mín. 8 caracteres — ou deixe vazio p/ convite" />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={makeAdmin} onCheckedChange={(v) => setMakeAdmin(!!v)} />
            Promover a administrador
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !email}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {password ? "Criar" : "Enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete User Button ----------
function DeleteUserButton({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-manage-users", {
        body: { action: "delete", user_id: user.user_id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      toast.success("Usuário excluído");
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao excluir"),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="w-3 h-3" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir {user.full_name ?? user.email}?</AlertDialogTitle>
          <AlertDialogDescription>
            Ação <strong>permanente</strong>. Apaga conta, carteiras, análises e histórico.
            Registros de cobrança são mantidos por obrigação legal.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); mutation.mutate(); }}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Excluir definitivamente
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
interface AdminCoupon {
  id: string; name: string | null; percent_off: number | null;
  duration: string; duration_in_months: number | null; valid: boolean;
  times_redeemed: number; max_redemptions: number | null; redeem_by: number | null;
  promotion_codes: { id: string; code: string; active: boolean; times_redeemed: number; max_redemptions: number | null }[];
}

function CouponsSection() {
  const qc = useQueryClient();
  const [percent, setPercent] = useState<10 | 35 | 50 | 100>(10);
  const [name, setName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [duration, setDuration] = useState<"once" | "forever" | "repeating">("once");
  const [months, setMonths] = useState<number>(3);
  const [maxRedemptions, setMaxRedemptions] = useState<number | "">("");
  const [redeemByDays, setRedeemByDays] = useState<number | "">("");

  const couponsQuery = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-coupons", { method: "GET" });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return (data as { coupons: AdminCoupon[] }).coupons;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: any = { percent_off: percent, duration, name };
      if (duration === "repeating") body.duration_in_months = months;
      if (promoCode) body.promo_code = promoCode;
      if (maxRedemptions) body.max_redemptions = Number(maxRedemptions);
      if (redeemByDays) body.redeem_by_days = Number(redeemByDays);
      const { data, error } = await supabase.functions.invoke("admin-coupons", { body });
      if (error) throw error;
      if ((data as any)?.error) throw new Error(JSON.stringify((data as any).error));
      return data;
    },
    onSuccess: () => {
      toast.success("Cupom criado");
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setName(""); setPromoCode(""); setMaxRedemptions(""); setRedeemByDays("");
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao criar cupom"),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2"><Plus className="w-4 h-4" /> Novo cupom</CardTitle>
          <CardDescription>Aplicado no checkout do Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Desconto</Label>
            <Select value={String(percent)} onValueChange={(v) => setPercent(Number(v) as 10 | 35 | 50 | 100)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="35">35%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="100">100% (grátis)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lançamento Sonserina" />
          </div>
          <div>
            <Label>Duração</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Uma cobrança</SelectItem>
                <SelectItem value="repeating">N meses</SelectItem>
                <SelectItem value="forever">Para sempre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {duration === "repeating" && (
            <div>
              <Label>Meses</Label>
              <Input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
            </div>
          )}
          <div>
            <Label>Código promocional (opcional)</Label>
            <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="LUCIUS50" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Máx. usos</Label>
              <Input type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <Label>Expira em (dias)</Label>
              <Input type="number" min={1} value={redeemByDays} onChange={(e) => setRedeemByDays(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
          <Button className="w-full" disabled={createMutation.isPending || !name} onClick={() => createMutation.mutate()}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar cupom
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2"><Ticket className="w-4 h-4" /> Cupons existentes</CardTitle>
          <CardDescription>Lista direto do Stripe</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {couponsQuery.isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando…</div>
          ) : couponsQuery.error ? (
            <div className="p-6 text-center text-sm text-destructive">Erro: {(couponsQuery.error as Error).message}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Códigos</TableHead>
                  <TableHead>Usos</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(couponsQuery.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">Nenhum cupom criado ainda</TableCell></TableRow>
                ) : couponsQuery.data!.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-xs">{c.name ?? c.id}</TableCell>
                    <TableCell className="text-xs">{c.percent_off ? `${c.percent_off}%` : "—"}</TableCell>
                    <TableCell className="text-xs">{c.duration === "once" ? "1x" : c.duration === "forever" ? "Sempre" : `${c.duration_in_months}m`}</TableCell>
                    <TableCell className="text-xs">
                      {c.promotion_codes.length === 0 ? <span className="text-muted-foreground">—</span> : (
                        <div className="flex flex-wrap gap-1">
                          {c.promotion_codes.map((p) => (
                            <Badge key={p.id} variant={p.active ? "default" : "outline"} className="text-[10px] font-mono">{p.code}</Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{c.times_redeemed}{c.max_redemptions ? ` / ${c.max_redemptions}` : ""}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", c.valid ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                        {c.valid ? "Válido" : "Inativo"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------- Page ----------
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
          <p className="text-sm text-muted-foreground mt-1">Visão geral, usuários e cupons da plataforma Lucius</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Users} label="Total de Usuários" value={metrics.total_users} />
          <MetricCard icon={CreditCard} label="Assinantes Ativos" value={metrics.active_subscribers} sub={`${metrics.plan_breakdown?.essencial ?? 0} Essencial · ${metrics.plan_breakdown?.pro ?? 0} Pro`} />
          <MetricCard icon={Briefcase} label="Carteiras Criadas" value={metrics.total_portfolios} />
          <MetricCard icon={Target} label="Diagnósticos Realizados" value={metrics.total_analyses} />
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="overview">Distribuições</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base font-heading">Base de Contatos</CardTitle>
                    <CardDescription>Conceda créditos grátis ou consulte status dos usuários</CardDescription>
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
                      <TableHead>Plano</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Patrimônio</TableHead>
                      <TableHead>Créditos</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                          <TableCell className="text-xs">{u.email}</TableCell>
                          <TableCell><Badge className={cn("text-xs", planColors[u.plan] ?? "bg-muted")}>{u.plan}</Badge></TableCell>
                          <TableCell className="text-xs">{u.risk_tolerance ? riskLabels[u.risk_tolerance] ?? u.risk_tolerance : "—"}</TableCell>
                          <TableCell className="text-xs">{u.approximate_patrimony ?? "—"}</TableCell>
                          <TableCell className="text-xs font-mono">{u.credits_balance}</TableCell>
                          <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                          <TableCell><GrantCreditsDialog user={u} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coupons" className="mt-4">
            <CouponsSection />
          </TabsContent>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base font-heading">Distribuição por Plano</CardTitle></CardHeader>
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
                <CardHeader className="pb-3"><CardTitle className="text-base font-heading">Perfil de Risco</CardTitle></CardHeader>
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
          </TabsContent>
        </Tabs>
      </div>
    </AppSidebar>
  );
}
