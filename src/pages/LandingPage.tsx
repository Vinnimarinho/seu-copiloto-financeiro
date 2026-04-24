import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Eye,
  Compass,
  Sparkles,
  ShieldCheck,
  Layers,
  TrendingUp,
  FileText,
  MessagesSquare,
  Activity,
  Check,
  Zap,
  ShieldAlert,
  Crown,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { HeroMockup } from "@/components/landing/HeroMockup";
import { FAQ } from "@/components/landing/FAQ";
import { Testimonials } from "@/components/Testimonials";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

/* ---------------------------------------------------------------- */
/* Section: Por que                                                  */
/* ---------------------------------------------------------------- */
const painPoints = [
  "Você não sabe ao certo o que tem na carteira",
  "Você recebe ruído demais e clareza de menos",
  "Você toma decisão sem ler o todo",
  "Você ouve economês onde precisava de leitura simples",
];

const lucidityPoints = [
  { icon: Eye, label: "Leitura clara", desc: "Tradução direta da carteira em linguagem humana." },
  { icon: Compass, label: "Diagnóstico isento", desc: "Risco, liquidez, concentração, diversificação." },
  { icon: Sparkles, label: "Inteligência aplicada", desc: "IA de última geração focada em educação financeira." },
  { icon: ShieldCheck, label: "Apoio à decisão", desc: "Sugestões educacionais. Quem decide é você." },
];

/* ---------------------------------------------------------------- */
/* Section: Como funciona                                            */
/* ---------------------------------------------------------------- */
const steps = [
  {
    n: "01",
    title: "Crie sua conta",
    desc: "Onboarding rápido. Sem fricção, sem cartão de crédito.",
  },
  {
    n: "02",
    title: "Importe sua carteira",
    desc: "CSV, XLSX, OFX ou PDF — os formatos que sua corretora já fornece.",
  },
  {
    n: "03",
    title: "Receba o diagnóstico",
    desc: "Risco, liquidez, concentração e leitura LUCIUS em segundos.",
  },
  {
    n: "04",
    title: "Aja com clareza",
    desc: "Oportunidades, simulações de cenário e relatórios para apoiar decisões.",
  },
];

/* ---------------------------------------------------------------- */
/* Section: Benefícios                                               */
/* ---------------------------------------------------------------- */
const benefits = [
  {
    icon: Activity,
    title: "Leitura da performance",
    desc: "Veja o que sua carteira está dizendo — sem precisar ser analista para entender.",
  },
  {
    icon: Layers,
    title: "Risco, liquidez e concentração",
    desc: "Três leituras essenciais que a maioria dos investidores nunca vê com clareza.",
  },
  {
    icon: TrendingUp,
    title: "Oportunidades estratégicas",
    desc: "Identificação de pontos de melhoria — sem indicar ativo específico.",
  },
  {
    icon: FileText,
    title: "Relatórios sob demanda",
    desc: "PDFs elegantes para registrar decisões, comparar períodos e organizar a leitura.",
  },
  {
    icon: MessagesSquare,
    title: "Converse com o LUCIUS",
    desc: "Tire dúvidas em linguagem clara, com contexto da sua própria carteira.",
  },
  {
    icon: Sparkles,
    title: "Simulações e projeções",
    desc: "Teste cenários táticos antes de agir — leitura comparativa, não promessa.",
  },
];

/* ---------------------------------------------------------------- */
/* Section: Para quem                                                */
/* ---------------------------------------------------------------- */
const audience = [
  "Investidor que quer entender o que está fazendo",
  "Investidor cansado de economês e ruído de mercado",
  "Investidor que busca autonomia com clareza",
  "Investidor que quer organizar e registrar decisões",
];

/* ---------------------------------------------------------------- */
/* Section: Planos                                                   */
/* ---------------------------------------------------------------- */
const pricingPlans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "",
    desc: "Para conhecer a leitura LUCIUS",
    features: ["1 carteira", "1 crédito de análise", "Diagnóstico básico", "Sem download de relatórios"],
    cta: "Experimentar grátis",
    href: "/signup",
    note: "Sem compromisso — teste agora",
  },
  {
    name: "Essencial",
    price: "R$ 39,99",
    period: "/mês",
    desc: "Para o investidor ativo",
    features: [
      "3 carteiras",
      "Diagnóstico completo",
      "20 créditos de análise/mês",
      "Relatórios em PDF",
      "Oportunidades de melhoria",
      "Calculadora de aposentadoria passiva",
      "Histórico de 12 meses",
    ],
    cta: "Assinar Essencial",
    href: "/signup",
    highlight: true,
    note: "Cobrado anualmente · 12x de R$ 39,99",
  },
  {
    name: "Pro",
    price: "R$ 89",
    period: "/mês",
    desc: "Para quem leva a carteira a sério",
    features: [
      "Carteiras ilimitadas",
      "Diagnóstico avançado",
      "100 créditos de análise/mês",
      "Relatórios completos",
      "Oportunidades de melhoria",
      "Calculadora de aposentadoria passiva",
      "Simulações de cenário",
      "Histórico completo",
      "Suporte prioritário",
    ],
    cta: "Assinar Pro",
    href: "/signup",
    note: "Cobrado anualmente · 12x de R$ 89",
  },
];

/* ================================================================ */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-obsidian text-sidebar-foreground">
      <LandingHeader />

      {/* ============================================================ */}
      {/* HERO                                                          */}
      {/* ============================================================ */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-28 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 gradient-dark" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] gradient-emerald-glow blur-3xl opacity-50 pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 8C28 8 22 16 22 24c0 8 6 12 12 14s12 6 12 14c0 8-6 14-18 14' stroke='%2334d399' fill='none' stroke-width='0.8' opacity='0.6'/%3E%3C/svg%3E")`,
            backgroundSize: "80px 80px",
          }}
        />

        <div className="container mx-auto px-6 relative">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark text-[11px] uppercase tracking-[0.18em] text-emerald-glow font-medium mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow animate-pulse" />
                Lucidez assistida por IA de última geração
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="font-heading text-5xl md:text-7xl font-bold leading-[1.05] mb-6 text-balance text-sidebar-foreground"
            >
              Lucidez sobre a performance da{" "}
              <span className="text-gradient-emerald">sua carteira</span>.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg md:text-xl text-sidebar-foreground/65 mb-10 max-w-2xl mx-auto leading-relaxed text-balance"
            >
              O LUCIUS traduz a linguagem técnica do mercado em leitura clara, isenta e
              acionável — para você decidir com inteligência, no seu tempo, sob seu controle.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link to="/signup">
                <Button variant="hero" size="xl" className="shadow-glow-emerald group">
                  Começar análise grátis
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a href="#how">
                <Button
                  variant="ghost"
                  size="xl"
                  className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                >
                  Ver como funciona
                </Button>
              </a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-sidebar-foreground/40"
            >
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                Dados criptografados e privados
              </span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-sidebar-foreground/20" />
              <span>Sem cartão de crédito</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-sidebar-foreground/20" />
              <span>Cancele quando quiser</span>
            </motion.div>
          </motion.div>

          {/* Mockup */}
          <div className="mt-16 md:mt-20">
            <HeroMockup />
          </div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-20 max-w-4xl mx-auto"
          >
            <p className="text-center text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/35 mb-6">
              Construído com princípios de
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sidebar-foreground/55 text-sm">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-glow" />Privacidade por padrão</span>
              <span className="inline-flex items-center gap-2"><Eye className="w-4 h-4 text-emerald-glow" />Leitura isenta</span>
              <span className="inline-flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-glow" />Inteligência aplicada</span>
              <span className="inline-flex items-center gap-2"><Crown className="w-4 h-4 text-gold" />Apoio premium</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* POR QUE                                                       */}
      {/* ============================================================ */}
      <section id="why" className="py-24 md:py-32 relative scroll-mt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-sidebar to-obsidian" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-emerald-glow/80 font-medium mb-4">
              Por que LUCIUS
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-sidebar-foreground mb-5 text-balance">
              Você não precisa de mais ruído.
              <br />
              Precisa de <span className="text-gradient-emerald">clareza</span>.
            </h2>
            <p className="text-sidebar-foreground/60 text-base md:text-lg leading-relaxed">
              A maioria dos investidores acumula informação sem entender o que ela significa.
              O LUCIUS existe para inverter essa equação.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Pain */}
            <div className="glass-dark rounded-2xl p-8 border-emerald-subtle border">
              <div className="flex items-center gap-2 mb-6">
                <ShieldAlert className="w-5 h-5 text-sidebar-foreground/40" />
                <span className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/50 font-medium">
                  Hoje, sem o LUCIUS
                </span>
              </div>
              <ul className="space-y-4">
                {painPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-3 text-sidebar-foreground/70 text-sm leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-sidebar-foreground/30 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            {/* Antidote */}
            <div className="rounded-2xl p-8 bg-gradient-to-br from-emerald-brand/15 via-sidebar to-obsidian border border-emerald-glow/30 shadow-glow-emerald relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 gradient-emerald-glow blur-2xl opacity-50 pointer-events-none" />
              <div className="flex items-center gap-2 mb-6 relative">
                <Sparkles className="w-5 h-5 text-emerald-glow" />
                <span className="text-xs uppercase tracking-[0.18em] text-emerald-glow font-medium">
                  Com o LUCIUS
                </span>
              </div>
              <ul className="space-y-5 relative">
                {lucidityPoints.map((p) => (
                  <li key={p.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-brand/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <p.icon className="w-4 h-4 text-emerald-glow" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sidebar-foreground text-sm">{p.label}</p>
                      <p className="text-sidebar-foreground/60 text-xs leading-relaxed mt-0.5">{p.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* COMO FUNCIONA                                                 */}
      {/* ============================================================ */}
      <section id="how" className="py-24 md:py-32 relative bg-obsidian scroll-mt-20">
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-emerald-glow/80 font-medium mb-4">
              Como funciona
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-sidebar-foreground mb-5 text-balance">
              Quatro passos. Uma <span className="text-gradient-emerald">leitura completa</span>.
            </h2>
            <p className="text-sidebar-foreground/60 text-base md:text-lg">
              Sem complicação técnica. Sem economês. Em minutos você está vendo a sua carteira como nunca viu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative group"
              >
                <div className="glass-dark rounded-xl p-6 h-full border-emerald-subtle border hover:border-emerald-glow/40 transition-all duration-300">
                  <div className="font-heading text-4xl font-bold text-gradient-emerald mb-4">
                    {step.n}
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-sidebar-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-sidebar-foreground/60 leading-relaxed">{step.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-emerald-glow/20" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* BENEFÍCIOS                                                    */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian via-sidebar to-obsidian" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-emerald-glow/80 font-medium mb-4">
              O que você ganha
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-sidebar-foreground mb-5 text-balance">
              Inteligência aplicada à <span className="text-gradient-emerald">sua decisão</span>.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
                className="glass-dark rounded-xl p-6 border-emerald-subtle border hover:border-emerald-glow/40 hover:shadow-glow-emerald transition-all duration-300 group"
              >
                <div className="w-11 h-11 rounded-lg bg-emerald-brand/15 flex items-center justify-center text-emerald-glow mb-5 group-hover:bg-emerald-brand/25 transition-all">
                  <b.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-semibold text-lg text-sidebar-foreground mb-2">
                  {b.title}
                </h3>
                <p className="text-sm text-sidebar-foreground/60 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* TESTIMONIALS                                                  */}
      {/* ============================================================ */}
      <Testimonials />

      {/* ============================================================ */}
      {/* PARA QUEM                                                     */}
      {/* ============================================================ */}
      <section className="py-24 md:py-32 relative bg-obsidian">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] gradient-emerald-glow blur-3xl opacity-40 pointer-events-none" />
        <div className="container mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-emerald-glow/80 font-medium mb-4">
              Para quem é o LUCIUS
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-sidebar-foreground mb-10 text-balance">
              Para quem quer <span className="text-gradient-emerald">decidir com lucidez</span>.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {audience.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -16 : 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5 }}
                  className="glass-dark rounded-xl p-5 border-emerald-subtle border flex items-start gap-3 text-left"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-glow flex-shrink-0 mt-0.5" />
                  <span className="text-sidebar-foreground/85 text-sm leading-relaxed">{a}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRICING                                                       */}
      {/* ============================================================ */}
      <section
        id="pricing"
        className="py-24 md:py-32 relative scroll-mt-20 bg-gradient-to-b from-obsidian via-sidebar to-obsidian"
      >
        <div className="container mx-auto px-6 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-emerald-glow/80 font-medium mb-4">
              Planos
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-sidebar-foreground mb-5 text-balance">
              Comece grátis. <span className="text-gradient-emerald">Evolua quando quiser</span>.
            </h2>
            <p className="text-sidebar-foreground/60 text-base md:text-lg">
              Transparência total. Sem letras miúdas, sem fidelidade obrigatória.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={cn(
                  "rounded-2xl p-7 flex flex-col relative",
                  plan.highlight
                    ? "bg-gradient-to-br from-emerald-brand/20 via-sidebar to-obsidian border border-emerald-glow/40 shadow-glow-emerald"
                    : "glass-dark border-emerald-subtle border",
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold text-obsidian text-[10px] uppercase tracking-[0.16em] font-bold shadow-glow-gold">
                      <Crown className="w-3 h-3" /> Mais escolhido
                    </span>
                  </div>
                )}
                <h3 className="font-heading font-semibold text-lg text-sidebar-foreground">
                  {plan.name}
                </h3>
                <p className="text-xs text-sidebar-foreground/55 mb-5">{plan.desc}</p>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="font-heading text-4xl font-bold text-sidebar-foreground">
                    {plan.price}
                  </span>
                  <span className="text-sm text-sidebar-foreground/50">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-sm text-sidebar-foreground/80"
                    >
                      <Check
                        className={cn(
                          "w-4 h-4 flex-shrink-0 mt-0.5",
                          plan.highlight ? "text-emerald-glow" : "text-emerald-light",
                        )}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.note && (
                  <p className="text-[11px] text-sidebar-foreground/40 mb-4 text-center">
                    {plan.note}
                  </p>
                )}
                <Link to={plan.href}>
                  <Button
                    variant={plan.highlight ? "hero" : "hero-outline"}
                    className={cn(
                      "w-full",
                      plan.highlight
                        ? "shadow-glow-emerald"
                        : "border-sidebar-foreground/20 text-sidebar-foreground hover:bg-sidebar-accent/50",
                    )}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FAQ                                                           */}
      {/* ============================================================ */}
      <FAQ />

      {/* ============================================================ */}
      {/* FINAL CTA                                                     */}
      {/* ============================================================ */}
      <section className="py-28 md:py-36 relative overflow-hidden">
        <div className="absolute inset-0 gradient-dark" />
        <div className="absolute inset-0 gradient-emerald-glow opacity-60 pointer-events-none" />
        <div className="container mx-auto px-6 relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <Crown className="w-10 h-10 text-gold mx-auto mb-6 opacity-80" />
            <h2 className="font-heading text-4xl md:text-6xl font-bold text-sidebar-foreground mb-6 text-balance leading-[1.05]">
              Assuma o controle.
              <br />
              Com <span className="text-gradient-emerald">clareza real</span>.
            </h2>
            <p className="text-sidebar-foreground/65 text-lg mb-10 max-w-xl mx-auto">
              Importe sua carteira em minutos e descubra o que ela está dizendo de verdade.
            </p>
            <Link to="/signup">
              <Button variant="hero" size="xl" className="shadow-glow-emerald group">
                Criar conta grátis
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <p className="text-[11px] text-sidebar-foreground/35 mt-10 max-w-2xl mx-auto leading-relaxed">
              O LUCIUS é um software de apoio à análise da performance da carteira e à compreensão
              do investidor. Conteúdo informativo e educacional — não constitui consultoria, oferta
              de valores mobiliários ou execução de ordens. Não somos registrados na CVM, ANBIMA ou
              APIMEC. Não indicamos fundos, ações ou ativos específicos. A decisão final é
              exclusivamente sua. Rentabilidade passada não garante resultados futuros.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER                                                        */}
      {/* ============================================================ */}
      <footer className="border-t border-emerald-subtle bg-obsidian py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Logo size="sm" variant="light" />
              <span className="hidden md:inline text-sidebar-foreground/30">·</span>
              <p className="text-[11px] text-sidebar-foreground/40 italic">
                Lucidez sobre a performance da sua carteira.
              </p>
            </div>
            <div className="flex items-center gap-6 text-xs text-sidebar-foreground/45">
              <Link to="/terms" className="hover:text-sidebar-foreground transition-colors">
                Termos
              </Link>
              <Link to="/privacy" className="hover:text-sidebar-foreground transition-colors">
                Privacidade
              </Link>
              <Link to="/compliance" className="hover:text-sidebar-foreground transition-colors">
                Compliance
              </Link>
              <span className="text-sidebar-foreground/30">© 2026 Lucius</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
