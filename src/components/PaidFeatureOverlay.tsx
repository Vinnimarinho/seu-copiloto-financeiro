import { ReactNode } from "react";
import { Lock, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Props {
  active: boolean;
  plan: "essencial" | "pro";
  title: string;
  description: string;
  children: ReactNode;
}

const PLAN_LABEL = { essencial: "Essencial", pro: "Pro" } as const;

/**
 * Bloqueia conteúdo borrado com CTA central para upgrade.
 * Usado em features pagas (Oportunidades, Relatórios, Simulações, etc).
 */
export function PaidFeatureOverlay({ active, plan, title, description, children }: Props) {
  const navigate = useNavigate();
  if (!active) return <>{children}</>;

  const Icon = plan === "pro" ? Crown : Sparkles;

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none select-none blur-[6px] opacity-60">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-background/40 backdrop-blur-sm">
        <div className="bg-card border border-primary/30 rounded-2xl p-8 max-w-md text-center space-y-4 shadow-elegant">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide bg-primary/10 text-primary rounded-full px-3 py-1">
            <Icon className="w-3 h-3" /> Plano {PLAN_LABEL[plan]}
          </span>
          <h2 className="font-heading text-xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/pricing")} className="w-full gap-2">
              <Sparkles className="w-4 h-4" /> Assinar {PLAN_LABEL[plan]}
            </Button>
            <Button variant="ghost" onClick={() => navigate("/pricing#credits")} className="w-full text-xs">
              Ou compre créditos avulsos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaidFeatureBadge({ plan }: { plan: "essencial" | "pro" }) {
  const Icon = plan === "pro" ? Crown : Sparkles;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase bg-primary/10 text-primary rounded-full px-2 py-0.5">
      <Icon className="w-2.5 h-2.5" />
      {PLAN_LABEL[plan]}
    </span>
  );
}
