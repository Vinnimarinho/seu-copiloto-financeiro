import { AlertTriangle, Sparkles, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUserCredits } from "@/hooks/usePortfolio";
import { useTrialStatus } from "@/hooks/useTrialStatus";

/**
 * Banner exibido no topo da área logada quando:
 * - trial gratuito de 10 dias expirou (free), OU
 * - usuário está sem créditos
 * Sempre oferece CTA para Pricing (assinar OU comprar créditos).
 */
export function AccessBanner() {
  const navigate = useNavigate();
  const { data: credits } = useUserCredits();
  const { data: trial } = useTrialStatus();

  if (!trial) return null;

  const trialExpired = !trial.is_paid && trial.trial_expired;
  const noCredits = (credits ?? 0) <= 0;
  const trialEndingSoon = !trial.is_paid && !trial.trial_expired && trial.days_left <= 3;

  if (!trialExpired && !noCredits && !trialEndingSoon) return null;

  // Prioridade: trial expirado > sem créditos > trial acabando
  if (trialExpired) {
    return (
      <Banner
        tone="danger"
        icon={<AlertTriangle className="w-4 h-4" />}
        title="Seu período gratuito de 10 dias acabou"
        message="Assine um plano ou compre créditos avulsos para continuar usando análises, relatórios e o LUCIUS."
        primary={{ label: "Ver planos", onClick: () => navigate("/pricing") }}
        secondary={{ label: "Comprar créditos", onClick: () => navigate("/pricing#credits") }}
      />
    );
  }

  if (noCredits) {
    return (
      <Banner
        tone="warning"
        icon={<ShoppingCart className="w-4 h-4" />}
        title="Você está sem créditos"
        message="Compre um pacote avulso para rodar novas análises ou faça upgrade para um plano com créditos mensais."
        primary={{ label: "Comprar créditos", onClick: () => navigate("/pricing#credits") }}
        secondary={{ label: "Ver planos", onClick: () => navigate("/pricing") }}
      />
    );
  }

  return (
    <Banner
      tone="info"
      icon={<Clock className="w-4 h-4" />}
      title={`Restam ${trial.days_left} dias do seu período gratuito`}
      message="Assine um plano ou garanta créditos avulsos antes que expire para não perder o acesso."
      primary={{ label: "Assinar agora", onClick: () => navigate("/pricing") }}
    />
  );
}

interface BannerProps {
  tone: "danger" | "warning" | "info";
  icon: React.ReactNode;
  title: string;
  message: string;
  primary: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}

const toneClass = {
  danger: "bg-destructive/10 border-destructive/40 text-destructive",
  warning: "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400",
  info: "bg-primary/10 border-primary/30 text-primary",
};

function Banner({ tone, icon, title, message, primary, secondary }: BannerProps) {
  return (
    <div className={`border rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${toneClass[tone]}`}>
      <div className="flex items-start gap-3 flex-1">
        <div className="mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {secondary && (
          <Button size="sm" variant="ghost" onClick={secondary.onClick}>{secondary.label}</Button>
        )}
        <Button size="sm" onClick={primary.onClick} className="gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          {primary.label}
        </Button>
      </div>
    </div>
  );
}
