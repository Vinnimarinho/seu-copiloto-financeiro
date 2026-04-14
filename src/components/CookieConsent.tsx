import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const COOKIE_KEY = "lucius_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(COOKIE_KEY, "rejected");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-card border-t border-border shadow-elevated p-4 md:p-5">
      <div className="container mx-auto max-w-4xl flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium mb-1">🍪 Uso de cookies e dados</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para melhorar sua experiência. 
            Seus dados financeiros são usados exclusivamente para gerar análises da sua carteira e <strong>nunca são compartilhados com terceiros</strong>. 
            Consulte nossa{" "}
            <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link> e os{" "}
            <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={reject} className="text-xs">
            Recusar opcionais
          </Button>
          <Button variant="default" size="sm" onClick={accept} className="text-xs">
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
