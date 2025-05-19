import { useState, useEffect, useMemo } from "react";
import { Toaster } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { AuditoriaHeader } from "@/components/admin/auditoria/AuditoriaHeader";
import { AuditoriaSearch } from "@/components/admin/auditoria/AuditoriaSearch";
import { AuditoriaTable } from "@/components/admin/auditoria/AuditoriaTable";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Users, Calendar, Activity, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Logs() {
  const { data: logs, isLoading, error } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [showStats, setShowStats] = useState(false);
  
  useEffect(() => {
    if (logs && logs.length > 0) {
      setLastUpdate(new Date());
    }
  }, [logs]);

  // Cálculo de estadísticas para la auditoría
  const stats = useMemo(() => {
    if (!logs || logs.length === 0) {
      return {
        total: 0,
        userCounts: [],
        earliestDate: null,
        latestDate: null
      };
    }

    // Conteo por usuario
    const userCountMap: Record<string, number> = {};
    logs.forEach(log => {
      const userName = log.user_name || "Usuario desconocido";
      userCountMap[userName] = (userCountMap[userName] || 0) + 1;
    });

    // Ordenar usuarios por cantidad de acciones (descendente)
    const sortedUsers = Object.entries(userCountMap)
      .sort((a, b) => b[1] - a[1]);

    // Obtener primera y última fecha
    const dates = logs.map(log => new Date(log.created_at)).sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = dates.length > 0 ? dates[0] : null;
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;

    return {
      total: logs.length,
      userCounts: sortedUsers,
      earliestDate,
      latestDate
    };
  }, [logs]);

  // Formatear fecha con localización
  const formatDateLocale = (date: Date | null) => {
    if (!date) return "N/A";
    return format(date, "d 'de' MMMM, yyyy, HH:mm", { locale: es });
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <AuditoriaHeader />
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
            </Button>
            <Badge variant="outline" className="bg-card border-nytrix-purple/20 flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin text-nytrix-purple" />
              <span className="text-xs">Actualización en tiempo real</span>
            </Badge>
          </div>
        </div>

        {/* Estadísticas de auditoría */}
        {showStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total de registros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Acciones registradas en el sistema
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Usuarios más activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.userCounts.slice(0, 2).map(([userName, count]) => (
                    <div key={userName} className="flex justify-between items-center">
                      <span className="text-sm truncate max-w-[70%]">{userName}</span>
                      <Badge variant="outline" className="bg-background">{count}</Badge>
                    </div>
                  ))}
                  {stats.userCounts.length === 0 && (
                    <span className="text-sm text-muted-foreground">No hay datos</span>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Acción más antigua</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDateLocale(stats.earliestDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Acción más reciente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDateLocale(stats.latestDate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <AuditoriaSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <AuditoriaTable 
          logs={logs || []} 
          isLoading={isLoading} 
          error={error as Error | null} 
          searchTerm={searchTerm}
        />
      </div>
      <Toaster position="top-right" />
    </AdminLayout>
  );
}
