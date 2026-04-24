import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "O LUCIUS é uma corretora ou consultoria de investimentos?",
    a: "Não. O LUCIUS é um software de apoio à análise da performance da sua carteira. Não somos registrados na CVM, ANBIMA ou APIMEC, não executamos ordens, não indicamos ativos específicos e não fazemos consultoria regulada. A decisão final é sempre exclusivamente sua.",
  },
  {
    q: "Como meus dados são protegidos?",
    a: "Seus dados são criptografados em trânsito e em repouso, armazenados em infraestrutura segura e jamais compartilhados com terceiros. Você pode exportar ou excluir tudo a qualquer momento — controle total na sua mão.",
  },
  {
    q: "Como o LUCIUS lê minha carteira?",
    a: "Você importa seus dados via CSV, XLSX, OFX ou PDF — os mesmos formatos que sua corretora já fornece. O LUCIUS interpreta, organiza e traduz tudo em uma leitura clara, sem economês.",
  },
  {
    q: "Vocês indicam ações, fundos ou ativos específicos?",
    a: "Não. Por princípio e por compliance. O LUCIUS oferece leitura, diagnóstico e oportunidades educacionais sobre a estrutura da sua carteira — nunca indicação de ativo específico. Quem decide o que comprar ou vender é você.",
  },
  {
    q: "O que diferencia o LUCIUS de uma planilha?",
    a: "Inteligência aplicada. O LUCIUS interpreta risco, liquidez, concentração, diversificação e contexto de mercado em segundos — e traduz isso em linguagem direta. Uma planilha mostra números; o LUCIUS mostra o que eles significam.",
  },
  {
    q: "Posso cancelar a qualquer momento?",
    a: "Sim. Sem multa, sem letras miúdas. Você cancela direto pelo app e continua com acesso até o fim do ciclo já pago.",
  },
  {
    q: "Funciona para investidores iniciantes?",
    a: "Sim — e foi desenhado pensando em quem quer entender de verdade. Toda leitura é traduzida para uma linguagem acessível, sem exigir conhecimento técnico prévio.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32 bg-obsidian relative scroll-mt-20">
      <div className="container mx-auto px-6 max-w-3xl relative">
        <div className="text-center mb-12">
          <span className="inline-block text-[11px] uppercase tracking-[0.24em] text-emerald-glow/80 font-medium mb-4">
            Perguntas frequentes
          </span>
          <h2 className="font-heading text-3xl md:text-5xl font-bold text-sidebar-foreground mb-4 text-balance">
            Clareza também sobre o produto
          </h2>
          <p className="text-sidebar-foreground/60 text-base md:text-lg">
            O que o LUCIUS é, o que não é, e como ele funciona.
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="glass-dark rounded-xl border-emerald-subtle px-5 border"
            >
              <AccordionTrigger className="text-left text-sidebar-foreground hover:no-underline font-heading font-semibold text-base py-5">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sidebar-foreground/65 text-sm leading-relaxed pb-5">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
