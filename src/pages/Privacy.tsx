import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { SEO } from "@/components/SEO";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="Política de Privacidade — Lucius" description="Como o Lucius coleta, utiliza e protege seus dados pessoais conforme a LGPD." path="/privacy" />
      <header className="border-b border-border bg-card h-16 flex items-center px-6">
        <Link to="/"><Logo size="md" /></Link>
      </header>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Política de Privacidade</h1>
        <div className="prose prose-sm text-muted-foreground space-y-6">
          <p>Última atualização: 14 de abril de 2026</p>
          <p>
            Esta Política de Privacidade descreve como o Lucius ("nós", "nosso") coleta, utiliza, armazena e 
            protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados Pessoais 
            (Lei nº 13.709/2018 — LGPD) e o Marco Civil da Internet (Lei nº 12.965/2014).
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">1. Controlador de dados</h2>
          <p>
            O controlador responsável pelo tratamento dos seus dados pessoais é o Lucius. 
            Para exercer seus direitos ou esclarecer dúvidas, entre em contato com nosso 
            Encarregado de Proteção de Dados (DPO): <strong>privacidade@lucius.app</strong>
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">2. Dados coletados</h2>
          <p>Coletamos as seguintes categorias de dados:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dados cadastrais:</strong> nome, email, telefone (opcional)</li>
            <li><strong>CPF (hash):</strong> usado exclusivamente para garantir 1 (uma) conta gratuita por pessoa e prevenir abuso do plano gratuito. O CPF <strong>nunca é armazenado em texto puro</strong> — guardamos apenas o seu <strong>hash criptográfico SHA-256 com pepper</strong>, que não permite reverter para o número original. Não usamos o CPF para qualquer outra finalidade (não enviamos a parceiros, não consultamos bureaus de crédito, não compomos cadastro positivo).</li>
            <li><strong>Dados financeiros:</strong> posições de carteira, ativos, valores, tickers — importados voluntariamente por você</li>
            <li><strong>Dados de perfil de investidor:</strong> tolerância a risco, horizonte de investimento, objetivos</li>
            <li><strong>Dados de uso:</strong> páginas acessadas, funcionalidades utilizadas, interações com o chat</li>
            <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional, cookies essenciais</li>
          </ul>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-semibold text-foreground mb-1">Nota LGPD — Tratamento do CPF</p>
            <p>O CPF nunca é gravado em texto puro. Aplicamos a função SHA-256 com pepper (segredo de servidor) sobre os 11 dígitos e armazenamos apenas o hash resultante. Esse hash serve unicamente como identificador único anti-duplicidade — não permite recuperar o CPF original nem identificar você fora do contexto da nossa base.</p>
          </div>

          <h2 className="font-heading text-lg font-semibold text-foreground">3. Bases legais para tratamento (Art. 7º, LGPD)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Consentimento (Art. 7º, I):</strong> para coleta de dados financeiros e perfil de investidor</li>
            <li><strong>Execução de contrato (Art. 7º, V):</strong> para prestação do serviço de análise de carteira</li>
            <li><strong>Legítimo interesse (Art. 7º, IX):</strong> para melhoria da plataforma e segurança</li>
            <li><strong>Cumprimento de obrigação legal (Art. 7º, II):</strong> quando aplicável por exigência regulatória</li>
          </ul>

          <h2 className="font-heading text-lg font-semibold text-foreground">4. Finalidade do uso dos dados</h2>
          <p>Seus dados são usados exclusivamente para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Gerar análises, diagnósticos e sugestões educativas sobre sua carteira</li>
            <li>Personalizar a experiência e o conteúdo educacional apresentado</li>
            <li>Operar e manter a plataforma com segurança</li>
            <li>Comunicar atualizações relevantes do serviço</li>
          </ul>
          <p>
            <strong>Nunca utilizamos seus dados financeiros para treinar modelos de inteligência artificial, 
            vender para terceiros, direcionar publicidade ou qualquer outra finalidade não descrita aqui.</strong>
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">5. Compartilhamento de dados</h2>
          <p>
            Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. 
            O compartilhamento ocorre apenas:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Com provedores de infraestrutura (hospedagem, banco de dados) sob contratos de confidencialidade</li>
            <li>Para processamento de pagamentos (Stripe), limitado ao necessário para a transação</li>
            <li>Por determinação judicial ou obrigação legal</li>
          </ul>

          <h2 className="font-heading text-lg font-semibold text-foreground">6. Armazenamento e segurança</h2>
          <p>
            Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. 
            Aplicamos políticas de acesso mínimo (Row-Level Security) no banco de dados, garantindo que 
            cada usuário acesse exclusivamente seus próprios dados.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">7. Retenção de dados</h2>
          <p>
            Seus dados são mantidos enquanto sua conta estiver ativa. Após exclusão da conta, os dados 
            pessoais são removidos no prazo de até 15 dias úteis, salvo obrigações legais de retenção 
            (ex.: registros contábeis, obrigações fiscais).
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">8. Cookies</h2>
          <p>Utilizamos:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cookies essenciais:</strong> necessários para o funcionamento da plataforma (autenticação, sessão)</li>
            <li><strong>Cookies analíticos:</strong> para entender o uso da plataforma e melhorar a experiência (somente com consentimento)</li>
          </ul>
          <p>Você pode gerenciar suas preferências de cookies a qualquer momento.</p>

          <h2 className="font-heading text-lg font-semibold text-foreground">9. Seus direitos (Art. 18, LGPD)</h2>
          <p>Como titular dos dados, você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los</li>
            <li><strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
            <li><strong>Anonimização, bloqueio ou eliminação:</strong> de dados desnecessários ou tratados em desconformidade</li>
            <li><strong>Portabilidade:</strong> transferir seus dados a outro fornecedor</li>
            <li><strong>Eliminação:</strong> solicitar exclusão dos dados tratados com consentimento</li>
            <li><strong>Informação:</strong> saber com quais entidades compartilhamos dados</li>
            <li><strong>Revogação do consentimento:</strong> retirar o consentimento a qualquer momento</li>
            <li><strong>Oposição:</strong> se opor ao tratamento em caso de descumprimento da LGPD</li>
          </ul>
          <p>
            Para exercer qualquer direito, acesse as configurações da sua conta ou envie email para{" "}
            <strong>privacidade@lucius.app</strong>. Responderemos em até 15 dias úteis.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">10. Menores de idade</h2>
          <p>
            O Lucius não é destinado a menores de 18 anos. Não coletamos intencionalmente dados 
            de menores de idade.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">11. Transferência internacional</h2>
          <p>
            Seus dados podem ser processados em servidores localizados fora do Brasil, em países que 
            oferecem nível adequado de proteção de dados ou sob cláusulas contratuais padrão, conforme 
            Art. 33 da LGPD.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">12. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças relevantes 
            por email ou aviso na plataforma. O uso continuado após a publicação de alterações 
            constitui aceite das novas condições.
          </p>

          <h2 className="font-heading text-lg font-semibold text-foreground">13. Autoridade Nacional de Proteção de Dados</h2>
          <p>
            Caso entenda que o tratamento de dados está em desconformidade com a LGPD, você pode 
            apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD):{" "}
            <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              www.gov.br/anpd
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
