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

interface StepOption {
  value: string;
  label: string;
  emoji: string;
  desc: string;
}

interface Step {
  id: string;
  question: string;
  subtitle: string;
  options: StepOption[];
  multi?: boolean;
}

const steps: Step[] = [
  {
    id: "objectives",
    question: "O que você quer conquistar com seus investimentos?",
    subtitle: "Pode escolher mais de uma opção",
    multi: true,
    options: [
      { value: "aposentadoria", label: "Aposentadoria tranquila", emoji: "🏖️", desc: "Guardar dinheiro para parar de trabalhar no futuro" },
      { value: "reserva", label: "Reserva de emergência", emoji: "🛟", desc: "Ter dinheiro guardado para imprevistos" },
      { value: "crescimento", label: "Fazer o dinheiro crescer", emoji: "📈", desc: "Aumentar o patrimônio ao longo do tempo" },
      { value: "renda_passiva", label: "Renda extra todo mês", emoji: "💰", desc: "Receber dinheiro regularmente dos investimentos" },
    ],
  },
  {
    id: "investment_horizon",
    question: "Quando você vai precisar desse dinheiro?",
    subtitle: "Pense no prazo principal dos seus investimentos",
    options: [
      { value: "curto", label: "Em menos de 2 anos", emoji: "⏰", desc: "Preciso do dinheiro em breve" },
      { value: "medio", label: "Entre 2 e 5 anos", emoji: "📅", desc: "Tenho um pouco de paciência" },
      { value: "longo", label: "Mais de 5 anos", emoji: "🎯", desc: "Posso esperar bastante tempo" },
    ],
  },
  {
    id: "liquidity_need",
    question: "Com que frequência você pode precisar resgatar?",
    subtitle: "Liquidez é a facilidade de transformar investimento em dinheiro",
    options: [
      { value: "alta", label: "A qualquer momento", emoji: "🏃", desc: "Preciso poder sacar rápido se necessário" },
      { value: "media", label: "De vez em quando", emoji: "🚶", desc: "Posso esperar alguns dias ou semanas" },
      { value: "baixa", label: "Quase nunca", emoji: "🧘", desc: "Não pretendo mexer por um bom tempo" },
    ],
  },
  {
    id: "risk_tolerance",
    question: "Se seus investimentos caíssem 20%, o que você faria?",
    subtitle: "Não tem resposta certa — é sobre como você se sente",
    options: [
      { value: "conservador", label: "Tiraria tudo na hora", emoji: "😰", desc: "Prefiro não arriscar, mesmo que ganhe menos" },
      { value: "moderado", label: "Esperaria um pouco", emoji: "🤔", desc: "Ficaria preocupado, mas tentaria esperar" },
      { value: "arrojado", label: "Compraria mais", emoji: "😎", desc: "Vejo quedas como oportunidade de comprar barato" },
    ],
  },
  {
    id: "monthly_income_range",
    question: "Qual sua renda mensal aproximada?",
    subtitle: "Isso ajuda a calibrar a análise — seus dados são sigilosos",
    options: [
      { value: "ate_3k", label: "Até R$ 3.000", emoji: "💵", desc: "" },
      { value: "3k_10k", label: "R$ 3.000 a R$ 10.000", emoji: "💵", desc: "" },
      { value: "10k_30k", label: "R$ 10.000 a R$ 30.000", emoji: "💵", desc: "" },
      { value: "acima_30k", label: "Acima de R$ 30.000", emoji: "💵", desc: "" },
    ],
  },
  {
    id: "approximate_patrimony",
    question: "Quanto você tem investido hoje (aproximadamente)?",
    subtitle: "Pode ser um chute — não precisa ser exato",
    options: [
      { value: "ate_10k", label: "Até R$ 10.000", emoji: "🌱", desc: "Estou começando" },
      { value: "10k_100k", label: "R$ 10.000 a R$ 100.000", emoji: "🌿", desc: "Já tenho algo guardado" },
      { value: "100k_500k", label: "R$ 100.000 a R$ 500.000", emoji: "🌳", desc: "Patrimônio em crescimento" },
      { value: "acima_500k", label: "Acima de R$ 500.000", emoji: "🏔️", desc: "Investidor experiente" },
    ],
  },
  {
    id: "experience_years",
    question: "Há quanto tempo você investe?",
    subtitle: "Conta qualquer tipo de investimento, incluindo poupança",
    options: [
      { value: "0", label: "Nunca investi", emoji: "🐣", desc: "Estou dando os primeiros passos" },
      { value: "1", label: "Menos de 2 anos", emoji: "🐥", desc: "Comecei há pouco tempo" },
      { value: "3", label: "2 a 5 anos", emoji: "🦅", desc: "Já tenho alguma experiência" },
      { value: "7", label: "Mais de 5 anos", emoji: "🦉", desc: "Investidor experiente" },
    ],
  },
  {
    id: "preference",
    question: "O que é mais importante pra você?",
    subtitle: "Escolha o que mais combina com seu momento",
    options: [
      { value: "renda", label: "Receber renda todo mês", emoji: "🏦", desc: "Dividendos, aluguéis, juros — quero dinheiro caindo na conta" },
      { value: "crescimento", label: "Fazer o patrimônio crescer", emoji: "🚀", desc: "Posso esperar, quero ver o valor aumentar" },
      { value: "protecao", label: "Proteger o que já tenho", emoji: "🛡️", desc: "Não quero perder — segurança em primeiro lugar" },
      { value: "simplicidade", label: "Manter simples", emoji: "✨", desc: "Não quero complicação — quanto mais fácil, melhor" },
    ],
  },
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [saving, setSaving] = useState(false);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

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
      // Try update first
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

      // Mark onboarding completed — upsert-style
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

      const category = (answers.risk_tolerance as string) === "arrojado" ? "Lorde do Risco" :
                        (answers.risk_tolerance as string) === "conservador" ? "Herdeiro de Gringotes" : "Estrategista da Sonserina";
      toast.success(`Perfil salvo! Você é um ${category} 🐍`);
      navigate("/dashboard");
    } catch (e) {
      toast.error("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        <Logo variant="light" size="sm" />
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          Pular por agora
        </button>
      </header>

      {/* Progress bar */}
      <div className="w-full h-1 bg-sidebar-border">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
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
              {/* Step counter */}
              <p className="text-xs text-sidebar-foreground/40 mb-2 font-medium">
                {currentStep + 1} de {steps.length}
              </p>

              {/* Question */}
              <h2 className="font-heading text-2xl font-bold text-sidebar-foreground mb-2">
                {step.question}
              </h2>
              <p className="text-sm text-sidebar-foreground/50 mb-8">
                {step.subtitle}
              </p>

              {/* Options */}
              <div className="space-y-3">
                {step.options.map((option) => (
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
                          isSelected(option.value)
                            ? "text-primary"
                            : "text-sidebar-foreground"
                        )}>
                          {option.label}
                        </p>
                        {option.desc && (
                          <p className="text-xs text-sidebar-foreground/50 mt-0.5">
                            {option.desc}
                          </p>
                        )}
                      </div>
                      {isSelected(option.value) && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>

            {isLast ? (
              <Button
                variant="hero"
                onClick={handleFinish}
                disabled={!hasAnswer || saving}
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                ) : (
                  <>Finalizar <Check className="w-4 h-4" /></>
                )}
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!hasAnswer}
              >
                Próxima <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
