import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Platform } from "@/types/platform";
import { PlatformFormValues } from "./platform-schema";
import { PlatformForm } from "./PlatformForm";
import { logPlatformUpdate } from "@/utils/platformAuditLogger";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditPlatformDialogProps {
  platform: Platform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlatformUpdated: () => void;
  userId?: number | null;
}

export const EditPlatformDialog = ({ 
  platform, 
  open, 
  onOpenChange, 
  onPlatformUpdated,
  userId
}: EditPlatformDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PlatformFormValues, imageFile: File | null) => {
    setIsSubmitting(true);
    
    try {
      // Prepare update data
      const updateData: Partial<Platform> = {
        nombre: data.nombre,
        descripcion: data.descripcion || null,
        precio: data.precio || null,
        last_updated: new Date().toISOString()
      };
      
      // Handle image upload if a new image is provided
      if (imageFile) {
        // If there's an existing image, delete it first
        if (platform.imagen) {
          try {
            // Extract just the filename from the URL
            const fullUrl = platform.imagen;
            const filename = fullUrl.substring(fullUrl.lastIndexOf('/') + 1);
            
            console.log("Attempting to delete old image filename:", filename);
            
            // Delete the old image from storage
            const { error: deleteError } = await supabase.storage
              .from("image-platform")
              .remove([filename]);
              
            if (deleteError) {
              console.error("Error deleting old image:", deleteError);
              // Continue with upload even if deletion fails
            } else {
              console.log("Successfully deleted old image:", filename);
            }
          } catch (deleteErr) {
            console.error("Exception when trying to delete old image:", deleteErr);
            // Continue with upload even if deletion fails
          }
        }
        
        // Upload new image
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `${platform.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("image-platform")
          .upload(filePath, imageFile);
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from("image-platform")
          .getPublicUrl(filePath);
          
        updateData.imagen = publicUrl;
      }
      
      // Update platform in the database
      const { error } = await supabase
        .from("plataforma")
        .update(updateData)
        .eq("id", platform.id);
        
      if (error) throw error;
      
      // Preparar objeto con los cambios para el registro de auditoría
      const changes = {
        nombre: data.nombre !== platform.nombre ? `${platform.nombre || 'Sin nombre'} → ${data.nombre}` : undefined,
        descripcion: data.descripcion !== platform.descripcion ? `${platform.descripcion || 'Sin descripción'} → ${data.descripcion || 'Sin descripción'}` : undefined,
        precio: data.precio !== platform.precio ? `${platform.precio || '0'} → ${data.precio || '0'}` : undefined,
        imagen: imageFile ? 'Se actualizó la imagen' : undefined
      };
      
      // Comprobar si hay cambios que registrar
      const hasChanges = Object.values(changes).some(value => value !== undefined);
      
      // Usar la nueva función de auditoría específica solo si hay cambios
      if (hasChanges && userId) {
        await logPlatformUpdate(
          userId,
          platform.id,
          platform.nombre || 'Sin nombre',
          changes
        );
      }
      
      toast.success("Plataforma actualizada con éxito");
      onPlatformUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating platform:", error);
      toast.error("Error al actualizar la plataforma");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar plataforma</DialogTitle>
        </DialogHeader>
        <PlatformForm 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting}
          defaultValues={{
            nombre: platform.nombre || "",
            descripcion: platform.descripcion || "",
            precio: platform.precio || ""
          }}
          currentImageUrl={platform.imagen}
        />
      </DialogContent>
    </Dialog>
  );
};
