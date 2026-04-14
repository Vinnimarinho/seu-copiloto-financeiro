import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function RegulatoryDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed text-center py-2">
        Ferramenta educacional de análise assistida. Não constitui consultoria, recomendação de investimento ou oferta de valores mobiliários (CVM Res. 19/2021).{" "}
        <Link to="/terms" className="hover:underline">Termos</Link> · <Link to="/privacy" className="hover:underline">Privacidade</Link>
      </p>
    );
  }

  return (
    <div className="bg-secondary/40 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        <strong>Aviso regulatório:</strong> O Lucius é uma ferramenta educacional de análise assistida de carteiras. 
        Não somos registrados na CVM como consultores ou analistas de valores mobiliários (Res. CVM 19/2021 e Res. CVM 20/2021). 
        As informações apresentadas <strong>não constituem recomendação de investimento, oferta de valores mobiliários ou consultoria financeira</strong>. 
        Rentabilidade passada não é garantia de resultados futuros. A decisão de investimento é de responsabilidade exclusiva do usuário.{" "}
        <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link> · <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
      </p>
    </div>
  );
}
