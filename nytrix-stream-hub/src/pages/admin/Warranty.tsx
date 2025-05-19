import { useState, useEffect, useMemo } from "react";
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
import { Search, AlertTriangle, CheckCircle, XCircle, Clock, Loader2, ArrowUp, ArrowDown, Eye, EyeOff, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWarranties, WarrantyData } from "@/hooks/useWarranties";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ManageWarrantyDialog from "@/components/admin/warranty/ManageWarrantyDialog";

export default function Warranty() {
  const { 
    data: garantias, 
    isLoading, 
    error, 
    refetch: loadGarantias,
    setSortColumn, 
    setSortDirection 
  } = useWarranties('created_at', 'desc');

  const [searchTerm, setSearchTerm] = useState("");
  const [visiblePasswordId, setVisiblePasswordId] = useState<number | null>(null);
  const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<WarrantyData | null>(null);

  const filteredGarantias = useMemo(() => {
    return garantias.filter(garantia => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (garantia.persona?.nombre_completo?.toLowerCase().includes(searchTermLower)) ||
        (garantia.persona?.correo?.toLowerCase().includes(searchTermLower)) ||
        (garantia.cuenta?.plataforma?.nombre?.toLowerCase().includes(searchTermLower)) ||
        (garantia.cuenta?.correo?.toLowerCase().includes(searchTermLower)) ||
        (garantia.id.toString().includes(searchTermLower))
      );
    });
  }, [garantias, searchTerm]);

  const handleSort = (column: keyof WarrantyData | string) => {
    setSortColumn(column as keyof WarrantyData);
    setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  const getDecryptedPassword = async (garantia: WarrantyData): Promise<string | null> => {
    if (!garantia.cuenta?.id || !garantia.cuenta?.contrasenia) {
      toast.error("No se encontró la información de la cuenta para obtener la contraseña.");
      return null;
    }
    try {
      const { data, error } = await supabase.rpc('decrypt_password', {
        encrypted_password: garantia.cuenta.contrasenia
      });
      if (error) throw error;
      return data ?? null;
    } catch (err: any) {
      console.error("Error al desencriptar contraseña:", err);
      toast.error("Error al obtener la contraseña", { description: err.message });
      return null;
    }
  };

  const togglePasswordVisibility = async (garantia: WarrantyData) => {
    const cuentaId = garantia.cuenta?.id;
    if (!cuentaId) return;

    if (visiblePasswordId === cuentaId) {
      setVisiblePasswordId(null);
      setDecryptedPassword(null);
    } else {
      const password = await getDecryptedPassword(garantia);
      if (password) {
        setVisiblePasswordId(cuentaId);
        setDecryptedPassword(password);
      } else {
        setVisiblePasswordId(null);
        setDecryptedPassword(null);
      }
    }
  };

  const handleManageClick = (garantia: WarrantyData) => {
    setSelectedWarranty(garantia);
    setIsManageDialogOpen(true);
  };

  const handleWarrantyManaged = () => {
    loadGarantias();
    setSelectedWarranty(null);
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Gestión de Garantías</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Garantía Pendientes</CardTitle>
          <div className="flex items-center justify-between pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por email, plataforma, ID..." 
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
                disabled={isLoading}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p className="text-lg font-semibold">Error al Cargar Datos</p>
              <p>{error}</p>
              <Button onClick={loadGarantias} variant="destructive" className="mt-4">
                Intentar de Nuevo
              </Button>
            </div>
          ) : filteredGarantias.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay solicitudes de garantía pendientes.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('persona.nombre_completo')} className="cursor-pointer">
                    Usuario
                  </TableHead>
                  <TableHead onClick={() => handleSort('cuenta.plataforma.nombre')} className="cursor-pointer">
                    Plataforma
                  </TableHead>
                  <TableHead onClick={() => handleSort('cuenta.correo')} className="cursor-pointer">
                    Correo Cuenta
                  </TableHead>
                  <TableHead>
                    Contraseña
                  </TableHead>
                  <TableHead onClick={() => handleSort('descripcion')} className="cursor-pointer lg:table-cell hidden">
                    Descripción Garantía
                  </TableHead>
                  <TableHead onClick={() => handleSort('created_at')} className="cursor-pointer md:table-cell hidden">
                    Fecha Solicitud
                  </TableHead>
                  <TableHead>Acciones</TableHead> 
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGarantias.map((garantia) => (
                  <TableRow key={garantia.id}>
                    <TableCell>{garantia.persona?.nombre_completo ?? "N/A"}</TableCell>
                    <TableCell>{garantia.cuenta?.plataforma?.nombre ?? "N/A"}</TableCell>
                    <TableCell>{garantia.cuenta?.correo ?? "N/A"}</TableCell>
                    <TableCell>
                      {garantia.cuenta?.contrasenia ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-mono">
                            {visiblePasswordId === garantia.cuenta?.id ? decryptedPassword : "••••••••"}
                          </span>
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant={visiblePasswordId === garantia.cuenta?.id ? "secondary" : "ghost"}
                                  size="icon" 
                                  onClick={() => togglePasswordVisibility(garantia)}
                                  className="h-6 w-6"
                                >
                                  {visiblePasswordId === garantia.cuenta?.id ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {visiblePasswordId === garantia.cuenta?.id ? "Ocultar" : "Mostrar"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="lg:table-cell hidden">
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block max-w-xs truncate text-xs text-muted-foreground">
                              {garantia.descripcion || <span className="italic text-muted-foreground/60">Sin descripción</span>}
                            </span>
                          </TooltipTrigger>
                          {garantia.descripcion && (
                            <TooltipContent side="top" align="start">
                              <p className="max-w-xs whitespace-normal">{garantia.descripcion}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="md:table-cell hidden">{formatDate(garantia.created_at)}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-blue-600 hover:text-blue-700 h-8 w-8"
                              onClick={() => handleManageClick(garantia)} 
                            >
                              <Edit className="h-4 w-4"/> 
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Gestionar Garantía</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ManageWarrantyDialog 
        isOpen={isManageDialogOpen}
        onOpenChange={setIsManageDialogOpen}
        warrantyData={selectedWarranty} 
        onWarrantyManaged={handleWarrantyManaged}
      />
    </AdminLayout>
  );
} 