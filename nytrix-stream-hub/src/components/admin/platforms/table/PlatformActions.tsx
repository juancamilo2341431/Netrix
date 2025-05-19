import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { EditPlatformDialog } from "../EditPlatformDialog";
import { Platform } from "@/types/platform";
import { PlatformVisibilityDialog } from "./PlatformVisibilityDialog";

interface PlatformActionsProps {
  platform: Platform;
  onPlatformUpdated: () => void;
  userId?: number | null;
}

export const PlatformActions = ({ platform, onPlatformUpdated, userId }: PlatformActionsProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  
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
          <DropdownMenuItem onClick={() => setEditModalOpen(true)}>Editar</DropdownMenuItem>
          <DropdownMenuItem>Ver cuentas</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setHideDialogOpen(true)}
            className={platform.estado === 'ocultar' ? "text-green-600" : "text-destructive"}
          >
            {platform.estado === 'ocultar' ? 'Mostrar' : 'Ocultar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Modal de edición */}
      <EditPlatformDialog 
        platform={platform}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onPlatformUpdated={onPlatformUpdated}
        userId={userId}
      />
      
      {/* Confirmation dialog for hiding/showing platform */}
      <PlatformVisibilityDialog
        platform={platform}
        open={hideDialogOpen}
        onOpenChange={setHideDialogOpen}
        onPlatformUpdated={onPlatformUpdated}
        userId={userId}
      />
    </>
  );
};
