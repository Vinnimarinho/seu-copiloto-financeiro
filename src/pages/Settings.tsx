import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { User, Shield, Trash2, Download, Loader2 } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/usePortfolio";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

const profileOptions = [
  { value: "conservador" as const, label: "Conservador" },
  { value: "moderado" as const, label: "Moderado" },
  { value: "arrojado" as const, label: "Arrojado" },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [investorProfile, setInvestorProfile] = useState<"conservador" | "moderado" | "arrojado">("moderado");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setInvestorProfile(profile.investor_profile || "moderado");
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile.mutate({ full_name: name, phone, investor_profile: investorProfile });
  };

  if (isLoading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppSidebar>
    );
  }

  return (
    <AppSidebar>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Configurações</h1>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5" /> Perfil
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nome</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full h-10 px-3 rounded-lg border border-input bg-secondary text-sm text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Telefone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Perfil de investidor</label>
              <select
                value={investorProfile}
                onChange={e => setInvestorProfile(e.target.value as typeof investorProfile)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {profileOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="default" size="sm" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar alterações"}
          </Button>
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
