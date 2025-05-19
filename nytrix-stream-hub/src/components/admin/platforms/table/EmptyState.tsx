
import { TableCell, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

export interface EmptyStateProps {
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
}

export const EmptyState = ({ isLoading, error, searchTerm }: EmptyStateProps) => {
  if (isLoading) {
    return (
      <div className="rounded-md border border-input p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-nytrix-purple border-t-transparent rounded-full mb-2"></div>
          <p className="text-lg font-medium">Cargando plataformas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-input p-8">
        <div className="flex flex-col items-center justify-center">
          <p className="text-lg font-medium text-red-500">Error al cargar plataformas</p>
          <p className="text-muted-foreground">
            {error.message || 'Intente recargar la página'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-input p-8">
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
    </div>
  );
};
