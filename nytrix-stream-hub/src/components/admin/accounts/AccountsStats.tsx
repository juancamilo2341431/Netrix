import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAccounts } from "@/hooks/useAccounts";
import { Progress } from "@/components/ui/progress";

type PlatformStats = {
  name: string;
  total: number;
  disponible: number;
  alquilada: number;
  enTramite: number;
};

export const AccountsStats = () => {
  const { data: allAccounts = [] } = useAccounts();
  
  // Filtrar solo cuentas con estados relevantes: disponible, alquilada, tramite
  const accounts = useMemo(() => {
    return allAccounts.filter(account => 
      account.estado === "disponible" || 
      account.estado === "alquilada" || 
      account.estado === "tramite"
    );
  }, [allAccounts]);

  // Group accounts by platform and count by status
  const platformStats = useMemo(() => {
    const stats: Record<string, PlatformStats> = {};

    accounts.forEach((account) => {
      const platform = account.platform || "Sin plataforma";
      
      if (!stats[platform]) {
        stats[platform] = {
          name: platform,
          total: 0,
          disponible: 0,
          alquilada: 0,
          enTramite: 0,
        };
      }

      stats[platform].total += 1;

      // Count by status - Solo contar disponible, alquilada y tramite
      switch (account.estado) {
        case "disponible":
          stats[platform].disponible += 1;
          break;
        case "alquilada":
          stats[platform].alquilada += 1;
          break;
        case "tramite":
          stats[platform].enTramite += 1;
          break;
        default:
          break;
      }
    });

    // Convertir a array, ordenar por total de cuentas
    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [accounts]);

  // If there are no platforms with accounts, show a message
  if (platformStats.length === 0) {
    return null;
  }

  // Helper function to determine progress color based on the platform name
  const getProgressColor = (platform: string): string => {
    const platformColors: Record<string, string> = {
      "Netflix": "bg-red-500",
      "Disney+": "bg-blue-500",
      "HBO Max": "bg-purple-500",
      "Amazon Prime": "bg-blue-400",
      "YouTube Premium": "bg-red-600",
      "Paramount+": "bg-blue-700",
      "Hulu": "bg-green-500",
      "Peacock": "bg-green-400",
      "Apple TV+": "bg-gray-500"
    };

    return platformColors[platform] || "bg-primary";
  };

  return (
    <div className="mb-6 w-full">
      <h2 className="text-lg font-semibold mb-3">Resumen de cuentas por plataforma</h2>
      <ScrollArea className="w-full rounded-md border border-nytrix-purple/20">
        <div className="flex justify-center space-x-4 p-4">
          {platformStats.map((platform) => (
            <Card 
              key={platform.name} 
              className="w-72 border border-nytrix-purple/20 bg-card flex-shrink-0"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium">{platform.name}</h3>
                  <span className="text-lg font-semibold text-nytrix-purple">{platform.total}</span>
                </div>
                <div className="grid grid-cols-2 gap-y-2 mb-3">
                  <div>
                    <div className="text-sm font-medium">Disponible</div>
                    <div className="text-lg">{platform.disponible}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Alquilada</div>
                    <div className="text-lg">{platform.alquilada}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">En trámite</div>
                    <div className="text-lg">{platform.enTramite}</div>
                  </div>
                </div>
                <Progress 
                  className="h-2 mt-2" 
                  value={100} 
                  style={{ 
                    backgroundColor: getProgressColor(platform.name)
                  }}
                />
              </div>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-2.5 mt-1" />
      </ScrollArea>
    </div>
  );
};
