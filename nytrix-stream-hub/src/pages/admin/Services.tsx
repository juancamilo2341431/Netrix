import { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { 
  TableRow, 
  TableCell, 
  TableHead, 
  Table, 
  TableHeader, 
  TableBody 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertTriangle, Package, User, Clock, DollarSign, Bell, Calendar, LoaderCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRentedAccounts, RentedAccountData } from "@/hooks/useRentedAccounts";
import { useRealtimeStatus } from "@/hooks/useRealtimeStatus";
import { Database } from "@/integrations/supabase/types";
import CreateRentalModal from "@/components/admin/rentals/CreateRentalModal";
import EditRentalModal from "@/components/admin/rentals/EditRentalModal";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function RentedAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStats, setShowStats] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<RentedAccountData | null>(null);
  const [notifyingRentalId, setNotifyingRentalId] = useState<number | null>(null);
  const [isNotifyingAll, setIsNotifyingAll] = useState(false);
  
  const { data: rentedAccounts, isLoading, error, refetch } = useRentedAccounts();
  
  const { updateRentalStates } = useRealtimeStatus();
  
  useEffect(() => {
    const handleManualRefresh = async () => {
      try {
        await updateRentalStates();
        await refetch();
      } catch (err) {
        console.error("Error en actualización manual:", err);
      }
    };
    
    // @ts-ignore
    window.__updateRentalStates = handleManualRefresh;
    
    return () => {
      // @ts-ignore
      delete window.__updateRentalStates;
    };
  }, [updateRentalStates, refetch]);

  const uniquePlatforms = useMemo(() => [
    "all", 
    ...new Set(
        rentedAccounts
            .map(acc => acc.platformName)
            .filter((name): name is string => name !== null && name !== 'N/A') 
            .sort((a, b) => a.localeCompare(b))
    )
  ], [rentedAccounts]);

  const filteredAccounts = useMemo(() => 
    rentedAccounts.filter(account => 
      (account.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       account.platformEmail?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (platformFilter === "all" || account.platformName === platformFilter)
  ), [rentedAccounts, searchTerm, platformFilter]);

  const getStatusColor = (status: Database["public"]["Enums"]["estado_renta"] | null) => {
    switch (status) {
      case "rentada":
        return "bg-green-500 text-white"; 
      case "vencida":
        return "bg-red-500 text-white";
      case "proximo": 
        return "bg-yellow-500 text-white"; 
      case "garantia":
        return "bg-blue-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };
  
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString.replace(' ', 'T') + 'Z').toLocaleDateString('es-ES', options); 
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return dateString; 
    }
  }
  
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        // Usar parseISO y format de date-fns para un manejo completo de la fecha
        const date = parseISO(dateString);
        return format(date, 'dd MMM yyyy HH:mm', { locale: es });
    } catch (e) {
        console.error("Error formatting datetime:", dateString, e);
        return 'Fecha inválida';
    }
  }

  const stats = useMemo(() => ({
      total: rentedAccounts.length,
      rentadas: rentedAccounts.filter(a => a.status === 'rentada').length,
      vencidas: rentedAccounts.filter(a => a.status === 'vencida').length,
      proximas: rentedAccounts.filter(a => a.status === 'proximo').length,
      garantia: rentedAccounts.filter(a => a.status === 'garantia').length
  }), [rentedAccounts]);

  const handleRentalCreated = () => {
    refetch();
  };

  const handleRentalUpdated = () => {
    refetch();
  };

  const handleNotifyUser = async (rental: RentedAccountData) => {
    if (rental.status !== 'proximo') {
      toast.warning("Solo se pueden enviar notificaciones para rentas próximas a vencer.");
      return;
    }

    if (!rental.userEmail && !rental.userPhone) {
        toast.error("No se encontró correo ni teléfono del usuario para notificar.");
        return;
    }

    setNotifyingRentalId(rental.id);
    const webhookUrl = "https://dmind-n8n.b0falx.easypanel.host/webhook/b1695411-4db1-47a8-8f47-319c616f3347"; // Considerar mover a .env

    const payload = {
      persona_nombre: rental.userName,
      persona_correo: rental.userEmail,
      persona_telefono: rental.userPhone,
      cuenta_correo: rental.platformEmail,
      plataforma_nombre: rental.platformName,
      renta_fecha_fin: rental.endDate ? format(parseISO(rental.endDate), 'PPP', { locale: es }) : 'N/A', // Formatear fecha fin
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Intentar leer el cuerpo del error si existe
        let errorBody = 'Respuesta no exitosa del servidor.';
        try {
            errorBody = await response.text(); // o response.json() si esperas JSON
        } catch (e) { /* Ignorar error al leer el cuerpo */ }
        throw new Error(`Error ${response.status}: ${errorBody}`);
      }

      // Asumiendo que el webhook responde con JSON si es exitoso (opcional)
      // const result = await response.json(); 
      // console.log("Webhook response:", result);

      toast.success(`Notificación enviada para ${rental.userName}`);

    } catch (err: any) {
      console.error("Error sending notification webhook:", err);
      toast.error("Error al enviar la notificación.", { description: err.message });
    } finally {
      setNotifyingRentalId(null); // Limpiar estado de carga
    }
  };

  const handleNotifyAll = async () => {
    const rentalsToNotify = rentedAccounts.filter(r => r.status === 'proximo');

    if (rentalsToNotify.length === 0) {
      toast.info("No hay rentas próximas a vencer para notificar.");
      return;
    }

    setIsNotifyingAll(true);
    const webhookUrl = "https://dmind-n8n.b0falx.easypanel.host/webhook/ddca95d9-4d4a-4b85-855a-4dcbbd95426a"; // Considerar mover a .env

    // Agrupar rentas por persona
    const groupedByPerson: Record<number, {
        persona_nombre: string | null;
        persona_correo: string | null;
        persona_telefono: string | null;
        rentas: { cuenta_correo: string | null; plataforma_nombre: string | null; renta_fecha_fin: string }[];
    }> = {};

    rentalsToNotify.forEach(rental => {
        if (!rental.personaId) return; // Saltar si no hay ID de persona

        if (!groupedByPerson[rental.personaId]) {
            groupedByPerson[rental.personaId] = {
                persona_nombre: rental.userName,
                persona_correo: rental.userEmail,
                persona_telefono: rental.userPhone,
                rentas: []
            };
        }

        groupedByPerson[rental.personaId].rentas.push({
            cuenta_correo: rental.platformEmail,
            plataforma_nombre: rental.platformName,
            renta_fecha_fin: rental.endDate ? format(parseISO(rental.endDate), 'P', { locale: es }) : 'N/A' // Formato corto: 01/06/2025
        });
    });

    // Convertir el objeto agrupado a un array
    const payload = Object.values(groupedByPerson);

    if (payload.length === 0) {
        toast.info("No se encontraron usuarios válidos para notificar.");
        setIsNotifyingAll(false);
        return;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            let errorBody = 'Respuesta no exitosa del servidor.';
            try {
                errorBody = await response.text();
            } catch (e) { /* Ignorar */ }
            throw new Error(`Error ${response.status}: ${errorBody}`);
        }

        toast.success(`${payload.length} usuario(s) notificado(s) exitosamente.`);

    } catch (err: any) {
        console.error("Error sending bulk notification webhook:", err);
        toast.error("Error al enviar las notificaciones masivas.", { description: err.message });
    } finally {
        setIsNotifyingAll(false);
    }

  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Cuentas Rentadas</h1>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
            </Button>
          </div>
        </div>

        {showStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium xl:text-sm">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold xl:text-xl">{isLoading ? <Skeleton className="h-8 w-1/2" /> : stats.total}</div>
              </CardContent>
            </Card>
            
            <Card className="border-green-500/30 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-green-600 xl:text-sm">Rentadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold xl:text-xl">{isLoading ? <Skeleton className="h-8 w-1/2" /> : stats.rentadas}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? <Skeleton className="h-4 w-3/4" /> : (stats.total > 0 ? ((stats.rentadas / stats.total) * 100).toFixed(0) : 0) + "% del total"}
                </div>
              </CardContent>
            </Card>
            
             <Card className="border-yellow-500/30 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-yellow-600 xl:text-sm">Próximas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold xl:text-xl">{isLoading ? <Skeleton className="h-8 w-1/2" /> : stats.proximas}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? <Skeleton className="h-4 w-3/4" /> : (stats.total > 0 ? ((stats.proximas / stats.total) * 100).toFixed(0) : 0) + "% del total"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/30 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-red-600 xl:text-sm">Vencidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold xl:text-xl">{isLoading ? <Skeleton className="h-8 w-1/2" /> : stats.vencidas}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? <Skeleton className="h-4 w-3/4" /> : (stats.total > 0 ? ((stats.vencidas / stats.total) * 100).toFixed(0) : 0) + "% del total"}
                </div>
              </CardContent>
            </Card>

             <Card className="border-blue-500/30 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-blue-600 xl:text-sm">Garantía</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold xl:text-xl">{isLoading ? <Skeleton className="h-8 w-1/2" /> : stats.garantia}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isLoading ? <Skeleton className="h-4 w-3/4" /> : (stats.total > 0 ? ((stats.garantia / stats.total) * 100).toFixed(0) : 0) + "% del total"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-grow w-full md:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nombre o correo..."
              className="pl-8 border-nytrix-purple/20 bg-background w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="w-full md:w-auto md:min-w-[180px]">
            <Select 
                value={platformFilter} 
                onValueChange={setPlatformFilter}
                disabled={isLoading}
            >
              <SelectTrigger className="border-nytrix-purple/20 bg-background">
                <SelectValue placeholder="Filtrar por plataforma" />
              </SelectTrigger>
              <SelectContent>
                {uniquePlatforms.map(platform => (
                  <SelectItem key={platform} value={platform}>
                    {platform === "all" ? "Todas las plataformas" : platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end">
             <Button
                variant="outline"
                className={`border-nytrix-purple text-nytrix-purple hover:bg-nytrix-purple/10 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isNotifyingAll ? 'animate-pulse' : ''
                }`}
                disabled={isLoading || isNotifyingAll || !rentedAccounts.some(r => r.status === 'proximo')}
                onClick={handleNotifyAll}
             >
                {isNotifyingAll ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Bell className="mr-2 h-4 w-4" />
                )}
                Notificar Próximos
             </Button>
             <Button 
                className="bg-gradient-nytrix hover:opacity-90"
                disabled={isLoading}
                onClick={() => setIsCreateModalOpen(true)}
             >
               <Plus className="mr-2 h-4 w-4" /> Crear Renta
             </Button>
          </div>
        </div>
        
        <div className="border border-nytrix-purple/20 rounded-lg overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card">
                <TableHead className="px-4 lg:px-3 xl:px-2">Usuario</TableHead>
                <TableHead className="px-4 lg:px-3 xl:px-2">Plataforma</TableHead>
                <TableHead className="hidden lg:table-cell lg:px-3 xl:px-2">Correo Plataforma</TableHead>
                <TableHead className="hidden md:table-cell md:px-3 lg:px-3 xl:px-2">Inicio</TableHead>
                <TableHead className="hidden md:table-cell md:px-3 lg:px-3 xl:px-2">Fin</TableHead>
                <TableHead className="hidden xl:table-cell xl:px-2">Días Rest.</TableHead>
                <TableHead className="hidden xl:table-cell xl:px-2">Precio Base</TableHead>
                <TableHead className="hidden 2xl:table-cell 2xl:px-2">Precio Cupón</TableHead>
                <TableHead className="hidden lg:table-cell lg:px-3 xl:px-2">Subtotal</TableHead>
                <TableHead className="px-4 lg:px-3 xl:px-2">Estado</TableHead>
                <TableHead className="hidden 2xl:table-cell 2xl:px-2">Últ. Act.</TableHead>
                <TableHead className="text-right px-4 lg:px-3 xl:px-2">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`}>
                    <TableCell className="px-4 lg:px-3 xl:px-2"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="px-4 lg:px-3 xl:px-2"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell lg:px-3 xl:px-2"><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell className="hidden md:table-cell md:px-3 lg:px-3 xl:px-2"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden md:table-cell md:px-3 lg:px-3 xl:px-2"><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="hidden xl:table-cell xl:px-2"><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell className="hidden xl:table-cell xl:px-2"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden 2xl:table-cell 2xl:px-2"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="hidden lg:table-cell lg:px-3 xl:px-2"><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="px-4 lg:px-3 xl:px-2"><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell className="hidden 2xl:table-cell 2xl:px-2"><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell className="text-right px-4 lg:px-3 xl:px-2"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                 <TableRow>
                   <TableCell colSpan={12} className="text-center py-12 text-red-600 px-4 lg:px-3 xl:px-2">
                      <div className="flex flex-col items-center justify-center">
                         <AlertTriangle className="h-10 w-10 mb-3" />
                         <p className="font-semibold">Error al cargar datos</p>
                         <p className="text-sm text-muted-foreground">{error.message}</p>
                         <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
                            Reintentar
                         </Button>
                      </div>
                   </TableCell>
                 </TableRow>
              ) : filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium px-4 lg:px-3 xl:px-2">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className="truncate" title={account.userName ?? ''}>{account.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 lg:px-3 xl:px-2">
                       <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-nytrix-purple flex-shrink-0" />
                         <span className="truncate" title={account.platformName ?? ''}>{account.platformName}</span>
                       </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground lg:px-3 xl:px-2">
                      <span className="truncate" title={account.platformEmail ?? ''}>{account.platformEmail}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell md:px-3 lg:px-3 xl:px-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                         <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"/>
                         {formatDate(account.startDate)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell md:px-3 lg:px-3 xl:px-2">
                      <div className="flex items-center text-sm text-muted-foreground">
                         <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"/>
                         {formatDate(account.endDate)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell xl:px-2">
                      <div className="flex items-center text-sm font-medium">
                        <Badge variant={account.remainingDays && account.remainingDays <= 7 ? "destructive" : "secondary"} className="text-xs">
                          {account.remainingDays !== null ? `${account.remainingDays} día(s)` : 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell xl:px-2">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-3.5 w-3.5 mr-1 text-green-600 flex-shrink-0"/>
                        {formatCurrency(account.basePrice)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell 2xl:px-2">
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-3.5 w-3.5 mr-1 text-red-500 flex-shrink-0"/>
                        {account.couponPrice ? `-${formatCurrency(account.couponPrice)}` : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell font-medium lg:px-3 xl:px-2">
                      <div className="flex items-center">
                        <DollarSign className="h-3.5 w-3.5 mr-1 text-blue-600 flex-shrink-0"/>
                        {formatCurrency(account.subtotal)}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 lg:px-3 xl:px-2">
                       <Badge className={`capitalize ${getStatusColor(account.status)}`}>
                          {account.status ?? 'N/A'}
                       </Badge>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell text-xs text-muted-foreground 2xl:px-2">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 flex-shrink-0"/>
                        {formatDateTime(account.last_updated)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-1 px-4 lg:px-3 xl:px-2">
                       <Button
                          variant="ghost"
                          size="icon"
                          className={`text-orange-500 hover:text-orange-600 h-8 w-8 disabled:opacity-50 disabled:cursor-not-allowed ${
                              notifyingRentalId === account.id ? 'animate-pulse' : ''
                          }`}
                          title={account.status === 'proximo' ? "Notificar Usuario" : "Notificación no disponible para este estado"}
                          disabled={isLoading || account.status !== 'proximo' || notifyingRentalId === account.id}
                          onClick={() => handleNotifyUser(account)}
                       >
                          {notifyingRentalId === account.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                              <Bell className="h-4 w-4" />
                          )}
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12 px-4 lg:px-3 xl:px-2">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-10 w-10 mb-3 text-muted-foreground" />
                      <p className="font-semibold">No se encontraron cuentas</p>
                      <p className="text-sm text-muted-foreground">
                        {rentedAccounts.length > 0 
                          ? "Prueba a cambiar los filtros de búsqueda o plataforma."
                          : "Aún no hay cuentas rentadas registradas."
                        }
                       </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateRentalModal
        isOpen={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onRentalCreated={handleRentalCreated}
      />

      <EditRentalModal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        rentalData={selectedRental}
        onRentalUpdated={handleRentalUpdated}
      />
    </AdminLayout>
  );
} 