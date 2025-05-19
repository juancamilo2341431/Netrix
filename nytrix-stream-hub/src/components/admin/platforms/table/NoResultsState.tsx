
import { TableCell, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

interface NoResultsStateProps {
  searchTerm: string;
}

export const NoResultsState = ({ searchTerm }: NoResultsStateProps) => {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center">
          <Search className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-lg font-medium">No se encontraron plataformas</p>
          {searchTerm ? (
            <p className="text-muted-foreground">
              No hay resultados para "{searchTerm}"
            </p>
          ) : (
            <p className="text-muted-foreground">
              No hay plataformas registradas
            </p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
