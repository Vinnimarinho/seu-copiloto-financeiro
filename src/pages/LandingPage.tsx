import { Button } from "@/components/ui/button";
import { PieChart, Target, ShieldCheck, BarChart3, ArrowRight, CheckCircle2, Zap, Lock, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

const features = [
  { icon: <PieChart className="w-6 h-6" />, title: "Visão completa da carteira", desc: "Veja alocação, concentração, liquidez e exposição em um único painel claro e intuitivo." },
  { icon: <Target className="w-6 h-6" />, title: "Diagnóstico inteligente", desc: "Descubra riscos ocultos, custos elevados e oportunidades de melhoria com explicações simples." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Recomendações assistidas", desc: "Receba sugestões claras com impacto estimado. Você decide o que fazer — sempre no controle." },
  { icon: <FileText className="w-6 h-6" />, title: "Relatórios profissionais", desc: "Exporte relatórios em PDF com resumo executivo, diagnóstico e plano de ação." },
];

const benefits = [
  "Importação via CSV, XLSX, OFX e PDF",
  "Análise por perfil de investidor",
  "Alertas de concentração e risco",
  "Histórico de evolução da carteira",
  "Sem promessas de rentabilidade",
  "Seus dados são seus — sempre",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <PieChart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-semibold text-lg text-foreground">Meu Copiloto</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/signup">
              <Button variant="default" size="sm">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="gradient-hero">
        <div className="container mx-auto px-6 py-20 md:py-32">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5" />
                Análise assistida por IA
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6 text-balance">
              Seu copiloto para investir com
              <span className="text-primary"> clareza</span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto text-balance">
              Importe sua carteira, entenda seus riscos e receba recomendações claras — sem economês, sem complicação. Você sempre no controle.
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

            <motion.p variants={fadeUp} custom={4} className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" />
              Seus dados são protegidos e nunca compartilhados
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para analisar sua carteira
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas profissionais com linguagem acessível. Nada de complicação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-card-hover transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
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
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="font-heading text-3xl font-bold text-foreground mb-6">
                Investir não precisa ser complicado
              </h2>
              <p className="text-muted-foreground mb-8">
                O Meu Copiloto analisa sua carteira e traduz informações complexas em linguagem simples. Sem jargão, sem pressão, sem execução automática.
              </p>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-elevated p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Patrimônio total</span>
                  <span className="text-xs text-success font-medium">+2,3% mês</span>
                </div>
                <p className="font-heading text-3xl font-bold text-foreground">R$ 287.450</p>
                <div className="space-y-2">
                  {[
                    { label: "Renda Fixa", pct: 45, color: "bg-primary" },
                    { label: "Ações BR", pct: 25, color: "bg-success" },
                    { label: "FIIs", pct: 12, color: "bg-warning" },
                    { label: "Outros", pct: 18, color: "bg-muted" },
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

      {/* CTA */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
            Comece sua análise agora
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Importe sua carteira em minutos e descubra como melhorar seus investimentos.
          </p>
          <Link to="/signup">
            <Button variant="hero" size="xl">
              Criar conta grátis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground mt-6">
            Análise assistida — não é recomendação de investimento nem execução automática de ordens.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
                <PieChart className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-heading font-semibold text-sm text-foreground">Meu Copiloto</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link>
              <span>© 2026 Meu Copiloto. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
