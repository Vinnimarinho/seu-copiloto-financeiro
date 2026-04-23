import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Rota de retorno controlada para confirmação de email, OAuth e magic link.
 * Não despeja o usuário direto no /dashboard — valida sessão e perfil antes.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirmando sua conta...");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        // Aguarda o supabase consumir o hash/code da URL e estabelecer sessão.
        const { data: { session }, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          toast.error("Não conseguimos confirmar sua conta. Tente entrar novamente.");
          navigate("/login", { replace: true });
          return;
        }

        if (!session?.user) {
          // Pode acontecer se o link expirou ou já foi usado.
          setMessage("Sessão não encontrada. Redirecionando para o login...");
          setTimeout(() => navigate("/login", { replace: true }), 1500);
          return;
        }

        // Decide próximo destino baseado no estado do perfil.
        setMessage("Carregando seu perfil...");
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (!profile || !profile.onboarding_completed) {
          toast.success("Conta confirmada! Vamos finalizar seu cadastro.");
          navigate("/onboarding", { replace: true });
        } else {
          toast.success("Bem-vindo de volta!");
          navigate("/dashboard", { replace: true });
        }
      } catch {
        if (!cancelled) {
          toast.error("Erro inesperado. Tente novamente.");
          navigate("/login", { replace: true });
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6">
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" variant="light" showText={false} />
        </div>
        <Loader2 className="w-8 h-8 text-sidebar-primary animate-spin mx-auto mb-4" />
        <p className="text-sm text-sidebar-foreground/70">{message}</p>
      </div>
    </div>
  );
}
