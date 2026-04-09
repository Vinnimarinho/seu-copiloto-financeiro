import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Logo } from "@/components/Logo";

export default function SignupPage() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" variant="light" showText={false} />
          </div>
          <h1 className="font-heading text-2xl font-bold text-sidebar-foreground">Criar conta</h1>
          <p className="text-sm text-sidebar-foreground/60 mt-1">Comece a analisar sua carteira gratuitamente</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-elevated space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Seu nome" className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" placeholder="seu@email.com" className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input type={showPass ? "text" : "password"} placeholder="Mínimo 8 caracteres" className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1 rounded border-input" id="terms" />
            <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed">
              Li e concordo com os <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link> e a <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
            </label>
          </div>
          <Link to="/dashboard">
            <Button variant="hero" className="w-full">Criar conta grátis</Button>
          </Link>
        </div>

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
