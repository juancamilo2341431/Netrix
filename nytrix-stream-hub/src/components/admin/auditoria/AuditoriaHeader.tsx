import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuditLogs } from "@/hooks/useAuditLogs";

export function AuditoriaHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoría</h1>
        <p className="text-muted-foreground">
          Registro detallado de las acciones realizadas en el sistema.
        </p>
      </div>
    </div>
  );
}
