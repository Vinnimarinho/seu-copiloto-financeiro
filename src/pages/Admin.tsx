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
import { useTranslation } from "react-i18next";

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

// ---------- Grant Credits Dialog ----------
function GrantCreditsDialog({ user }: { user: AdminUser }) {
  const { t } = useTranslation();
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
      toast.success(t("admin.grant.successToast", { amount, balance: data.balance }));
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      setOpen(false);
      setAmount(10);
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message || t("admin.grant.errorToast")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
          <Coins className="w-3 h-3 mr-1" /> {t("admin.grant.btn")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.grant.title")}</DialogTitle>
          <CardDescription>{t("admin.grant.balance", { name: user.full_name ?? user.email, balance: user.credits_balance })}</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="amount">{t("admin.grant.amount")}</Label>
            <Input id="amount" type="number" min={1} max={10000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="reason">{t("admin.grant.reason")}</Label>
            <Input id="reason" placeholder={t("admin.grant.reasonPh")} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || amount < 1}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("admin.grant.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Create User Dialog ----------
function CreateUserDialog() {
  const { t } = useTranslation();
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
      toast.success(password ? t("admin.create.createdToast") : t("admin.create.invitedToast"));
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      setOpen(false);
      setEmail(""); setFullName(""); setPassword(""); setMakeAdmin(false);
    },
    onError: (e: Error) => toast.error(e.message || t("admin.create.errorToast")),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> {t("admin.users.newUser")}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("admin.create.title")}</DialogTitle>
          <CardDescription>{t("admin.create.desc")}</CardDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="new-email">{t("admin.create.email")}</Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("admin.create.emailPh")} />
          </div>
          <div>
            <Label htmlFor="new-name">{t("admin.create.name")}</Label>
            <Input id="new-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="new-pass">{t("admin.create.passLabel")}</Label>
            <Input id="new-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("admin.create.passPh")} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={makeAdmin} onCheckedChange={(v) => setMakeAdmin(!!v)} />
            {t("admin.create.promote")}
          </label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !email}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {password ? t("admin.create.createBtn") : t("admin.create.inviteBtn")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Delete User Button ----------
function DeleteUserButton({ user }: { user: AdminUser }) {
  const { t } = useTranslation();
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
      toast.success(t("admin.delete.successToast"));
      qc.invalidateQueries({ queryKey: ["admin-metrics"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || t("admin.delete.errorToast")),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => setOpen(true)}>
        <Trash2 className="w-3 h-3" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("admin.delete.title", { name: user.full_name ?? user.email })}</AlertDialogTitle>
          <AlertDialogDescription
            dangerouslySetInnerHTML={{ __html: t("admin.delete.desc") }}
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>{t("common.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); mutation.mutate(); }}
            disabled={mutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("admin.delete.confirm")}
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
  const { t } = useTranslation();
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
      toast.success(t("admin.coupons.createdToast"));
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      setName(""); setPromoCode(""); setMaxRedemptions(""); setRedeemByDays("");
    },
    onError: (e: Error) => toast.error(e.message || t("admin.coupons.errorToast")),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2"><Plus className="w-4 h-4" /> {t("admin.coupons.newTitle")}</CardTitle>
          <CardDescription>{t("admin.coupons.newDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t("admin.coupons.discount")}</Label>
            <Select value={String(percent)} onValueChange={(v) => setPercent(Number(v) as 10 | 35 | 50 | 100)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10%</SelectItem>
                <SelectItem value="35">35%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="100">{t("admin.coupons.free100")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("admin.coupons.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("admin.coupons.namePh")} />
          </div>
          <div>
            <Label>{t("admin.coupons.duration")}</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">{t("admin.coupons.durationOnce")}</SelectItem>
                <SelectItem value="repeating">{t("admin.coupons.durationRepeating")}</SelectItem>
                <SelectItem value="forever">{t("admin.coupons.durationForever")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {duration === "repeating" && (
            <div>
              <Label>{t("admin.coupons.months")}</Label>
              <Input type="number" min={1} max={36} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
            </div>
          )}
          <div>
            <Label>{t("admin.coupons.promoCode")}</Label>
            <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="LUCIUS50" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>{t("admin.coupons.maxRedemptions")}</Label>
              <Input type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("admin.coupons.redeemBy")}</Label>
              <Input type="number" min={1} value={redeemByDays} onChange={(e) => setRedeemByDays(e.target.value === "" ? "" : Number(e.target.value))} />
            </div>
          </div>
          <Button className="w-full" disabled={createMutation.isPending || !name} onClick={() => createMutation.mutate()}>
            {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("admin.coupons.create")}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-heading flex items-center gap-2"><Ticket className="w-4 h-4" /> {t("admin.coupons.existingTitle")}</CardTitle>
          <CardDescription>{t("admin.coupons.existingDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {couponsQuery.isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">{t("admin.coupons.loading")}</div>
          ) : couponsQuery.error ? (
            <div className="p-6 text-center text-sm text-destructive">{t("admin.coupons.loadError", { msg: (couponsQuery.error as Error).message })}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.coupons.th.name")}</TableHead>
                  <TableHead>{t("admin.coupons.th.discount")}</TableHead>
                  <TableHead>{t("admin.coupons.th.duration")}</TableHead>
                  <TableHead>{t("admin.coupons.th.codes")}</TableHead>
                  <TableHead>{t("admin.coupons.th.uses")}</TableHead>
                  <TableHead>{t("admin.coupons.th.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(couponsQuery.data ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">{t("admin.coupons.noCoupons")}</TableCell></TableRow>
                ) : couponsQuery.data!.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium text-xs">{c.name ?? c.id}</TableCell>
                    <TableCell className="text-xs">{c.percent_off ? `${c.percent_off}%` : "—"}</TableCell>
                    <TableCell className="text-xs">{c.duration === "once" ? t("admin.coupons.durationOnceShort") : c.duration === "forever" ? t("admin.coupons.durationForeverShort") : `${c.duration_in_months}m`}</TableCell>
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
                        {c.valid ? t("admin.coupons.valid") : t("admin.coupons.inactive")}
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
  const { t, i18n } = useTranslation();
  const { data, isLoading, error } = useAdminMetrics();
  const [search, setSearch] = useState("");
  const dateLocale = i18n.language?.startsWith("en") ? "en-US" : "pt-BR";

  if (error) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h2 className="text-lg font-heading font-semibold">{t("admin.deniedTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("admin.deniedDesc")}</p>
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

  const riskLabel = (key: string | null | undefined) =>
    key ? t(`admin.riskLabels.${key}`, { defaultValue: key }) : "—";

  return (
    <AppSidebar>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">{t("admin.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("admin.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard icon={Users} label={t("admin.metrics.totalUsers")} value={metrics.total_users} />
          <MetricCard icon={CreditCard} label={t("admin.metrics.activeSubs")} value={metrics.active_subscribers} sub={t("admin.metrics.subsBreakdown", { essencial: metrics.plan_breakdown?.essencial ?? 0, pro: metrics.plan_breakdown?.pro ?? 0 })} />
          <MetricCard icon={Briefcase} label={t("admin.metrics.portfolios")} value={metrics.total_portfolios} />
          <MetricCard icon={Target} label={t("admin.metrics.analyses")} value={metrics.total_analyses} />
        </div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">{t("admin.tabs.users")}</TabsTrigger>
            <TabsTrigger value="coupons">{t("admin.tabs.coupons")}</TabsTrigger>
            <TabsTrigger value="overview">{t("admin.tabs.overview")}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="text-base font-heading">{t("admin.users.title")}</CardTitle>
                    <CardDescription>{t("admin.users.desc")}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input placeholder={t("admin.users.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
                    <CreateUserDialog />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("admin.users.th.name")}</TableHead>
                      <TableHead>{t("admin.users.th.email")}</TableHead>
                      <TableHead>{t("admin.users.th.plan")}</TableHead>
                      <TableHead>{t("admin.users.th.profile")}</TableHead>
                      <TableHead>{t("admin.users.th.patrimony")}</TableHead>
                      <TableHead>{t("admin.users.th.credits")}</TableHead>
                      <TableHead>{t("admin.users.th.createdAt")}</TableHead>
                      <TableHead>{t("admin.users.th.lastSignIn")}</TableHead>
                      <TableHead>{t("admin.users.th.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">{t("admin.users.empty")}</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-medium">{u.full_name ?? "—"}</TableCell>
                          <TableCell className="text-xs">{u.email}</TableCell>
                          <TableCell><Badge className={cn("text-xs", planColors[u.plan] ?? "bg-muted")}>{u.plan}</Badge></TableCell>
                          <TableCell className="text-xs">{riskLabel(u.risk_tolerance)}</TableCell>
                          <TableCell className="text-xs">{u.approximate_patrimony ?? "—"}</TableCell>
                          <TableCell className="text-xs font-mono">{u.credits_balance}</TableCell>
                          <TableCell className="text-xs">{new Date(u.created_at).toLocaleDateString(dateLocale)}</TableCell>
                          <TableCell className="text-xs">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString(dateLocale) : "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <GrantCreditsDialog user={u} />
                              <DeleteUserButton user={u} />
                            </div>
                          </TableCell>
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
                <CardHeader className="pb-3"><CardTitle className="text-base font-heading">{t("admin.overview.byPlan")}</CardTitle></CardHeader>
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
                <CardHeader className="pb-3"><CardTitle className="text-base font-heading">{t("admin.overview.byRisk")}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex gap-3 flex-wrap">
                    {Object.entries(metrics.risk_breakdown ?? {}).map(([risk, count]) => (
                      <div key={risk} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-xs font-medium">{riskLabel(risk)}</span>
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
