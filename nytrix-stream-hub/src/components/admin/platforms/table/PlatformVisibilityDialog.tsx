import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Platform } from "@/types/platform";
import { logPlatformVisibilityChange } from "@/utils/platformAuditLogger";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface PlatformVisibilityDialogProps {
  platform: Platform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlatformUpdated: () => void;
  userId?: number | null;
}

export const PlatformVisibilityDialog = ({
  platform,
  open,
  onOpenChange,
  onPlatformUpdated,
  userId
}: PlatformVisibilityDialogProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Function to toggle platform visibility
  const togglePlatformVisibility = async () => {
    setIsUpdating(true);
    
    // Determine new status - toggle between 'mostrar' and 'ocultar'
    const newStatus = platform.estado === 'mostrar' ? 'ocultar' : 'mostrar';
    
    try {
      // Update platform status in the database
      const { error } = await supabase
        .from("plataforma")
        .update({ estado: newStatus })
        .eq("id", platform.id);
        
      if (error) throw error;
      
      // Usar la nueva función de auditoría específica
      await logPlatformVisibilityChange(
        userId, 
        platform.id,
        platform.nombre,
        platform.estado,
        newStatus
      );
      
      // Show success message
      toast.success(`Plataforma ${newStatus === 'ocultar' ? 'ocultada' : 'visible'} con éxito`);
      
      // Refresh the platforms list
      onPlatformUpdated();
    } catch (error) {
      console.error("Error updating platform status:", error);
      toast.error("Error al actualizar el estado de la plataforma");
    } finally {
      setIsUpdating(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {platform.estado === 'mostrar' ? 'Ocultar plataforma' : 'Mostrar plataforma'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {platform.estado === 'mostrar' 
              ? '¿Estás seguro de que quieres ocultar esta plataforma? No será visible para los usuarios.'
              : '¿Estás seguro de que quieres hacer visible esta plataforma? Será visible para todos los usuarios.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={togglePlatformVisibility}
            disabled={isUpdating}
            className={platform.estado === 'ocultar' ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
          >
            {isUpdating ? 'Procesando...' : platform.estado === 'ocultar' ? 'Mostrar' : 'Ocultar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
