import { motion } from "framer-motion";
import { TrendingUp, Shield, Droplets, Sparkles } from "lucide-react";

/** Premium dark mockup of the Lucius product preview */
export function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative max-w-5xl mx-auto"
    >
      {/* Glow halo */}
      <div className="absolute -inset-x-12 -inset-y-8 gradient-emerald-glow blur-3xl opacity-60 animate-pulse-glow pointer-events-none" />

      <div className="relative glass-dark rounded-2xl shadow-premium overflow-hidden ring-gold-subtle">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-emerald-subtle bg-obsidian/60">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sidebar-foreground/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-sidebar-foreground/15" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-glow/40" />
          </div>
          <div className="flex-1 text-center text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/40 font-medium">
            lucius · diagnóstico da carteira
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left: hero stat */}
          <div className="md:col-span-5 space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/45 font-medium">
                  Patrimônio em leitura
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-glow font-medium">
                  <TrendingUp className="w-3 h-3" /> +2,3%
                </span>
              </div>
              <p className="font-heading text-4xl md:text-5xl font-bold text-sidebar-foreground tracking-tight">
                R$ 287.450
              </p>
              <p className="text-xs text-sidebar-foreground/50 mt-1">Atualizado · há 2 min</p>
            </div>

            <div className="space-y-2.5">
              {[
                { label: "Renda Fixa", pct: 45, color: "from-emerald-brand to-emerald-glow" },
                { label: "Ações BR", pct: 25, color: "from-emerald-light to-emerald-brand" },
                { label: "FIIs", pct: 12, color: "from-gold to-gold-soft" },
                { label: "Caixa & Liquidez", pct: 18, color: "from-silver to-sidebar-foreground/40" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-sidebar-foreground/70">{item.label}</span>
                    <span className="text-sidebar-foreground font-medium">{item.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-sidebar-accent/60 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: scores */}
          <div className="md:col-span-7 grid grid-cols-3 gap-3">
            {[
              { icon: Shield, label: "Risco", value: "Moderado", score: 72, hue: "emerald" as const },
              { icon: Droplets, label: "Liquidez", value: "Saudável", score: 84, hue: "emerald" as const },
              { icon: Sparkles, label: "Diversificação", value: "Atenção", score: 58, hue: "gold" as const },
            ].map((card, i) => (
              <div
                key={card.label}
                className="rounded-xl bg-sidebar-accent/30 border border-emerald-subtle p-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-sidebar-foreground/50">
                  <card.icon className={card.hue === "gold" ? "w-3 h-3 text-gold" : "w-3 h-3 text-emerald-glow"} />
                  {card.label}
                </div>
                <div className="font-heading font-bold text-base text-sidebar-foreground">{card.value}</div>
                <div className="mt-auto">
                  <div className="flex items-baseline justify-between">
                    <span className={card.hue === "gold" ? "text-lg font-bold text-gold" : "text-lg font-bold text-emerald-glow"}>
                      {card.score}
                    </span>
                    <span className="text-[9px] text-sidebar-foreground/40">/100</span>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-span-3 rounded-xl bg-gradient-to-br from-emerald-brand/10 to-emerald-glow/5 border border-emerald-subtle p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-glow animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-glow/80 font-medium">
                  Leitura LUCIUS
                </span>
              </div>
              <p className="text-sm text-sidebar-foreground/85 leading-relaxed">
                Concentração relevante em Renda Fixa (45%). Sua carteira está com{" "}
                <span className="text-sidebar-foreground font-medium">liquidez saudável</span>, mas a
                diversificação setorial em ações merece um olhar atento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
