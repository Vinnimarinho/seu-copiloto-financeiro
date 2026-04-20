import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/usePortfolio";
import { DataConsentDialog } from "@/components/DataConsentDialog";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading, isError } = useProfile();
  const location = useLocation();
  const [consentJustAccepted, setConsentJustAccepted] = useState(false);

  if (loading || (profileLoading && !isError)) {
    return (
      <div className="min-h-screen bg-sidebar flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Redirect to onboarding if not completed (except if already on onboarding)
  if (profile && !profile.onboarding_completed && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  // Require data consent before any protected access (after onboarding)
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
