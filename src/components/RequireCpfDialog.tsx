import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatCpf, isValidCpf, onlyDigits } from "@/lib/cpf";
import { toast } from "sonner";

interface RequireCpfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed?: () => void;
}

export function RequireCpfDialog({ open, onOpenChange, onConfirmed }: RequireCpfDialogProps) {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) setCpf("");
  }, [open]);

  const handleSave = async () => {
    if (!isValidCpf(cpf)) {
      toast.error("CPF inválido.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.rpc("set_user_cpf", { _cpf: onlyDigits(cpf) });
    setLoading(false);
    if (error) {
      const msg = error.message?.includes("cpf_already_in_use")
        ? "Este CPF já está vinculado a outra conta."
        : error.message?.includes("invalid_cpf")
          ? "CPF inválido."
          : "Não foi possível salvar o CPF. Tente novamente.";
      toast.error(msg);
      return;
    }
    toast.success("CPF registrado.");
    onOpenChange(false);
    onConfirmed?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirme seu CPF para continuar</DialogTitle>
          <DialogDescription>
            Para usar funções que consomem créditos, precisamos vincular sua conta a um CPF.
            Armazenamos apenas o hash — seu CPF nunca fica em texto puro.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cpf-input">CPF</Label>
          <Input
            id="cpf-input"
            inputMode="numeric"
            placeholder="000.000.000-00"
            maxLength={14}
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading}>{loading ? "Salvando…" : "Salvar e continuar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
