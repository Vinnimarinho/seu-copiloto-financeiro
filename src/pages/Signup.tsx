import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, IdCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { toast } from "sonner";

export default function SignupPage() {
  const [showPass, setShowPass] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error("Você precisa aceitar os termos"); return; }
    if (password.length < 8) { toast.error("A senha deve ter pelo menos 8 caracteres"); return; }
    if (!isValidCpf(cpf)) { toast.error("CPF inválido"); return; }
    setLoading(true);

    // 1) Pré-checagem: valida CPF e verifica duplicidade (retorna cpf_hash)
    const { data: pre, error: preError } = await supabase.functions.invoke("signup-precheck", {
      body: { cpf: onlyDigits(cpf) },
    });
    if (preError || !pre?.cpf_hash) {
      setLoading(false);
      const code = (pre as any)?.error ?? (preError as any)?.context?.error;
      if (code === "cpf_already_in_use") {
        toast.error("Este CPF já está vinculado a outra conta.");
      } else if (code === "invalid_cpf") {
        toast.error("CPF inválido.");
      } else {
        toast.error("Não foi possível validar o CPF. Tente novamente.");
      }
      return;
    }

    // 2) Cria a conta carregando o cpf_hash em user_metadata
    const { error } = await signUp(email, password, fullName, pre.cpf_hash);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Conta criada! Verifique seu email para confirmar.");
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="light" showText={false} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-sidebar-foreground">Criar conta</h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">Comece a analisar sua carteira gratuitamente</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 shadow-elevated space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome" required className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">CPF</label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                placeholder="000.000.000-00"
                required
                maxLength={14}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Usado apenas para garantir 1 conta gratuita por pessoa. Armazenamos só o hash.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" required className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 rounded border-input" id="terms" />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
              Li e concordo com os <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link> e a <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
            </label>
          </div>
          <Button variant="hero" className="w-full" type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </Button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">ou</span></div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
              if (result.error) { toast.error("Erro ao entrar com Google"); setLoading(false); return; }
              if (result.redirected) return;
              navigate("/dashboard");
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Criar conta com Google
          </Button>
        </form>

        <p className="text-center text-sm text-sidebar-foreground/60 mt-6">
          Já tem conta? <Link to="/login" className="text-sidebar-primary font-medium hover:underline">Entrar</Link>
        </p>
        <div className="text-center mt-3">
          <Link to="/" className="text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground/70 flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
