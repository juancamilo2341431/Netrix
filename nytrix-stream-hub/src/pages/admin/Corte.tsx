import { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAccounts } from "@/hooks/useAccounts";
import { usePlatforms } from "@/hooks/usePlatforms";
import { Button } from "@/components/ui/button";
import { TableRow, TableCell, TableHead, Table, TableHeader, TableBody } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, Pencil, MoreHorizontal } from "lucide-react";
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
  DialogClose
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { es } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { logAccountUpdate } from "@/utils/accountAuditLogger";
import { useAuth } from "@/contexts/AuthContext";
import { Tables, Database } from "@/integrations/supabase/types";

// Interfaz genérica para las cuentas que vienen del hook, más flexible
interface HookAccountData {
  id: number;
  correo: string | null;
  estado: Database["public"]["Enums"]["estado_cuenta"] | string | null;
  platform?: string | null;
  id_plataforma?: number | null;
  contrasenia?: string | null;
  metadata_perfil?: string | null;
  created_at: string;
  last_updated: string | null;
  [key: string]: any;
}

export default function Corte() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const { user } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<HookAccountData | null>(null);
  const [editFormData, setEditFormData] = useState({ contrasenia: '' });
  
  const [platformForEditModal, setPlatformForEditModal] = useState<string | null>(null);
  const [rentedByInfo, setRentedByInfo] = useState<string | null>(null);
  const [isFetchingEditInfo, setIsFetchingEditInfo] = useState(false);
  
  const queryClient = useQueryClient();
  
  const { data: accountsFromHookUncasted = [], isLoading, error } = useAccounts();
  const { data: platformsData = [] } = usePlatforms();

  // Usar un cast a HookAccountData[], y resolver platform defensivamente
  const allAccounts: HookAccountData[] = useMemo(() => 
    (accountsFromHookUncasted as HookAccountData[]).map(acc => {
      let platformName = acc.platform;
      if (!platformName && acc.id_plataforma) {
        platformName = platformsData.find(p => p.id === acc.id_plataforma)?.nombre;
      }
      return {
        ...acc,
        platform: platformName || null,
      };
    })
  , [accountsFromHookUncasted, platformsData]);

  const accounts = useMemo(() => 
    allAccounts.filter(account => account.estado === ("corte" as any))
  , [allAccounts]);
  
  const filteredAccounts = useMemo(() => 
    accounts.filter(account => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = account.correo?.toLowerCase().includes(searchLower) || false;
      
      const matchesPlatform = filterPlatform === "all" || account.platform === filterPlatform;
      
      return matchesSearch && matchesPlatform;
    }),
    [accounts, searchTerm, filterPlatform]
  );
  
  const platforms = useMemo(() => 
    Array.from(new Set(accounts.map(account => account.platform || "")))
      .filter(platform => platform !== "")
      .sort((a, b) => a.localeCompare(b)),
    [accounts]
  );

  const stats = useMemo(() => {
    const platformCounts: Record<string, number> = {};
    accounts.forEach(account => {
      const platform = account.platform || "Desconocido";
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
    const sortedPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]);
    const dates = accounts.map(acc => new Date(acc.created_at)).sort((a, b) => a.getTime() - b.getTime());
    const earliestDate = dates.length > 0 ? dates[0] : null;
    const latestDate = dates.length > 0 ? dates[dates.length - 1] : null;
    return {
      total: accounts.length,
      platformCounts: sortedPlatforms,
      earliestDate,
      latestDate,
    };
  }, [accounts]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm", { locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", dateString, error);
      return dateString;
    }
  };
  
  const formatDateLocale = (date: Date | null) => {
    if (!date) return "N/A";
    return format(date, "d 'de' MMMM, yyyy", { locale: es });
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "corte":
        return "bg-red-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        const { data, error } = await supabase.from("persona").select("id").eq("id_user", user.id).single();
        if (data && !error) setUserId(data.id);
      }
    };
    fetchUserId();
  }, [user]);

  const fetchRentedByDetails = async (accountId: number, platformNameFromAccount: string | null) => {
    setIsFetchingEditInfo(true);
    setPlatformForEditModal(platformNameFromAccount || "No especificada");
    setRentedByInfo(null);

    try {
      const { data: rentaData, error: rentaError } = await supabase
        .from('renta')
        .select('id_persona, persona ( correo, nombre_completo )')
        .eq('id_cuenta', accountId)
        .order('fecha_fin', { ascending: false })
        .limit(1)
        .single();

      if (rentaError || !rentaData) {
        if (rentaError && rentaError.code !== 'PGRST116') {
          console.error("Error fetching rental info:", rentaError);
        }
        setRentedByInfo("No se encontró información de renta previa.");
        return;
      }
      
      const persona = rentaData.persona as any;
      if (persona) {
        setRentedByInfo(persona.nombre_completo || persona.correo || "Información de cliente no disponible");
      } else {
        setRentedByInfo("No se encontró información del cliente para la renta.");
      }

    } catch (err) {
      console.error("Unexpected error fetching rental details:", err);
      setRentedByInfo("Error al cargar detalles de la renta.");
    } finally {
      setIsFetchingEditInfo(false);
    }
  };

  const handleOpenEditModal = (account: HookAccountData) => {
    setEditingAccount(account);
    setEditFormData({ contrasenia: '' });
    fetchRentedByDetails(account.id, account.platform);
    setShowEditModal(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({ contrasenia: e.target.value });
  };

  const handleSaveChanges = async () => {
    if (!editingAccount) return;

    if (!editFormData.contrasenia.trim()) {
      toast.error("La nueva contraseña es obligatoria.");
      return;
    }

    setIsProcessing(true);
    const platformNameToLog = editingAccount.platform || "N/A";

    const updates: Partial<Tables<'cuenta'>> = {
      last_updated: new Date().toISOString(),
      contrasenia: editFormData.contrasenia,
      estado: 'disponible'
    };
    
    try {
      const { error: updateError } = await supabase
        .from('cuenta')
        .update(updates)
        .eq('id', editingAccount.id);

      if (updateError) {
        console.error("Error al actualizar cuenta:", updateError);
        toast.error("Error al actualizar la cuenta.", { description: updateError.message });
        setIsProcessing(false);
        return;
      }

      if (userId) {
        const auditMsg = "Cuenta en corte actualizada: contraseña cambiada (obligatorio), estado a disponible";
        await logAccountUpdate(userId, editingAccount.id, platformNameToLog, editingAccount.correo || "", auditMsg);
      }
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success("Cuenta actualizada y movida a disponible.");
      setShowEditModal(false);
      setEditingAccount(null);
    } catch (errCatch) {
      console.error("Error inesperado al guardar cambios:", errCatch);
      toast.error("Error inesperado al guardar cambios.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <AdminLayout title="Cuentas en Corte"><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-nytrix-purple"></div></div></AdminLayout>;
  if (error) return <AdminLayout title="Cuentas en Corte"><p className="text-center text-red-500">Error al cargar las cuentas: {error.message}</p></AdminLayout>;

  return (
    <AdminLayout title="Cuentas en Corte">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-2xl">Cuentas en Estado de Corte</CardTitle>
              <CardDescription>
                Gestiona las cuentas que han entrado en estado de corte. Total: {stats.total}
              </CardDescription>
            </div>
            <Button onClick={() => setShowStats(!showStats)} variant="outline" size="sm">
              {showStats ? "Ocultar" : "Mostrar"} Estadísticas
            </Button>
          </CardHeader>
          <CardContent>
            {showStats && (
              <div className="mb-6 border-b pb-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border p-3 rounded-lg"><h3 className="text-sm font-medium text-muted-foreground">Total en Corte</h3><p className="text-2xl font-bold">{stats.total}</p></div>
                  <div className="border p-3 rounded-lg"><h3 className="text-sm font-medium text-muted-foreground">Fecha más antigua</h3><p className="text-lg">{formatDateLocale(stats.earliestDate)}</p></div>
                  <div className="border p-3 rounded-lg"><h3 className="text-sm font-medium text-muted-foreground">Fecha más reciente</h3><p className="text-lg">{formatDateLocale(stats.latestDate)}</p></div>
                  <div className="md:col-span-full lg:col-span-1 lg:col-start-1 border p-3 rounded-lg"><h3 className="text-sm font-medium text-muted-foreground mb-1">Plataformas</h3><ScrollArea className="h-[100px]">
                    {stats.platformCounts.length > 0 ? (
                      stats.platformCounts.map(([platform, count]) => (
                        <div key={platform} className="flex justify-between items-center text-sm mb-1"><span>{platform}</span><Badge variant="secondary">{count}</Badge></div>
                      ))
                    ) : (<p className="text-sm text-muted-foreground">No hay datos de plataforma.</p>)}
                  </ScrollArea></div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
              <div className="relative flex-grow w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por correo..."
                  className="pl-9 w-full h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[180px]">
                <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las plataformas</SelectItem>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 border-b">
                    <TableHead className="pl-4">Plataforma</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Contraseña</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Últ. Actualización</TableHead>
                    <TableHead className="text-right pr-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account) => (
                      <TableRow key={account.id} className="border-b last:border-b-0 hover:bg-muted/20">
                        <TableCell className="pl-4"><span className="font-medium">{account.platform || "N/A"}</span></TableCell>
                        <TableCell>{account.correo || "N/A"}</TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-pointer">{account.contrasenia ? account.contrasenia.substring(0, 3) + "..." : "N/A"}</span>
                              </TooltipTrigger>
                              <TooltipContent><p>{account.contrasenia || "No disponible"}</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(account.estado)} gap-1`}>
                            {account.estado || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {account.last_updated ? format(new Date(account.last_updated), "dd/MM/yy") : "N/A"}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{account.last_updated ? formatDate(account.last_updated) : "Nunca"}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditModal(account)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent><p>Editar Cuenta</p></TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-64">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Search className="w-12 h-12 mb-3" /> 
                          <p className="text-md">No hay cuentas en corte que coincidan con tu búsqueda.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showEditModal} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setEditingAccount(null);
          setRentedByInfo(null);
          setPlatformForEditModal(null);
        }
        setShowEditModal(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Cuenta en Corte</DialogTitle>
            <DialogDescription>
              Esta cuenta fue puesta en corte, probablemente porque un cliente la dejó vencer. 
              Es **obligatorio** establecer una nueva contraseña.
            </DialogDescription>
          </DialogHeader>
          {editingAccount && (
            <div className="grid gap-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Plataforma: <span className="font-normal text-muted-foreground">{isFetchingEditInfo ? "Cargando..." : platformForEditModal || "N/A"}</span></p>
                <p className="text-sm font-medium">Correo Cuenta: <span className="font-normal text-muted-foreground">{editingAccount.correo || "N/A"}</span></p>
                <p className="text-sm font-medium">Última vez rentada por: <span className="font-normal text-muted-foreground">{isFetchingEditInfo ? "Cargando..." : rentedByInfo || "N/A"}</span></p>
              </div>
              <hr/>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="contrasenia-edit" className="text-right col-span-1 text-sm font-semibold">Nueva Contraseña<span className="text-red-500">*</span></label>
                <Input 
                  id="contrasenia-edit" 
                  name="contrasenia" 
                  type="password"
                  value={editFormData.contrasenia}
                  onChange={handleEditFormChange} 
                  className="col-span-3" 
                  placeholder="Obligatorio"
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => { setEditingAccount(null); setShowEditModal(false);}} disabled={isProcessing}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleSaveChanges} disabled={isProcessing}>
              {isProcessing ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminLayout>
  );
} 