import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useNoIndex } from "@/hooks/useNoIndex";
import { useTranslation } from "react-i18next";

interface StepDef {
  id: string;
  multi?: boolean;
  options: { value: string; emoji: string }[];
}

// Apenas estrutura: textos vêm do i18n via t("onboarding.steps.<id>.options.<value>...")
const stepDefs: StepDef[] = [
  {
    id: "objectives",
    multi: true,
    options: [
      { value: "aposentadoria", emoji: "🏖️" },
      { value: "reserva", emoji: "🛟" },
      { value: "crescimento", emoji: "📈" },
      { value: "renda_passiva", emoji: "💰" },
    ],
  },
  {
    id: "investment_horizon",
    options: [
      { value: "curto", emoji: "⏰" },
      { value: "medio", emoji: "📅" },
      { value: "longo", emoji: "🎯" },
    ],
  },
  {
    id: "liquidity_need",
    options: [
      { value: "alta", emoji: "🏃" },
      { value: "media", emoji: "🚶" },
      { value: "baixa", emoji: "🧘" },
    ],
  },
  {
    id: "risk_tolerance",
    options: [
      { value: "conservador", emoji: "😰" },
      { value: "moderado", emoji: "🤔" },
      { value: "arrojado", emoji: "😎" },
    ],
  },
  {
    id: "monthly_income_range",
    options: [
      { value: "ate_3k", emoji: "💵" },
      { value: "3k_10k", emoji: "💵" },
      { value: "10k_30k", emoji: "💵" },
      { value: "acima_30k", emoji: "💵" },
    ],
  },
  {
    id: "approximate_patrimony",
    options: [
      { value: "ate_10k", emoji: "🌱" },
      { value: "10k_100k", emoji: "🌿" },
      { value: "100k_500k", emoji: "🌳" },
      { value: "acima_500k", emoji: "🏔️" },
    ],
  },
  {
    id: "experience_years",
    options: [
      { value: "0", emoji: "🐣" },
      { value: "1", emoji: "🐥" },
      { value: "3", emoji: "🦅" },
      { value: "7", emoji: "🦉" },
    ],
  },
  {
    id: "preference",
    options: [
      { value: "renda", emoji: "🏦" },
      { value: "crescimento", emoji: "🚀" },
      { value: "protecao", emoji: "🛡️" },
      { value: "simplicidade", emoji: "✨" },
    ],
  },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);
  useNoIndex();

  const step = stepDefs[currentStep];
  const isLast = currentStep === stepDefs.length - 1;
  const progress = ((currentStep + 1) / stepDefs.length) * 100;

  const currentAnswer = answers[step.id];
  const hasAnswer = step.multi
    ? Array.isArray(currentAnswer) && currentAnswer.length > 0
    : !!currentAnswer;

  const selectOption = (value: string) => {
    if (step.multi) {
      const current = (answers[step.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [step.id]: updated });
    } else {
      setAnswers({ ...answers, [step.id]: value });
    }
  };

  const isSelected = (value: string) => {
    if (step.multi) {
      return ((answers[step.id] as string[]) || []).includes(value);
    }
    return answers[step.id] === value;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("investor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const profileData = {
        objectives: answers.objectives as string[],
        investment_horizon: answers.investment_horizon as string,
        liquidity_need: answers.liquidity_need as string,
        risk_tolerance: answers.risk_tolerance as "conservador" | "moderado" | "arrojado",
        monthly_income_range: answers.monthly_income_range as string,
        approximate_patrimony: answers.approximate_patrimony as string,
        experience_years: parseInt(answers.experience_years as string, 10),
        preference: answers.preference as string,
      };

      if (existing) {
        const { error } = await supabase
          .from("investor_profiles")
          .update(profileData)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("investor_profiles")
          .insert({ ...profileData, user_id: user.id });
        if (error) throw error;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("profiles")
          .insert({ user_id: user.id, onboarding_completed: true });
      }

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["investor_profile"] });

      const riskKey = (answers.risk_tolerance as string) || "moderado";
      const category = t(`onboarding.categories.${riskKey}`);
      toast.success(t("onboarding.savedToast", { category }));
      navigate("/dashboard");
    } catch (e) {
      toast.error(t("onboarding.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col">
      <header className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        <Logo variant="light" size="sm" />
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          {t("onboarding.skip")}
        </button>
      </header>

      <div className="w-full h-1 bg-sidebar-border">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-xs text-sidebar-foreground/40 mb-2 font-medium">
                {t("onboarding.stepCounter", { current: currentStep + 1, total: stepDefs.length })}
              </p>

              <h2 className="font-heading text-2xl font-bold text-sidebar-foreground mb-2">
                {t(`onboarding.steps.${step.id}.question`)}
              </h2>
              <p className="text-sm text-sidebar-foreground/50 mb-8">
                {t(`onboarding.steps.${step.id}.subtitle`)}
              </p>

              <div className="space-y-3">
                {step.options.map((option) => {
                  const label = t(`onboarding.steps.${step.id}.options.${option.value}.label`);
                  const desc = t(`onboarding.steps.${step.id}.options.${option.value}.desc`);
                  return (
                    <button
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      className={cn(
                        "w-full text-left rounded-xl border p-4 transition-all duration-200 group",
                        isSelected(option.value)
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                          : "border-sidebar-border bg-sidebar-accent/30 hover:border-sidebar-foreground/20 hover:bg-sidebar-accent/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium text-sm",
                            isSelected(option.value) ? "text-primary" : "text-sidebar-foreground"
                          )}>
                            {label}
                          </p>
                          {desc && (
                            <p className="text-xs text-sidebar-foreground/50 mt-0.5">{desc}</p>
                          )}
                        </div>
                        {isSelected(option.value) && (
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> {t("onboarding.back")}
            </Button>

            {isLast ? (
              <Button variant="hero" onClick={handleFinish} disabled={!hasAnswer || saving}>
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {t("onboarding.saving")}</>
                ) : (
                  <>{t("onboarding.finish")} <Check className="w-4 h-4" /></>
                )}
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!hasAnswer}
              >
                {t("onboarding.next")} <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
