
import { TableCell, TableRow } from "@/components/ui/table";

interface TableErrorStateProps {
  error: Error;
}

export const TableErrorState = ({ error }: TableErrorStateProps) => {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-24 text-center">
        <div className="flex flex-col items-center justify-center">
          <p className="text-lg font-medium text-red-500">Error al cargar plataformas</p>
          <p className="text-muted-foreground">
            {error.message || 'Intente recargar la página'}
          </p>
        </div>
      </TableCell>
    </TableRow>
  );
};
