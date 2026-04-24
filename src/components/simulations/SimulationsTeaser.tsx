import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SimulationsTeaser() {
  const navigate = useNavigate();
  return (
    <Card className="p-8 max-w-2xl mx-auto text-center bg-gradient-to-br from-primary/10 via-background to-background border-primary/30">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
      </div>
      <h2 className="font-heading text-2xl text-foreground mb-2">Simulações de Cenários</h2>
      <p className="text-muted-foreground mb-6 leading-relaxed">
        Veja o impacto potencial de mudanças táticas na sua carteira antes de agir.
        Compare cenário atual vs. simulado em rentabilidade estimada, liquidez,
        concentração e risco — com premissas transparentes.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-xs text-left">
        <Card className="p-3 bg-background/60">
          <div className="font-semibold text-foreground mb-1">Troca de posição</div>
          <div className="text-muted-foreground">Mover R$ X de A para B</div>
        </Card>
        <Card className="p-3 bg-background/60">
          <div className="font-semibold text-foreground mb-1">Rebalanceamento</div>
          <div className="text-muted-foreground">Ajustar pesos por classe</div>
        </Card>
        <Card className="p-3 bg-background/60">
          <div className="font-semibold text-foreground mb-1">Concentração</div>
          <div className="text-muted-foreground">Concentrar % em um ativo</div>
        </Card>
      </div>
      <Button onClick={() => navigate("/pricing")} size="lg" className="gap-2">
        <Lock className="w-4 h-4" />
        Disponível nos planos pagos
      </Button>
    </Card>
  );
}
