import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { User, Shield, Trash2, Download, Loader2 } from "lucide-react";
import { useProfile, useUpdateProfile, useInvestorProfile, useUpdateInvestorProfile } from "@/hooks/usePortfolio";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();
  const { data: investorData } = useInvestorProfile();
  const updateProfile = useUpdateProfile();
  const updateInvestor = useUpdateInvestorProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [riskTolerance, setRiskTolerance] = useState<"conservador" | "moderado" | "arrojado">("moderado");
  const [exporting, setExporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const profileOptions = [
    { value: "conservador" as const, label: t("settings.conservative") },
    { value: "moderado" as const, label: t("settings.moderate") },
    { value: "arrojado" as const, label: t("settings.aggressive") },
  ];

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  useEffect(() => {
    if (investorData) {
      setRiskTolerance(investorData.risk_tolerance || "moderado");
    }
  }, [investorData]);

  const handleSave = () => {
    updateProfile.mutate({ full_name: name, phone });
    updateInvestor.mutate({ risk_tolerance: riskTolerance });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data, error } = await supabase.rpc("export_user_data");
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lucius-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(t("settings.exportSuccess"));
    } catch (e) {
      toast.error(`${t("settings.exportError")}: ${(e as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_user_account");
      if (error) throw error;
      toast.success(t("settings.deleteSuccess"));
      await signOut();
      navigate("/", { replace: true });
    } catch (e) {
      toast.error(`${t("settings.deleteError")}: ${(e as Error).message}`);
      setDeleting(false);
    }
  };

  const isSaving = updateProfile.isPending || updateInvestor.isPending;

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
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <SubscriptionBadge />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <User className="w-5 h-5" /> {t("settings.profile")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("settings.name")}</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("settings.email")}</label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full h-10 px-3 rounded-lg border border-input bg-secondary text-sm text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("settings.phone")}</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder={t("settings.phonePlaceholder")}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">{t("settings.investorProfile")}</label>
              <select
                value={riskTolerance}
                onChange={e => setRiskTolerance(e.target.value as typeof riskTolerance)}
                className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {profileOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t("settings.saving")}</> : t("settings.save")}
          </Button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card space-y-4">
          <h2 className="font-heading font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5" /> {t("settings.privacy")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("settings.privacyDesc")}</p>
          <p className="text-xs text-muted-foreground">{t("settings.fiscalNote")}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t("settings.exportData")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => { setConfirmText(""); setShowDeleteDialog(true); }}
            >
              <Trash2 className="w-4 h-4" /> {t("settings.deleteAccount")}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{t("settings.deleteWarning")}</span>
              <span className="block">{t("settings.deleteConfirm")}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={t("settings.deleteWord")}
            className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("settings.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmText !== t("settings.deleteWord") || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("settings.deleteFinal")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppSidebar>
  );
}
