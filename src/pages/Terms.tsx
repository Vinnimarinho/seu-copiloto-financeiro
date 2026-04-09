import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card h-16 flex items-center px-6">
        <Link to="/"><Logo size="md" /></Link>
      </header>
      <div className="container mx-auto px-6 py-12 max-w-3xl">
        <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
          <ArrowLeft className="w-3 h-3" /> Voltar
        </Link>
        <h1 className="font-heading text-3xl font-bold text-foreground mb-6">Termos de Uso</h1>
        <div className="prose prose-sm text-muted-foreground space-y-4">
          <p>Última atualização: 09 de abril de 2026</p>
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Sobre o serviço</h2>
          <p>O Lucius é uma plataforma de análise assistida de carteiras de investimentos. Fornecemos diagnósticos, simulações e sugestões educativas. <strong>Não somos uma corretora, gestora ou consultoria de investimentos.</strong></p>
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Análise assistida</h2>
          <p>Todas as recomendações são sugestões baseadas em análise algorítmica. Não garantimos rentabilidade e não executamos ordens automaticamente. A decisão final é sempre do usuário.</p>
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Dados e privacidade</h2>
          <p>Seus dados financeiros são usados exclusivamente para gerar análises da sua carteira. Não compartilhamos, vendemos ou usamos seus dados para treinar modelos de IA.</p>
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Exclusão de dados</h2>
          <p>Você pode solicitar a exclusão completa dos seus dados a qualquer momento através das configurações da conta.</p>
        </div>
      </div>
    </div>
  );
}
