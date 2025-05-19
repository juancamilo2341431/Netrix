import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Account } from "@/components/admin/accounts/AccountsTable";
import { AccountForm } from "./AccountForm";
import { AccountFormValues } from "./account-schema";
import { supabase } from "@/integrations/supabase/client";
import { logAccountCreation } from "@/utils/accountAuditLogger";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountCreated: (account: Account) => void;
  platforms: { id: number; nombre: string }[];
  userId?: number | null;
}

export const CreateAccountDialog = ({
  open,
  onOpenChange,
  onAccountCreated,
  platforms = [], // Aseguramos que platforms tenga un valor por defecto
  userId = null
}: CreateAccountDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: AccountFormValues) => {
    // Validaciones adicionales de seguridad
    if (!data.correo || !data.contrasenia || !data.id_plataforma) {
      toast.error("Por favor, complete todos los campos requeridos");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.correo)) {
      toast.error("Por favor, introduzca un correo electrónico válido");
      return;
    }

    // Validar que la plataforma existe
    const platformExists = platforms.some(platform => platform.id === data.id_plataforma);
    if (!platformExists) {
      toast.error("La plataforma seleccionada no es válida");
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitizar los datos antes de enviarlos (evita XSS)
      const sanitizedData = {
        correo: String(data.correo).trim(),
        contrasenia: String(data.contrasenia),
        estado: 'disponible' as const,
        id_plataforma: Number(data.id_plataforma)
      };

      // Al insertar en la base de datos, el trigger se encarga de encriptar la contraseña
      const { data: newAccountData, error } = await supabase
        .from('cuenta')
        .insert(sanitizedData)
        .select(`
          id,
          correo,
          estado,
          created_at,
          last_updated,
          id_plataforma,
          plataforma:id_plataforma(id, nombre)
        `)
        .single();
      
      if (error) {
        console.error("Error al crear la cuenta:", error);
        toast.error("Error al crear la cuenta");
        return;
      }
      
      if (!newAccountData) {
        toast.error("No se pudo crear la cuenta");
        return;
      }

      // Creamos el objeto de cuenta con la contraseña original para mostrarlo en la UI
      const newAccount: Account = {
        id: newAccountData.id,
        correo: newAccountData.correo || "",
        contrasenia: sanitizedData.contrasenia, // Usamos la contraseña original no encriptada
        estado: newAccountData.estado,
        created_at: newAccountData.created_at,
        last_updated: newAccountData.last_updated,
        id_plataforma: newAccountData.id_plataforma,
        platform: newAccountData.plataforma?.nombre || ""
      };

      // Registramos la acción para auditoría
      if (userId) {
        await logAccountCreation(userId, newAccount.id, newAccount.platform, newAccount.correo);
      }
      
      // Mostramos notificación de éxito
      toast.success("Cuenta creada correctamente");
      
      // Llamamos al callback para actualizar la lista de cuentas
      onAccountCreated(newAccount);
      
      // Cerramos el diálogo
      onOpenChange(false);
    } catch (error) {
      console.error("Error al crear la cuenta:", error);
      toast.error("Error al crear la cuenta");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Cuenta</DialogTitle>
          <DialogDescription>
            Complete el formulario para crear una nueva cuenta de plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <AccountForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
          platforms={platforms}
        />
      </DialogContent>
    </Dialog>
  );
};
