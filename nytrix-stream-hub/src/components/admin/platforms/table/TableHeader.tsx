
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead, TableRow } from "@/components/ui/table";

export type SortField = 'nombre' | 'precio' | 'descripcion' | 'estado' | 'created_at' | 'last_updated';
export type SortDirection = 'asc' | 'desc';

interface TableHeaderProps {
  sortField: SortField;
  sortDirection: SortDirection;
  handleSortClick: (field: SortField) => void;
}

export const TableHeader = ({ 
  sortField, 
  sortDirection, 
  handleSortClick 
}: TableHeaderProps) => {
  
  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (field !== sortField) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="ml-1 h-4 w-4" /> : 
      <ArrowDown className="ml-1 h-4 w-4" />;
  };
  
  return (
    <TableRow>
      <TableHead>Imagen</TableHead>
      <TableHead>
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSortClick('nombre')}
        >
          Nombre
          {renderSortIcon('nombre')}
        </div>
      </TableHead>
      <TableHead className="text-right">
        <div 
          className="flex items-center justify-end cursor-pointer" 
          onClick={() => handleSortClick('precio')}
        >
          Precio
          {renderSortIcon('precio')}
        </div>
      </TableHead>
      <TableHead>
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSortClick('descripcion')}
        >
          Descripción
          {renderSortIcon('descripcion')}
        </div>
      </TableHead>
      <TableHead>
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSortClick('estado')}
        >
          Estado
          {renderSortIcon('estado')}
        </div>
      </TableHead>
      <TableHead>
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSortClick('created_at')}
        >
          Creado
          {renderSortIcon('created_at')}
        </div>
      </TableHead>
      <TableHead>
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSortClick('last_updated')}
        >
          Actualizado
          {renderSortIcon('last_updated')}
        </div>
      </TableHead>
      <TableHead className="w-[80px]"></TableHead>
    </TableRow>
  );
};
