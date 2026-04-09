import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card h-16 flex items-center px-6">
        <Link to="/"><Logo size="md" /></Link>
      </header>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Política de Privacidade</h1>
        <div className="prose prose-sm text-muted-foreground space-y-4">
          <p>Última atualização: 09 de abril de 2026</p>
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Dados coletados</h2>
          <p>Coletamos dados de cadastro (nome, email) e dados financeiros que você importa voluntariamente para análise.</p>
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Uso dos dados</h2>
          <p>Seus dados são usados exclusivamente para gerar análises, diagnósticos e recomendações personalizadas. <strong>Nunca usamos seus dados para treinar modelos de IA ou compartilhamos com terceiros.</strong></p>
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Armazenamento</h2>
          <p>Os dados são armazenados com criptografia em servidores seguros. Aplicamos políticas de acesso mínimo (RLS) no banco de dados.</p>
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Seus direitos (LGPD)</h2>
          <p>Você pode acessar, corrigir, exportar ou excluir seus dados a qualquer momento.</p>
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Consentimento</h2>
          <p>Ao criar uma conta, você consente com o tratamento dos dados conforme descrito nesta política. Você pode revogar o consentimento a qualquer momento.</p>
        </div>
      </div>
    </div>
  );
}
