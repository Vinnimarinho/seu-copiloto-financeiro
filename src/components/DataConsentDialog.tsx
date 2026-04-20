import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Eye, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onAccepted: () => void;
}

export function DataConsentDialog({ open, onAccepted }: Props) {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!user || !agreed) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ data_consent_accepted_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast.error("Erro ao registrar aceite. Tente novamente.");
      return;
    }
    qc.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Termo aceito. Bem-vindo ao Lucius!");
    onAccepted();
  };

  const handleDecline = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="font-heading text-2xl">Termo de Confidencialidade e Autorização de Análise</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            Para que o Lucius possa traduzir o universo dos investimentos e gerar diagnósticos educacionais sobre sua carteira, precisamos do seu consentimento explícito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <Eye className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-xs font-semibold text-foreground mb-0.5">Você autoriza o Lucius a:</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Visualizar, analisar e processar a performance e composição da sua carteira para gerar diagnósticos, identificar oportunidades educacionais e traduzir termos técnicos em linguagem acessível.</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <Lock className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-xs font-semibold text-foreground mb-0.5">O Lucius se compromete a:</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Nunca compartilhar, vender ou divulgar a terceiros seus dados sensíveis ou informações da sua carteira. Seus dados são exclusivamente seus.</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed space-y-2 max-h-48 overflow-y-auto">
            <p className="font-semibold text-foreground flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> Resumo do termo</p>
            <p><strong className="text-foreground">1. Autorização de análise:</strong> Você autoriza o Lucius a acessar, processar e analisar dados da sua carteira de investimentos (ativos, valores, alocações, performance) com a finalidade exclusiva de gerar análises educacionais, diagnósticos de risco/diversificação/liquidez e sugestões gerais de melhoria.</p>
            <p><strong className="text-foreground">2. Confidencialidade:</strong> O Lucius se compromete a não compartilhar, vender, ceder, divulgar ou expor a terceiros seus dados pessoais, financeiros ou da sua carteira. Seus dados não são utilizados para treinar modelos de IA externos.</p>
            <p><strong className="text-foreground">3. Finalidade educacional:</strong> Todas as análises e sugestões geradas têm caráter exclusivamente educacional. O Lucius não constitui consultoria, recomendação de investimento ou oferta de valores mobiliários (Res. CVM 19/2021 e 20/2021).</p>
            <p><strong className="text-foreground">4. Seus direitos (LGPD):</strong> Você pode revogar este consentimento a qualquer momento, solicitar a exclusão dos seus dados ou exportá-los pelo menu Configurações.</p>
            <p><strong className="text-foreground">5. Decisão final é sua:</strong> Toda decisão de investimento é de sua responsabilidade exclusiva. Rentabilidade passada não garante resultados futuros.</p>
          </div>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
            <span className="text-sm text-foreground leading-relaxed">
              Li, compreendi e <strong>autorizo</strong> o Lucius a analisar minha carteira de investimentos para fins educacionais, ciente de que meus dados serão tratados com confidencialidade e <strong>nunca compartilhados com terceiros</strong>.
            </span>
          </label>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleDecline} disabled={loading}>
            Recusar e sair
          </Button>
          <Button variant="hero" onClick={handleAccept} disabled={!agreed || loading}>
            {loading ? "Registrando..." : "Aceito e autorizo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
