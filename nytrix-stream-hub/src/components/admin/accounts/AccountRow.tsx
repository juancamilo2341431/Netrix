import { useState } from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AccountActions } from "./AccountActions";
import { Account } from "./AccountsTable";
import { format } from "date-fns";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AccountRowProps {
  account: Account;
  onAccountUpdated?: (updatedAccount: Account) => void;
  userId?: number | null;
}

export const AccountRow = ({ account, onAccountUpdated, userId = null }: AccountRowProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "disponible":
        return "bg-green-500 text-white";
      case "alquilada":
        return "bg-blue-500 text-white";
      case "revision":
        return "bg-yellow-500 text-white";
      case "tramite":
        return "bg-orange-500 text-white";
      case "papelera":
        return "bg-red-400 text-white";
      case "eliminada":
        return "bg-red-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case "disponible":
        return "Disponible";
      case "alquilada":
        return "Alquilada";
      case "revision":
        return "En revisión";
      case "tramite":
        return "En trámite";
      case "papelera":
        return "En papelera";
      case "eliminada":
        return "Eliminada";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <TableRow>
      <TableCell>{formatDate(account.created_at)}</TableCell>
      <TableCell className="font-medium">{account.platform}</TableCell>
      <TableCell>{account.correo}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-800 rounded-md text-xs font-mono">
            {showPassword ? account.contrasenia : "••••••••"}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={showPassword ? "default" : "ghost"}
                  size="icon" 
                  onClick={togglePasswordVisibility}
                  className="h-6 w-6"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(account.estado)}>
          {getStatusText(account.estado)}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(account.last_updated)}</TableCell>
      <TableCell>
        <AccountActions account={account} onAccountUpdated={onAccountUpdated} userId={userId} />
      </TableCell>
    </TableRow>
  );
};
