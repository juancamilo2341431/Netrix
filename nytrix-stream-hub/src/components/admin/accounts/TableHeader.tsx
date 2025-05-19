
import { TableRow, TableHead } from "@/components/ui/table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { SortField, SortDirection } from "@/hooks/useSortableTable";

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
          onClick={() => handleSortClick('platform')}
        >
          Plataforma
          {renderSortIcon('platform')}
        </div>
      </TableHead>
      <TableHead>
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => handleSortClick('correo')}
        >
          Correo
          {renderSortIcon('correo')}
        </div>
      </TableHead>
      <TableHead>Contraseña</TableHead>
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
          onClick={() => handleSortClick('last_updated')}
        >
          Última actualización
          {renderSortIcon('last_updated')}
        </div>
      </TableHead>
      <TableHead className="w-[80px]">Acciones</TableHead>
    </TableRow>
  );
};
