
import { useState, useEffect } from "react";
import { UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { FormLabel } from "@/components/ui/form";

interface PlatformImageUploadProps {
  imageFile: File | null;
  setImageFile: (file: File | null) => void;
  currentImageUrl?: string | null;
}

export const PlatformImageUpload = ({ 
  imageFile, 
  setImageFile, 
  currentImageUrl = null 
}: PlatformImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (imageFile) {
      setPreviewUrl(URL.createObjectURL(imageFile));
      return () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      };
    } else if (currentImageUrl) {
      setPreviewUrl(currentImageUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile, currentImageUrl]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate image size (100KB = 102400 bytes)
    if (file.size > 102400) {
      toast.error("La imagen debe ser menor a 100KB");
      event.target.value = "";
      return;
    }

    // Validate image format (WEBP)
    if (!file.type.includes("webp")) {
      toast.error("La imagen debe estar en formato WEBP");
      event.target.value = "";
      return;
    }

    setImageFile(file);
  };

  return (
    <div className="space-y-2">
      <FormLabel>Imagen (WEBP, &lt; 100KB)</FormLabel>
      <div className="relative border border-input bg-background rounded-md p-4 flex flex-col items-center justify-center gap-2 h-32">
        {previewUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="h-16 w-auto object-contain"
            />
            <span className="text-xs text-muted-foreground">
              {imageFile ? imageFile.name : "Imagen actual"}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Clic para cargar o arrastre WEBP (Max 100KB)</p>
          </div>
        )}
        <input
          type="file"
          accept=".webp"
          onChange={handleImageChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
      </div>
    </div>
  );
};
