
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { 
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface PlatformImageProps {
  imageUrl: string | null;
  altText: string;
}

export const PlatformImage = ({ imageUrl, altText }: PlatformImageProps) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  
  if (!imageUrl) {
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
        <ImageOff className="h-5 w-5 text-gray-400" />
      </div>
    );
  }

  return (
    <>
      <div className="relative w-12 h-12 rounded-md overflow-hidden cursor-pointer" onClick={() => setImageModalOpen(true)}>
        <img 
          src={imageUrl} 
          alt={altText || 'Plataforma'} 
          className="object-cover w-full h-full"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            // Find the next sibling and set its display to flex
            const nextSibling = target.nextElementSibling as HTMLElement | null;
            if (nextSibling) {
              nextSibling.style.display = 'flex';
            }
          }}
        />
        <div 
          className="absolute inset-0 bg-gray-100 items-center justify-center hidden"
          style={{ display: 'none' }}
        >
          <ImageOff className="h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Modal para mostrar imagen ampliada */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-xl flex flex-col items-center justify-center p-1">
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt={altText || 'Plataforma'} 
              className="max-h-[80vh] max-w-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
