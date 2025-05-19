import { useState, useEffect } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Account, AccountStatus } from "./AccountsTable";
import { EditPasswordDialog } from "./EditPasswordDialog";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { logAccountToTrash, logAccountUpdate } from "@/utils/accountAuditLogger";
import { useAuth } from "@/contexts/AuthContext";

interface AccountActionsProps {
  account: Account;
  onAccountUpdated?: (updatedAccount: Account) => void;
  userId?: number | null;
}

export const AccountActions = ({ 
  account,
  onAccountUpdated = () => {},
  userId = null
}: AccountActionsProps) => {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  
  // Para invalidar la caché de cuentas después de una actualización
  const queryClient = useQueryClient();
  
  // Determinar si la cuenta está disponible
  const isAvailable = account.estado === "disponible";
  
  // Determinar si la cuenta puede moverse a papelera (solo disponibles o en revisión)
  const canMoveToTrash = account.estado === "disponible" || account.estado === "revision";
  
  // Determinar si la cuenta está alquilada
  const isRented = account.estado === "alquilada";
  
  // Función para mover la cuenta a la papelera (cambiar estado a "papelera")
  const moveToTrash = async () => {
    try {
      setIsDeleting(true);
      
      // Actualizar el estado de la cuenta a "papelera" en la base de datos
      const { error } = await supabase
        .from('cuenta')
        .update({ 
          estado: 'papelera',
          last_updated: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (error) {
        console.error("Error al mover la cuenta a la papelera:", error);
        toast.error("Error al mover la cuenta a la papelera");
        return;
      }
      
      // Registrar la acción en la auditoría
      if (userId) {
        await logAccountToTrash(userId, account.id, account.platform || "", account.correo);
      }
      
      // Actualizar la cuenta localmente
      const updatedAccount: Account = {
        ...account,
        estado: "papelera" as AccountStatus,
        last_updated: new Date().toISOString()
      };
      
      // Llamar al callback proporcionado por el padre
      onAccountUpdated(updatedAccount);
      
      // Invalidar la caché para refrescar la lista de cuentas
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      toast.success("Cuenta movida a la papelera");
      
    } catch (error) {
      console.error("Error inesperado al mover la cuenta a la papelera:", error);
      toast.error("Error inesperado al mover la cuenta a la papelera");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };
  
  // Función para cambiar el estado de la cuenta a revisión
  const moveToRevision = async () => {
    try {
      setIsChangingStatus(true);
      
      // Actualizar el estado de la cuenta a "revision" en la base de datos
      const { error } = await supabase
        .from('cuenta')
        .update({ 
          estado: 'revision',
          last_updated: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (error) {
        console.error("Error al mover la cuenta a revisión:", error);
        toast.error("Error al mover la cuenta a revisión");
        return;
      }
      
      // Registrar la acción en la auditoría
      if (userId) {
        await logAccountUpdate(userId, account.id, account.platform || "", account.correo, "estado a revisión");
      }
      
      // Actualizar la cuenta localmente
      const updatedAccount: Account = {
        ...account,
        estado: "revision" as AccountStatus,
        last_updated: new Date().toISOString()
      };
      
      // Llamar al callback proporcionado por el padre
      onAccountUpdated(updatedAccount);
      
      // Invalidar la caché para refrescar la lista de cuentas
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      toast.success("Cuenta movida a revisión");
      
    } catch (error) {
      console.error("Error inesperado al mover la cuenta a revisión:", error);
      toast.error("Error inesperado al mover la cuenta a revisión");
    } finally {
      setIsChangingStatus(false);
      setShowRevisionDialog(false);
    }
  };
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-card border-nytrix-purple/20">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Solo mostrar ciertas opciones según el estado */}
          {!isRented && (
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              Cambiar contraseña
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem>Ver detalles</DropdownMenuItem>
          
          {isAvailable && (
            <DropdownMenuItem 
              onClick={() => setShowRevisionDialog(true)}
            >
              Revisión
            </DropdownMenuItem>
          )}
          
          {!isRented && <DropdownMenuSeparator />}
          
          {/* Papelera solo para cuentas disponibles o en revisión */}
          {canMoveToTrash && (
            <DropdownMenuItem 
              className="text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Papelera
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <EditPasswordDialog 
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        account={account}
        onAccountUpdated={onAccountUpdated}
        userId={userId}
      />

      {/* Diálogo de confirmación para mover a papelera */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-nytrix-purple/20">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción moverá la cuenta a la papelera. Puedes restaurarla más tarde si es necesario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground"
              onClick={moveToTrash}
              disabled={isDeleting}
            >
              {isDeleting ? "Moviendo..." : "Mover a papelera"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de confirmación para mover a revisión */}
      <AlertDialog open={showRevisionDialog} onOpenChange={setShowRevisionDialog}>
        <AlertDialogContent className="bg-card border-nytrix-purple/20">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado de la cuenta a "En revisión".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-primary text-primary-foreground"
              onClick={moveToRevision}
              disabled={isChangingStatus}
            >
              {isChangingStatus ? "Cambiando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
