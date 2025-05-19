
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { AuditLog } from "@/hooks/useAuditLogs";
import { Badge } from "@/components/ui/badge";

interface AuditoriaTableProps {
  logs: AuditLog[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
}

export function AuditoriaTable({ logs, isLoading, error, searchTerm }: AuditoriaTableProps) {
  // Sorting state
  const [sortField, setSortField] = useState<keyof AuditLog>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle sort column click
  const handleSort = (field: keyof AuditLog) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (log.acccion && log.acccion.toLowerCase().includes(searchLower)) ||
      (log.user_name && log.user_name.toLowerCase().includes(searchLower))
    );
  });

  // Sort logs
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (sortField === "created_at") {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    }
    
    if (sortField === "id") {
      return sortDirection === "asc" ? a.id - b.id : b.id - a.id;
    }
    
    if (a[sortField] === null) return sortDirection === "asc" ? -1 : 1;
    if (b[sortField] === null) return sortDirection === "asc" ? 1 : -1;
    
    const valA = String(a[sortField]).toLowerCase();
    const valB = String(b[sortField]).toLowerCase();
    
    return sortDirection === "asc" 
      ? valA.localeCompare(valB) 
      : valB.localeCompare(valA);
  });

  if (isLoading) {
    return <div className="text-center py-4">Cargando registros de auditoría...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">Error al cargar registros: {error.message}</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center py-4">No hay registros de auditoría disponibles.</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead 
              className="w-[80px] cursor-pointer"
              onClick={() => handleSort("id")}
            >
              ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("acccion")}
            >
              Acción {sortField === "acccion" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("user_name")}
            >
              Usuario {sortField === "user_name" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort("created_at")}
            >
              Fecha {sortField === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.id}</TableCell>
              <TableCell>
                <div className="font-medium">
                  {log.acccion}
                </div>
              </TableCell>
              <TableCell>{log.user_name}</TableCell>
              <TableCell>
                {format(new Date(log.created_at), "PPpp", { locale: es })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
