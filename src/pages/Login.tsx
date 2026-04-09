import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error("Email ou senha incorretos");
    } else {
      navigate("/dashboard");
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Informe seu email"); return; }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setResetMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="light" showText={false} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-sidebar-foreground">
            {resetMode ? "Recuperar senha" : "Entrar"}
          </h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">
            {resetMode ? "Enviaremos um link para redefinir sua senha" : "Acesse sua conta no Lucius"}
          </p>
        </div>

        <form onSubmit={resetMode ? handleReset : handleLogin} className="bg-card border border-border rounded-xl p-6 shadow-elevated space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          {!resetMode && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
          {!resetMode && (
            <div className="text-right">
              <button type="button" onClick={() => setResetMode(true)} className="text-xs text-primary hover:underline">
                Esqueci minha senha
              </button>
            </div>
          )}
          <Button variant="hero" className="w-full" type="submit" disabled={loading}>
            {loading ? "Aguarde..." : resetMode ? "Enviar link" : "Entrar"}
          </Button>
          {resetMode && (
            <button type="button" onClick={() => setResetMode(false)} className="text-xs text-muted-foreground hover:text-foreground w-full text-center">
              Voltar ao login
            </button>
          )}
        </form>

        <p className="text-center text-sm text-sidebar-foreground/60 mt-6">
          Não tem conta? <Link to="/signup" className="text-sidebar-primary font-medium hover:underline">Criar conta grátis</Link>
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
