
import { TableCell, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

interface NoAccountsStateProps {
  searchTerm: string;
}

export const NoAccountsState = ({ searchTerm }: NoAccountsStateProps) => {
  return (
    <TableRow>
      <TableCell colSpan={6} className="text-center h-24">
        <div className="flex flex-col items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-lg font-medium">No se encontraron cuentas</p>
          <p className="text-muted-foreground">
            Ajusta los filtros o intenta con otra búsqueda
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
};
