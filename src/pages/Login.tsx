import { Button } from "@/components/ui/button";
import { PieChart, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <PieChart className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Entrar</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse sua conta no Meu Copiloto</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-elevated space-y-4">
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
              <input type={showPass ? "text" : "password"} placeholder="••••••••" className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="text-right">
            <Link to="/reset-password" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
          </div>
          <Link to="/dashboard">
            <Button variant="hero" className="w-full">Entrar</Button>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta? <Link to="/signup" className="text-primary font-medium hover:underline">Criar conta grátis</Link>
        </p>
        <div className="text-center mt-3">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
            <ArrowLeft className="w-3 h-3" /> Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  );
}
