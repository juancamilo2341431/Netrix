import { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { usePlatforms } from "@/hooks/usePlatforms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TableRow, TableCell, TableHead, Table, TableHeader, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CheckCircle, X, Check, AlertTriangle, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { es } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { logAccountUpdate } from "@/utils/accountAuditLogger";
import { useAuth } from "@/contexts/AuthContext";

export default function Review() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const { user } = useAuth();
  
  // Get queryClient for invalidating queries
  const queryClient = useQueryClient();
  
  // Fetch accounts data from Supabase
  // Este hook ya incluye suscripción en tiempo real a la tabla 'cuenta'
  const { data: allAccounts = [], isLoading, error } = useAccounts();

  // Filter accounts to show only those in "revision" state
  const accounts = useMemo(() => 
    allAccounts.filter(account => account.estado === "revision"),
    [allAccounts]
  );
  
  // Filter accounts based on search term and platform
  const filteredAccounts = useMemo(() => 
    accounts.filter(account => {
      const matchesSearch = 
        (account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        account.correo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform = filterPlatform === "all" || account.platform === filterPlatform;
      
      return matchesSearch && matchesPlatform;
    }),
    [accounts, searchTerm, filterPlatform]
  );
  
  // Get selected accounts details for showing in modal
  const selectedAccountsDetails = useMemo(() => 
    filteredAccounts.filter(account => selectedAccounts.includes(account.id)),
    [filteredAccounts, selectedAccounts]
  );
  
  // Get unique platforms from accounts for filtering
  const platforms = useMemo(() => 
    Array.from(new Set(accounts.map(account => account.platform || "")))
      .filter(platform => platform !== "")
      .sort((a, b) => a.localeCompare(b)),
    [accounts]
  );

  // Calculate stats for the dashboard
  const stats = useMemo(() => {
    // Group accounts by platform
    const platformCounts: Record<string, number> = {};
    
    accounts.forEach(account => {
      const platform = account.platform || "Desconocido";
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
    
    // Sort by count (descending)
    const sortedPlatforms = Object.entries(platformCounts)
      .sort((a, b) => b[1] - a[1]);
    
    // Get earliest and latest dates
    const dates = accounts.map(acc => new Date(acc.created_at)).sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = dates.length > 0 ? dates[0] : null;
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
    
    return {
      total: accounts.length,
      platformCounts: sortedPlatforms,
      earliestDate,
      latestDate,
      selectedCount: selectedAccounts.length,
    };
  }, [accounts, selectedAccounts]);

  // Function to handle checkbox toggle
  const handleCheckboxToggle = (accountId: number) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  // Function to select/deselect all accounts
  const handleSelectAll = () => {
    if (selectedAccounts.length === filteredAccounts.length) {
      // If all are selected, deselect all
      setSelectedAccounts([]);
    } else {
      // Otherwise, select all filtered accounts
      setSelectedAccounts(filteredAccounts.map(account => account.id));
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  // Function to format date with locale
  const formatDateLocale = (date: Date | null) => {
    if (!date) return "N/A";
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "revision":
        return "bg-yellow-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Obtener el ID del usuario autenticado
  useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("persona")
          .select("id")
          .eq("id_user", user.id)
          .single();
          
        if (data && !error) {
          setUserId(data.id);
        }
      }
    };
    
    fetchUserId();
  }, [user]);

  // Función para aprobar cuentas (cambiar estado a "disponible")
  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      
      // Verificar que hay cuentas seleccionadas
      if (selectedAccounts.length === 0) {
        toast.error("No hay cuentas seleccionadas para aprobar");
        return;
      }

      // Aprobar las cuentas seleccionadas (cambiar estado a disponible)
      const { error } = await supabase
        .from('cuenta')
        .update({ 
          estado: 'disponible',
          last_updated: new Date().toISOString()
        })
        .in('id', selectedAccounts);

      if (error) {
        console.error("Error al aprobar cuentas:", error);
        toast.error("Error al aprobar cuentas");
        return;
      }

      // Registrar la acción en la auditoría
      if (userId) {
        for (const accountId of selectedAccounts) {
          const account = accounts.find(a => a.id === accountId);
          if (account) {
            await logAccountUpdate(userId, accountId, account.platform || "", account.correo, "estado a disponible");
          }
        }
      }

      // Actualizar la caché para refrescar la UI
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      toast.success(`Se aprobaron ${selectedAccounts.length} cuentas`);
      setShowApproveModal(false);
      setSelectedAccounts([]);
      
    } catch (error) {
      console.error("Error inesperado al aprobar cuentas:", error);
      toast.error("Error inesperado al aprobar cuentas");
    } finally {
      setIsProcessing(false);
    }
  };

  // Función para rechazar cuentas (cambiar estado a "papelera")
  const handleReject = async () => {
    try {
      setIsProcessing(true);
      
      // Verificar que hay cuentas seleccionadas
      if (selectedAccounts.length === 0) {
        toast.error("No hay cuentas seleccionadas para rechazar");
        return;
      }

      // Rechazar las cuentas seleccionadas (cambiar estado a papelera)
      const { error } = await supabase
        .from('cuenta')
        .update({ 
          estado: 'papelera',
          last_updated: new Date().toISOString()
        })
        .in('id', selectedAccounts);

      if (error) {
        console.error("Error al rechazar cuentas:", error);
        toast.error("Error al rechazar cuentas");
        return;
      }

      // Registrar la acción en la auditoría
      if (userId) {
        for (const accountId of selectedAccounts) {
          const account = accounts.find(a => a.id === accountId);
          if (account) {
            await logAccountUpdate(userId, accountId, account.platform || "", account.correo, "estado a papelera");
          }
        }
      }

      // Actualizar la caché para refrescar la UI
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      
      toast.success(`Se rechazaron ${selectedAccounts.length} cuentas`);
      setShowRejectModal(false);
      setSelectedAccounts([]);
      
    } catch (error) {
      console.error("Error inesperado al rechazar cuentas:", error);
      toast.error("Error inesperado al rechazar cuentas");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Revisar Cuentas</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
          </Button>
        </div>
        
        {/* Estadísticas de revisión */}
        {showStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total en revisión</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.selectedCount > 0 && `${stats.selectedCount} seleccionadas`}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Plataformas principales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.platformCounts.slice(0, 2).map(([platform, count]) => (
                    <div key={platform} className="flex justify-between items-center">
                      <span className="text-sm">{platform}</span>
                      <Badge variant="outline" className="bg-background">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Primera cuenta</CardTitle>
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
                <CardTitle className="text-base font-medium">Última cuenta</CardTitle>
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
        
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cuentas..."
              className="pl-8 border-nytrix-purple/20 bg-background w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-[180px] border-nytrix-purple/20 bg-background">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent className="bg-card border-nytrix-purple/20">
              <SelectItem value="all">Todas las plataformas</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {filteredAccounts.length} cuenta{filteredAccounts.length !== 1 ? 's' : ''} encontrada{filteredAccounts.length !== 1 ? 's' : ''}
          </div>
          
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0
                      ? "Deseleccionar todo"
                      : "Seleccionar todo"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Seleccionar todas las cuentas visibles</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApproveModal(true)}
                    disabled={selectedAccounts.length === 0 || isProcessing}
                    className="border-green-600/30 text-green-600 hover:text-green-700 hover:bg-green-50/50"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Aprobar las cuentas seleccionadas</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowRejectModal(true)}
                    disabled={selectedAccounts.length === 0 || isProcessing}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rechazar y mover las cuentas seleccionadas a papelera</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="border border-nytrix-purple/20 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card">
                <TableHead className="w-[30px]">
                  <Checkbox 
                    checked={selectedAccounts.length === filteredAccounts.length && filteredAccounts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Plataforma</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Contraseña</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última actualización</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-nytrix-purple"></div>
                      <span className="ml-2">Cargando cuentas...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-destructive">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                    Error al cargar las cuentas. Por favor, intenta de nuevo.
                  </TableCell>
                </TableRow>
              ) : filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} className="group">
                    <TableCell>
                      <Checkbox 
                        checked={selectedAccounts.includes(account.id)}
                        onCheckedChange={() => handleCheckboxToggle(account.id)}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {formatDate(account.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {account.platform}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate" title={account.correo}>
                      {account.correo}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className="px-2 py-1 bg-gray-800 rounded-md">
                        {account.contrasenia}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(account.estado)}>
                        En revisión
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        {formatDate(account.last_updated)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No hay cuentas en revisión que coincidan con tu búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de confirmación para aprobar */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent className="sm:max-w-md bg-card border-nytrix-purple/20">
          <DialogHeader>
            <DialogTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>¿Estás seguro de aprobar estas cuentas?</span>
            </DialogTitle>
            <DialogDescription>
              Esta acción cambiará el estado de las siguientes cuentas a <span className="font-bold text-green-600">"disponible"</span> y estarán listas para ser utilizadas.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-72 mt-4 overflow-auto">
            <div className="space-y-2">
              {selectedAccountsDetails.map(account => (
                <div key={account.id} className="p-2 border border-border rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{account.platform}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(account.created_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{account.correo}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowApproveModal(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              variant="default"
              onClick={handleApprove}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {isProcessing ? 'Procesando...' : `Aprobar (${selectedAccounts.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para rechazar */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="sm:max-w-md bg-card border-nytrix-purple/20">
          <DialogHeader>
            <DialogTitle className="flex items-center text-destructive">
              <X className="h-5 w-5 mr-2" />
              <span>¿Estás seguro de rechazar estas cuentas?</span>
            </DialogTitle>
            <DialogDescription>
              Esta acción cambiará el estado de las siguientes cuentas a <span className="font-bold text-destructive">"papelera"</span>. Puedes restaurarlas más tarde si es necesario.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-72 mt-4 overflow-auto">
            <div className="space-y-2">
              {selectedAccountsDetails.map(account => (
                <div key={account.id} className="p-2 border border-border rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">{account.platform}</span>
                    <span className="text-sm text-muted-foreground">{formatDate(account.created_at)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{account.correo}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowRejectModal(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing}
              className="font-bold"
            >
              {isProcessing ? 'Procesando...' : `Rechazar (${selectedAccounts.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 