import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreatePlatformDialog } from "../CreatePlatformDialog";

interface CreatePlatformButtonProps {
  onPlatformCreated: () => void;
  userId?: number | null;
}

export const CreatePlatformButton = ({ onPlatformCreated, userId }: CreatePlatformButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)}
        className="bg-gradient-nytrix hover:opacity-90"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nueva Plataforma
      </Button>

      <CreatePlatformDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={onPlatformCreated}
        userId={userId}
      />
    </>
  );
};
