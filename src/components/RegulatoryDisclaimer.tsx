import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Aviso regulatório padronizado.
 * Linguagem: software de apoio à análise da performance da carteira e à
 * compreensão do investidor. Não usar "recomendação", "consultoria" ou
 * "assessoria" sem o qualificador "educacional/de apoio".
 */
export function RegulatoryDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed text-center py-2">
        Software de apoio à análise da performance da carteira. Conteúdo informativo e educacional —
        não constitui consultoria, oferta de valores mobiliários ou execução de ordens. A decisão final é sua.{" "}
        <Link to="/terms" className="hover:underline">Termos</Link> ·{" "}
        <Link to="/privacy" className="hover:underline">Privacidade</Link>
      </p>
    );
  }

  return (
    <div className="bg-secondary/40 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        <strong>Aviso:</strong> O LUCIUS é um software de apoio à análise da performance da carteira e
        à compreensão do investidor. O conteúdo apresentado tem caráter informativo e educacional de
        suporte à decisão do usuário. O LUCIUS não executa ordens, não realiza gestão de carteira e
        não substitui avaliação profissional regulada quando necessária. Não somos registrados na
        CVM, ANBIMA ou APIMEC. Rentabilidade passada não é garantia de resultados futuros.{" "}
        <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link> ·{" "}
        <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
      </p>
    </div>
  );
}
