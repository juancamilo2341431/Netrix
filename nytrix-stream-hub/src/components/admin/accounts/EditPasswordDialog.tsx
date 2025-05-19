import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAccountUpdate } from "@/utils/accountAuditLogger";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { PasswordField } from "./form-fields/PasswordField";
import { Button } from "@/components/ui/button";
import { Account } from "./AccountsTable";

const editPasswordSchema = z.object({
  contrasenia: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type EditPasswordFormValues = z.infer<typeof editPasswordSchema>;

interface EditPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onAccountUpdated: (updatedAccount: Account) => void;
  userId?: number | null;
}

export const EditPasswordDialog = ({
  open,
  onOpenChange,
  account,
  onAccountUpdated,
  userId = null
}: EditPasswordDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditPasswordFormValues>({
    resolver: zodResolver(editPasswordSchema),
    defaultValues: {
      contrasenia: "",
    },
  });

  const onSubmit = async (data: EditPasswordFormValues) => {
    if (!account) return;
    
    try {
      setIsSubmitting(true);
      
      // Update password in database
      const { data: updatedData, error } = await supabase
        .from("cuenta")
        .update({ 
          contrasenia: data.contrasenia,
          // The hash_password trigger will encrypt this automatically
          last_updated: new Date().toISOString()
        })
        .eq("id", account.id)
        .select("*, plataforma:id_plataforma(nombre)")
        .single();
        
      if (error) {
        console.error("Error updating password:", error);
        toast.error("Error al actualizar la contraseña");
        return;
      }
      
      // Get the decrypted password to display in the UI
      const { data: decryptData } = await supabase
        .rpc('decrypt_password', { 
          encrypted_password: updatedData.metadata_perfil 
        });
      
      // Prepare updated account object with new password
      const updatedAccount: Account = {
        ...account,
        contrasenia: decryptData || "••••••••",
        last_updated: updatedData.last_updated
      };
      
      // Registrar la acción en la auditoría
      if (userId) {
        await logAccountUpdate(userId, account.id, account.platform || "", account.correo, "contraseña");
      }
      
      // Update the accounts table
      onAccountUpdated(updatedAccount);
      toast.success("Contraseña actualizada exitosamente");
      form.reset();
      onOpenChange(false);
    } catch (err) {
      console.error("Exception updating password:", err);
      toast.error("Error inesperado al actualizar la contraseña");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Actualizar la contraseña para {account?.correo}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PasswordField form={form} />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
