import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { SEO } from "@/components/SEO";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Termos de Uso — Lucius" description="Termos e condições de uso da plataforma Lucius, incluindo limites regulatórios e responsabilidades do usuário." path="/terms" />
      <header className="border-b border-border bg-card h-16 flex items-center px-6">
        <Link to="/"><Logo size="md" /></Link>
      </header>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Termos de Uso</h1>
        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Última atualização: 14 de abril de 2026</p>

          <h2 className="font-heading text-lg font-semibold text-foreground">1. Natureza do serviço</h2>
          <p>
            O Lucius é uma <strong>plataforma de análise assistida e educação financeira</strong>. Fornecemos diagnósticos automatizados, 
            simulações e sugestões educativas sobre carteiras de investimentos. <strong>O Lucius NÃO é e NÃO atua como:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Consultoria de valores mobiliários (Res. CVM nº 19/2021)</li>
            <li>Analista de valores mobiliários (Res. CVM nº 20/2021)</li>
            <li>Assessor de investimento (Res. CVM nº 178/2023)</li>
            <li>Administrador, gestor ou distribuidor de valores mobiliários</li>
            <li>Corretora, distribuidora ou instituição financeira</li>
          </ul>
          <p>
            O Lucius não possui registro na CVM, ANBIMA, APIMEC ou qualquer órgão regulador do mercado financeiro brasileiro.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">2. Limitação de responsabilidade — análise assistida</h2>
          <p>
            Todas as análises, diagnósticos e sugestões gerados pelo Lucius são de caráter <strong>exclusivamente educativo e informativo</strong>. 
            Eles <strong>não constituem</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Recomendação de compra, venda ou manutenção de quaisquer ativos</li>
            <li>Oferta ou solicitação de valores mobiliários</li>
            <li>Aconselhamento financeiro, fiscal ou jurídico personalizado</li>
            <li>Garantia de rentabilidade ou retorno sobre investimentos</li>
          </ul>
          <p>
            <strong>Rentabilidade passada não é garantia de resultados futuros.</strong> A decisão de investimento 
            é de responsabilidade exclusiva do usuário, que deve avaliar os riscos envolvidos e, se necessário, 
            consultar profissionais devidamente habilitados e registrados nos órgãos competentes.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">3. Ausência de execução de ordens</h2>
          <p>
            O Lucius <strong>não executa, intermedia, recebe ou transmite ordens de compra ou venda</strong> de quaisquer 
            ativos financeiros. Não temos acesso às contas de investimento dos usuários em corretoras, bancos ou 
            quaisquer instituições financeiras.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">4. Imparcialidade</h2>
          <p>
            O Lucius não possui vínculo comercial, societário ou de remuneração com corretoras, gestoras, bancos, 
            emissores de valores mobiliários ou quaisquer participantes do mercado financeiro. As análises 
            são geradas de forma algorítmica, sem favorecimento de produtos ou instituições específicas.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">5. Dados de mercado</h2>
          <p>
            Os dados de mercado utilizados (cotações, índices, indicadores) são obtidos de fontes públicas e 
            podem apresentar atrasos ou imprecisões. O Lucius não garante a exatidão, completude ou atualidade 
            dos dados exibidos.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">6. Dados pessoais e privacidade</h2>
          <p>
            O tratamento de dados pessoais segue a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). 
            Consulte nossa <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link> para 
            informações completas sobre coleta, uso, armazenamento e seus direitos como titular.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">7. Propriedade intelectual</h2>
          <p>
            Todo o conteúdo, algoritmos, layout, marcas e código-fonte do Lucius são protegidos por direitos autorais 
            e propriedade intelectual. É vedada a reprodução, distribuição ou engenharia reversa sem autorização expressa.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">8. Cancelamento e exclusão de dados</h2>
          <p>
            O usuário pode solicitar a exclusão completa dos seus dados a qualquer momento através das configurações 
            da conta ou por email. Após a solicitação, os dados serão removidos no prazo de até 15 (quinze) dias úteis, 
            salvo obrigação legal de retenção.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">9. Legislação aplicável</h2>
          <p>
            Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de São Paulo/SP 
            para dirimir quaisquer controvérsias.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">10. Referências regulatórias</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Lei nº 6.385/1976 — Mercado de valores mobiliários</li>
            <li>Lei nº 6.404/1976 — Sociedades por ações</li>
            <li>Resolução CVM nº 19/2021 — Consultoria de valores mobiliários</li>
            <li>Resolução CVM nº 20/2021 — Analista de valores mobiliários</li>
            <li>Resolução CVM nº 178/2023 — Assessor de investimento</li>
            <li>Resolução CVM nº 179/2023 — Transparência de remuneração</li>
            <li>Lei nº 13.709/2018 — LGPD</li>
            <li>Marco Civil da Internet (Lei nº 12.965/2014)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
