import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function RegulatoryDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed text-center py-2">
        App de educação financeira assistido por IA. Não constitui consultoria, recomendação de investimento ou oferta de valores mobiliários. Não indicamos ativos específicos (CVM Res. 19/2021 e 20/2021).{" "}
        <Link to="/terms" className="hover:underline">Termos</Link> · <Link to="/privacy" className="hover:underline">Privacidade</Link>
      </p>
    );
  }

  return (
    <div className="bg-secondary/40 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        <strong>Aviso regulatório:</strong> O Lucius é um aplicativo de educação financeira assistido por inteligência artificial (Google Gemini e OpenAI GPT). 
        Não somos registrados na CVM como consultores (Res. CVM 19/2021), analistas de valores mobiliários (Res. CVM 20/2021) ou assessores de investimento (Res. CVM 178/2023). 
        As informações apresentadas <strong>não constituem recomendação de investimento, oferta de valores mobiliários ou consultoria financeira</strong>. 
        Não indicamos fundos, ações ou ativos específicos. As sugestões são de caráter educacional e a decisão é exclusivamente do usuário. 
        Rentabilidade passada não é garantia de resultados futuros.{" "}
        <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link> · <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
      </p>
    </div>
  );
}
