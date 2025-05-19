import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logPlatformCreation } from "@/utils/platformAuditLogger";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PlatformForm } from "./PlatformForm";
import { type PlatformFormValues } from "./platform-schema";

interface CreatePlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId?: number | null;
}

export const CreatePlatformDialog = ({
  open,
  onOpenChange,
  onSuccess,
  userId
}: CreatePlatformDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PlatformFormValues, imageFile: File | null) => {
    setIsSubmitting(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileName = `platform-${Date.now()}.webp`;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('image-platform')
          .upload(fileName, imageFile);
          
        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          toast.error("Error al subir la imagen");
          return;
        }
        
        // Get public URL for the uploaded image
        const { data: { publicUrl } } = supabase
          .storage
          .from('image-platform')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      // Save platform data to database
      const { data: insertData, error: insertError } = await supabase
        .from('plataforma')
        .insert({
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio: data.precio,
          imagen: imageUrl,
          estado: 'mostrar'
        })
        .select('id, nombre')
        .single();

      if (insertError) {
        console.error("Error creating platform:", insertError);
        toast.error("Error al crear la plataforma");
        return;
      }

      // Registrar la acción en la auditoría usando la nueva función
      await logPlatformCreation(
        userId,
        insertData.id,
        data.nombre,
        data.precio || "N/A"
      );

      toast.success("Plataforma creada correctamente");
      
      // Close dialog and refresh data
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating platform:", error);
      toast.error("Error al crear la plataforma");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nueva Plataforma</DialogTitle>
          <DialogDescription>
            Complete el formulario. La imagen debe ser WEBP y menor a 100KB.
          </DialogDescription>
        </DialogHeader>
        
        <PlatformForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </DialogContent>
    </Dialog>
  );
};
