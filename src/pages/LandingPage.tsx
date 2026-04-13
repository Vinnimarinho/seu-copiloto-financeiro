import { Button } from "@/components/ui/button";
import { Target, ShieldCheck, ArrowRight, CheckCircle2, Zap, Lock, FileText, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
};

const features = [
  { icon: <Target className="w-6 h-6" />, title: "Visão completa da carteira", desc: "Alocação, concentração, liquidez e exposição em um único painel claro e intuitivo." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Diagnóstico inteligente", desc: "Riscos ocultos, custos elevados e oportunidades de melhoria com explicações simples." },
  { icon: <Zap className="w-6 h-6" />, title: "Recomendações assistidas", desc: "Sugestões claras com impacto estimado. Você decide — sempre no controle." },
  { icon: <FileText className="w-6 h-6" />, title: "Relatórios profissionais", desc: "Resumo executivo, diagnóstico e plano de ação exportáveis em PDF." },
];

const benefits = [
  "Importação via CSV, XLSX, OFX e PDF",
  "Análise por perfil de investidor",
  "Alertas de concentração e risco",
  "Histórico de evolução da carteira",
  "Sem promessas de rentabilidade",
  "Seus dados são seus — sempre",
];

const pricingPlans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    desc: "Para conhecer a plataforma",
    features: ["1 carteira", "Diagnóstico básico", "3 créditos de análise/mês", "Sem relatórios PDF"],
    cta: "Começar grátis",
    href: "/signup",
  },
  {
    name: "Essencial",
    price: "R$ 39",
    period: "/mês",
    desc: "Para investidores ativos",
    features: ["3 carteiras", "Diagnóstico completo", "20 créditos de análise/mês", "Relatórios PDF", "Recomendações assistidas", "Histórico 12 meses"],
    cta: "Assinar Essencial",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Pro",
    price: "R$ 89",
    period: "/mês",
    desc: "Para quem leva a sério",
    features: ["Carteiras ilimitadas", "Diagnóstico avançado", "100 créditos de análise/mês", "Relatórios completos", "Recomendações prioritárias", "Histórico completo", "Suporte prioritário"],
    cta: "Assinar Pro",
    href: "/signup",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-sidebar-border bg-sidebar sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Logo variant="light" />
          <div className="flex items-center gap-3">
            <a href="#pricing">
              <Button variant="ghost" size="sm" className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">Preços</Button>
            </a>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5C20 5 15 12 15 20c0 8 5 12 10 14s10 4 10 12c0 8-5 14-15 14' stroke='%2322c55e' fill='none' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px",
        }} />
        <div className="container mx-auto px-6 py-24 md:py-36 relative">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sidebar-primary/30 bg-sidebar-primary/10 text-sidebar-primary text-sm font-medium mb-8">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M8 2C5.5 2 4 3.5 4 5.5S5.5 8 7 8.5s3 1 3 3S8.5 14 6 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Análise assistida por IA
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-4xl md:text-6xl font-bold leading-tight mb-6 text-balance text-sidebar-foreground">
              Lucidez e controle sobre seus
              <span className="text-sidebar-primary"> investimentos</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-sidebar-foreground/60 mb-10 max-w-2xl mx-auto text-balance">
              Importe sua carteira, entenda seus riscos e receba recomendações claras — sem economês. Você sempre no comando.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Começar análise grátis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="hero-outline" size="xl">
                  Já tenho conta
                </Button>
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} custom={4} className="text-xs text-sidebar-foreground/40 mt-6 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Seus dados são protegidos e nunca compartilhados
            </motion.p>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-background" />
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              O poder de uma análise profissional
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas sofisticadas com linguagem acessível. Precisão sem complicação.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  {f.icon}
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="font-heading text-3xl font-bold text-foreground mb-6">
                Investir com clareza, não com medo
              </h2>
              <p className="text-muted-foreground mb-8">
                O Lucius analisa sua carteira e traduz informações complexas em linguagem simples. Sem jargão, sem pressão, sem execução automática.
              </p>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl border border-border shadow-elevated p-6 space-y-4 bg-card relative overflow-hidden">
                <div className="absolute top-3 right-3 opacity-5">
                  <svg viewBox="0 0 40 40" fill="none" className="w-16 h-16">
                    <path d="M20 4C13 4 9 9 9 14c0 5 4 8 8 9.5s8 3 8 8.5c0 5.5-4 10-12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Patrimônio total</span>
                  <span className="text-xs text-primary font-medium">+2,3% mês</span>
                </div>
                <p className="font-heading text-3xl font-bold text-foreground">R$ 287.450</p>
                <div className="space-y-2">
                  {[
                    { label: "Renda Fixa", pct: 45, color: "bg-primary" },
                    { label: "Ações BR", pct: 25, color: "bg-emerald-light" },
                    { label: "FIIs", pct: 12, color: "bg-accent" },
                    { label: "Outros", pct: 18, color: "bg-silver" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                      <span className="text-xs font-medium text-foreground">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-background scroll-mt-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos e Preços
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Escolha o plano ideal para suas necessidades
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={cn(
                  "bg-card border rounded-xl p-6 shadow-card flex flex-col",
                  plan.highlight ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-3">
                    <Zap className="w-3 h-3" /> Mais popular
                  </span>
                )}
                <h3 className="font-heading font-semibold text-lg text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="font-heading text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={plan.href}>
                  <Button variant={plan.highlight ? "hero" : "default"} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-sidebar relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-sidebar-foreground mb-4">
            Assuma o controle da sua carteira
          </h2>
          <p className="text-sidebar-foreground/60 text-lg mb-8 max-w-xl mx-auto">
            Importe em minutos e descubra como melhorar seus investimentos.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="xl">
              Criar conta grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-xs text-sidebar-foreground/40 mt-6">
            Análise assistida — não é recomendação de investimento nem execução automática de ordens.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sidebar-border bg-sidebar py-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Logo size="sm" variant="light" />
            <div className="flex items-center gap-6 text-xs text-sidebar-foreground/50">
              <Link to="/terms" className="hover:text-sidebar-foreground transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-sidebar-foreground transition-colors">Privacidade</Link>
              <span>© 2026 Lucius. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
