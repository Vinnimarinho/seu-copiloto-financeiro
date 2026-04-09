import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { User, Shield, Trash2, Download } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações</h1>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5" /> Perfil
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Nome</span><p className="font-medium text-foreground">Usuário Demo</p></div>
            <div><span className="text-muted-foreground">Email</span><p className="font-medium text-foreground">demo@meucopiloto.com</p></div>
            <div><span className="text-muted-foreground">Perfil de risco</span><p className="font-medium text-foreground">Moderado</p></div>
            <div><span className="text-muted-foreground">Plano</span><p className="font-medium text-foreground">Gratuito</p></div>
          </div>
          <Button variant="outline" size="sm">Editar perfil</Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5" /> Privacidade e dados
          </h2>
          <p className="text-sm text-muted-foreground">
            Seus dados são protegidos e nunca usados para treinar modelos de IA. Você pode exportar ou excluir seus dados a qualquer momento.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm"><Download className="w-4 h-4" /> Exportar dados</Button>
            <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="w-4 h-4" /> Excluir conta</Button>
          </div>
        </div>
      </div>
    </AppSidebar>
  );
}
