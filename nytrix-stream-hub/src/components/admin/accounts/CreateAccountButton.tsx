import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateAccountDialog } from "./CreateAccountDialog";
import { Account } from "./AccountsTable";

interface CreateAccountButtonProps {
  onAccountCreated: (account: Account) => void;
  platforms: { id: number; nombre: string }[];
  userId?: number | null;
}

export const CreateAccountButton = ({ onAccountCreated, platforms, userId = null }: CreateAccountButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setDialogOpen(true)}
        className="bg-gradient-nytrix hover:opacity-90"
      >
        <Plus className="mr-2 h-4 w-4" /> Nueva Cuenta
      </Button>

      <CreateAccountDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAccountCreated={onAccountCreated}
        platforms={platforms}
        userId={userId}
      />
    </>
  );
};
