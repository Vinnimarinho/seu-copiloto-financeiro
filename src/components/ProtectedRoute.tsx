import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/usePortfolio";
import { DataConsentDialog } from "@/components/DataConsentDialog";

/**
 * Guard de rota:
 *  - sem sessão            → /login
 *  - sessão sem profile    → /onboarding (vai criar profile lá)
 *  - profile incompleto    → /onboarding
 *  - profile + onboarding  → libera, exigindo consentimento LGPD
 *
 * Nunca libera dashboard quando o profile não existe.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();
  const [consentJustAccepted, setConsentJustAccepted] = useState(false);

  if (loading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Sem profile (deveria ter sido criado pelo trigger handle_new_user, mas
  // pode falhar em alguns edge cases): força onboarding, que cria/garante o profile.
  if (!profile && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Onboarding incompleto
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Consentimento LGPD obrigatório após onboarding
  const needsConsent =
    profile &&
    profile.onboarding_completed &&
    !(profile as { data_consent_accepted_at?: string | null }).data_consent_accepted_at &&
    !consentJustAccepted;

  return (
    <>
      {needsConsent && (
        <DataConsentDialog open={true} onAccepted={() => setConsentJustAccepted(true)} />
      )}
      {children}
    </>
  );
}
