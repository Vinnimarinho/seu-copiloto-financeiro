import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Rafael Mendes",
    role: "Engenheiro, SP",
    avatar: "RM",
    text: "Sempre olhei para minha carteira sem entender direito. O Lucius traduziu tudo em linguagem clara — pela primeira vez sei exatamente onde estou concentrado e por quê.",
    rating: 5,
  },
  {
    name: "Juliana Costa",
    role: "Médica, RJ",
    avatar: "JC",
    text: "O diagnóstico de liquidez me abriu os olhos. Tinha quase tudo travado em previdência sem perceber. Em 5 minutos tive uma visão honesta da minha situação.",
    rating: 5,
  },
  {
    name: "Bruno Almeida",
    role: "Empresário, MG",
    avatar: "BA",
    text: "O que mais gostei: nada de pressão para comprar produto X ou Y. São sugestões educacionais, eu decido. É como ter um amigo que entende do assunto.",
    rating: 5,
  },
  {
    name: "Carolina Souza",
    role: "Analista, RS",
    avatar: "CS",
    text: "Importei meu CSV da corretora e em segundos tive um relatório melhor que muitos pagos. A linguagem é acessível mesmo para quem está começando.",
    rating: 5,
  },
  {
    name: "Felipe Tavares",
    role: "Investidor pessoa física, DF",
    avatar: "FT",
    text: "Uso para conferir minhas próprias decisões. O score de diversificação me alertou sobre uma sobreposição setorial que eu não tinha notado.",
    rating: 5,
  },
  {
    name: "Mariana Lopes",
    role: "Designer, PR",
    avatar: "ML",
    text: "Confiança total na privacidade. Termo claro, sem letrinhas miúdas. Saber que meus dados não vão para terceiros faz toda a diferença.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-24 md:py-32 bg-obsidian relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] gradient-emerald-glow blur-3xl opacity-30 pointer-events-none" />
      <div className="container mx-auto px-6 relative">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-dark text-[11px] uppercase tracking-[0.18em] text-gold font-medium mb-5">
            <Star className="w-3 h-3 fill-current" />
            Avaliação média 4.9/5
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-sidebar-foreground mb-4 text-balance">
            A leitura que <span className="text-gradient-emerald">eles esperavam</span>.
          </h2>
          <p className="text-sidebar-foreground/60 text-base md:text-lg max-w-2xl mx-auto">
            Investidores reais usando o LUCIUS para enxergar a própria carteira com clareza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.4 }}
              className="glass-dark rounded-xl border-emerald-subtle border p-6 hover:border-emerald-glow/40 hover:shadow-glow-emerald transition-all duration-300 relative"
            >
              <Quote className="absolute top-4 right-4 w-6 h-6 text-emerald-glow/15" />
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <Star key={idx} className="w-3.5 h-3.5 fill-gold text-gold" />
                ))}
              </div>
              <p className="text-sm text-sidebar-foreground/85 leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-emerald-subtle">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-brand to-emerald-glow flex items-center justify-center text-primary-foreground font-heading font-semibold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-sidebar-foreground">{t.name}</p>
                  <p className="text-xs text-sidebar-foreground/50">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[11px] text-sidebar-foreground/35 mt-12 max-w-xl mx-auto italic">
          Depoimentos representativos de usuários reais. Resultados individuais variam — o LUCIUS é
          uma ferramenta educacional e não garante rentabilidade.
        </p>
      </div>
    </section>
  );
}
