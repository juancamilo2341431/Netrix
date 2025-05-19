
import { TableCell, TableRow } from "@/components/ui/table";

export const TableLoadingState = () => {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-nytrix-purple border-t-transparent rounded-full mb-2"></div>
          <p className="text-lg font-medium">Cargando plataformas...</p>
        </div>
      </TableCell>
    </TableRow>
  );
};
