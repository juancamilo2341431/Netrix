import { Edit2, Save, X, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";

interface ProfileHeaderProps {
  editMode: boolean;
  updating: boolean;
  onEditClick: () => void;
  onCancelClick: () => void;
  onSaveClick: () => void;
}

export default function ProfileHeader({ 
  editMode, 
  updating, 
  onEditClick, 
  onCancelClick, 
  onSaveClick 
}: ProfileHeaderProps) {
  return (
    <div className="flex w-full justify-between items-center">
      <div>
        <CardTitle className="text-xl font-semibold">Información Personal</CardTitle>
        <CardDescription>Detalles de tu cuenta de usuario</CardDescription>
      </div>
      <div className="ml-auto">
        {!editMode ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEditClick}
            className="text-nytrix-purple border-nytrix-purple/30 hover:bg-nytrix-purple/10"
          >
            <Edit2 className="mr-2 h-4 w-4" /> Editar
          </Button>
        ) : (
          <div className="hidden sm:flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancelClick}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSaveClick}
              disabled={updating}
              className="text-green-600 border-green-600/30 hover:bg-green-600/10"
            >
              {updating ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
