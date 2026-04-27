import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSubscription, getPlanByProductId, PLANS, type PlanKey } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowDown, ArrowUp, Crown, Loader2, ShieldCheck, XCircle, RotateCcw, Sparkles } from "lucide-react";

interface PreviewLine {
  description: string | null;
  amount: number;
  proration: boolean;
  period_start: string | null;
  period_end: string | null;
}
interface PreviewResponse {
  currency: string;
  amount_due_now: number;
  subtotal: number;
  total: number;
  next_payment_attempt: string | null;
  current_period_end: string | null;
  current_price: { id: string; unit_amount: number | null; interval: string | null };
  new_price: { id: string; unit_amount: number | null; interval: string | null; product_id: string | null };
  lines: PreviewLine[];
}

function fmtMoney(amount: number, currency: string) {
  // Stripe envia em menor unidade (centavos para BRL/USD)
  const value = amount / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

const PLAN_ORDER: Record<PlanKey, number> = { free: 0, essencial: 1, pro: 2 };
const PLAN_PRICE_LABEL: Record<PlanKey, string> = {
  free: "Grátis",
  essencial: "R$ 39,99/mês",
  pro: "R$ 89,99/mês",
};

export default function Billing() {
  const { user } = useAuth();
  const { data: sub, isLoading } = useSubscription();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PlanKey | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<PlanKey | null>(null);
  const [applying, setApplying] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);

  if (isLoading || !sub) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppSidebar>
    );
  }

  const currentPlan = getPlanByProductId(sub.product_id);
  const isPaid = currentPlan !== "free";
  const cancelScheduled = sub.cancel_at_period_end && sub.subscribed;

  const requestPreview = async (target: PlanKey) => {
    const targetPriceId = PLANS[target].price_id;
    if (!targetPriceId) return;
    setLoadingPreview(target);
    try {
      const { data, error } = await supabase.functions.invoke<PreviewResponse | { error: string }>(
        "subscription-preview",
        { body: { newPriceId: targetPriceId } },
      );
      if (error) throw error;
      if (data && "error" in data) throw new Error(data.error);
      setPreview(data as PreviewResponse);
      setPreviewTarget(target);
    } catch (e) {
      toast.error("Não consegui calcular a prévia da troca", {
        description: (e as Error).message,
      });
    } finally {
      setLoadingPreview(null);
    }
  };

  const applyChange = async () => {
    if (!previewTarget) return;
    const targetPriceId = PLANS[previewTarget].price_id;
    if (!targetPriceId) return;
    setApplying(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
        "subscription-manage",
        { body: { action: "change_plan", newPriceId: targetPriceId } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Plano atualizado", { description: "A mudança foi aplicada no Stripe." });
      setPreview(null);
      setPreviewTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    } catch (e) {
      toast.error("Não consegui aplicar a troca", { description: (e as Error).message });
    } finally {
      setApplying(false);
    }
  };

  const cancelPlan = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; access_until?: string; error?: string }>(
        "subscription-manage",
        { body: { action: "cancel_at_period_end" } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Cancelamento agendado", {
        description: data?.access_until
          ? `Você mantém acesso até ${fmtDate(data.access_until)}.`
          : "Você mantém acesso até o fim do período contratado.",
      });
      setConfirmCancel(false);
      await queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    } catch (e) {
      toast.error("Não consegui cancelar agora", { description: (e as Error).message });
    } finally {
      setCancelling(false);
    }
  };

  const resumePlan = async () => {
    setResuming(true);
    try {
      const { data, error } = await supabase.functions.invoke<{ ok?: boolean; error?: string }>(
        "subscription-manage",
        { body: { action: "resume" } },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Cancelamento desfeito", { description: "Sua assinatura continua ativa." });
      await queryClient.invalidateQueries({ queryKey: ["subscription", user?.id] });
    } catch (e) {
      toast.error("Não consegui reativar", { description: (e as Error).message });
    } finally {
      setResuming(false);
    }
  };

  return (
    <AppSidebar>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Gerenciar assinatura</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Troque, cancele ou reative sua assinatura. Nada é cobrado sem você confirmar.
          </p>
        </div>

        {/* Plano atual */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${isPaid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {isPaid ? <Crown className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Plano atual</p>
                <h2 className="font-heading text-lg font-bold text-foreground">{PLANS[currentPlan].name}</h2>
                <p className="text-xs text-muted-foreground">{PLAN_PRICE_LABEL[currentPlan]}</p>
              </div>
            </div>
            {cancelScheduled && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/30">
                Cancelando em {fmtDate(sub.subscription_end)}
              </span>
            )}
          </div>

          {isPaid && sub.subscription_end && (
            <p className="text-xs text-muted-foreground">
              {cancelScheduled
                ? `Acesso garantido até ${fmtDate(sub.subscription_end)}. Sem nova cobrança.`
                : `Próxima cobrança em ${fmtDate(sub.subscription_end)}.`}
            </p>
          )}

          {cancelScheduled ? (
            <Button onClick={resumePlan} disabled={resuming} variant="outline" size="sm">
              {resuming ? <Loader2 className="w-4 h-4 animate-spin" /> : <><RotateCcw className="w-4 h-4" /> Desfazer cancelamento</>}
            </Button>
          ) : isPaid ? (
            <Button
              onClick={() => setConfirmCancel(true)}
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            >
              <XCircle className="w-4 h-4" /> Cancelar plano
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/pricing")}>
              Ver planos pagos
            </Button>
          )}
        </div>

        {/* Trocar de plano */}
        {isPaid && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <h3 className="font-heading text-base font-bold text-foreground">Trocar de plano</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Vamos calcular a proração antes — você só confirma se concordar com os valores.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(["essencial", "pro"] as PlanKey[])
                .filter((p) => p !== currentPlan)
                .map((target) => {
                  const direction =
                    PLAN_ORDER[target] > PLAN_ORDER[currentPlan] ? "upgrade" : "downgrade";
                  return (
                    <div key={target} className="border border-border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        {direction === "upgrade" ? (
                          <ArrowUp className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowDown className="w-4 h-4 text-muted-foreground" />
                        )}
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {direction === "upgrade" ? "Upgrade" : "Downgrade"}
                        </p>
                      </div>
                      <p className="font-heading text-base font-bold text-foreground">
                        Mudar para {PLANS[target].name}
                      </p>
                      <p className="text-xs text-muted-foreground">{PLAN_PRICE_LABEL[target]}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={!!loadingPreview}
                        onClick={() => requestPreview(target)}
                      >
                        {loadingPreview === target ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Calcular impacto <ArrowRight className="w-4 h-4" /></>
                        )}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Nenhuma cobrança é feita sem sua confirmação explícita nesta tela.
            </p>
          </div>
        )}
      </div>

      {/* Modal de preview de troca */}
      <AlertDialog
        open={!!preview && !!previewTarget}
        onOpenChange={(open) => {
          if (!open && !applying) {
            setPreview(null);
            setPreviewTarget(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmar mudança para {previewTarget ? PLANS[previewTarget].name : ""}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Antes de aplicar, veja exatamente o que vai acontecer. Nada é cobrado até você
                  clicar em <strong>confirmar</strong>.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          {preview && (
            <div className="space-y-3 text-sm">
              <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cobrado agora (com proração)</span>
                  <span className={`font-semibold ${preview.amount_due_now < 0 ? "text-primary" : "text-foreground"}`}>
                    {fmtMoney(preview.amount_due_now, preview.currency)}
                  </span>
                </div>
                {preview.amount_due_now < 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    Valor negativo = crédito a seu favor, abatido em cobranças futuras.
                  </p>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Próxima cobrança</span>
                  <span className="text-foreground">
                    {fmtDate(preview.next_payment_attempt ?? preview.current_period_end)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Novo valor recorrente</span>
                  <span className="text-foreground">
                    {preview.new_price.unit_amount != null
                      ? `${fmtMoney(preview.new_price.unit_amount, preview.currency)}/${preview.new_price.interval ?? "mês"}`
                      : "—"}
                  </span>
                </div>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Ver linhas detalhadas ({preview.lines.length})
                </summary>
                <div className="mt-2 space-y-1.5 max-h-40 overflow-auto pr-1">
                  {preview.lines.map((l, i) => (
                    <div key={i} className="flex justify-between gap-2 border-b border-border/50 pb-1">
                      <span className="text-muted-foreground truncate">
                        {l.description || (l.proration ? "Ajuste de proração" : "Linha")}
                      </span>
                      <span className={l.amount < 0 ? "text-primary" : "text-foreground"}>
                        {fmtMoney(l.amount, preview.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>

              <p className="text-[11px] text-muted-foreground">
                Cálculo gerado pelo Stripe em tempo real. Pode variar em poucos centavos se você
                demorar para confirmar.
              </p>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={applying}>Não confirmar</AlertDialogCancel>
            <AlertDialogAction onClick={applyChange} disabled={applying}>
              {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar mudança"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmação de cancelamento */}
      <AlertDialog open={confirmCancel} onOpenChange={(o) => !cancelling && setConfirmCancel(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar plano {PLANS[currentPlan].name}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  O cancelamento é agendado para o fim do período já pago. Você continua usando
                  todos os recursos até <strong>{fmtDate(sub.subscription_end)}</strong>.
                </p>
                <p>Não haverá nova cobrança. Você pode desfazer o cancelamento a qualquer momento.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Manter assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelPlan}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancelar plano"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppSidebar>
  );
}
