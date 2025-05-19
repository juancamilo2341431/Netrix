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
import { Search, AlertTriangle, Copy, DollarSign, Loader2, MoreHorizontal, ArrowUp, ArrowDown, Receipt, CreditCard, User, Calendar, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePayments, Pago } from "@/hooks/usePayments";
import { Label } from "@/components/ui/label";
import CreatePaymentServiceModal from "@/components/admin/payments/CreatePaymentServiceModal";

export default function Payments() {
  // Estados principales
  const [searchTerm, setSearchTerm] = useState("");
  const [showStats, setShowStats] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Pago | null>(null);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Estados para ordenamiento
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Usar el hook de pagos con Realtime
  const { data, isLoading, error, refetch } = usePayments();
  
  // Extraer datos del resultado del hook
  const pagos = data?.pagos || [];
  const pagosRenta = data?.pagosRenta || [];
  const rentas = data?.rentas || [];
  const clientes = data?.clientes || [];
  
  // Función para cargar datos de pagos (mantenida para compatibilidad)
  const loadPagos = async () => {
    try {
      await refetch();
    } catch (err) {
      toast.error("Error al cargar los pagos");
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPagos();
  }, []);

  // Función para ordenar pagos
  const sortPayments = (payments: Pago[], column: string, direction: "asc" | "desc") => {
    return [...payments].sort((a, b) => {
      // Determinar los valores a comparar
      let valueA, valueB;
      
      // Manejo especial dependiendo de la columna
      switch (column) {
        case "id_factura":
          valueA = a.id_factura || "";
          valueB = b.id_factura || "";
          break;
        case "monto_pago":
          valueA = parseInt(a.monto_pago || "0") || 0;
          valueB = parseInt(b.monto_pago || "0") || 0;
          break;
        case "metodo_pago":
          valueA = a.metodo_pago || "";
          valueB = b.metodo_pago || "";
          break;
        case "estado":
          valueA = a.estado || "";
          valueB = b.estado || "";
          break;
        case "nombre_cliente":
          valueA = a.nombre_cliente || "";
          valueB = b.nombre_cliente || "";
          break;
        case "plataforma":
          valueA = a.plataforma || "";
          valueB = b.plataforma || "";
          break;
        case "created_at":
          valueA = new Date(a.created_at).getTime();
          valueB = new Date(b.created_at).getTime();
          break;
        case "last_updated":
          // Manejar valores nulos (sin actualización)
          if (!a.last_updated) return direction === "asc" ? -1 : 1;
          if (!b.last_updated) return direction === "asc" ? 1 : -1;
          
          valueA = new Date(a.last_updated).getTime();
          valueB = new Date(b.last_updated).getTime();
          break;
        default:
          return 0;
      }
      
      // Comparar valores según dirección
      if (valueA < valueB) {
        return direction === "asc" ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Función para manejar click en encabezado de columna
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Si ya está ordenando por esta columna, cambiar dirección
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Si es una nueva columna, establecerla y resetear dirección
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Componente para mostrar indicador de ordenamiento
  const SortIndicator = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    
    return sortDirection === "asc" ? 
      <ArrowUp className="ml-1 h-4 w-4" /> : 
      <ArrowDown className="ml-1 h-4 w-4" />;
  };

  // Filtrar pagos basado en el término de búsqueda y estado
  const filteredPayments = useMemo(() => {
    // Primero filtramos por búsqueda y estado
    const filtered = pagos.filter(pago => {
      const matchesSearch = 
        (pago.id_factura?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pago.monto_pago?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pago.metodo_pago?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pago.nombre_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pago.correo_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (pago.plataforma?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesStatus = 
        filterStatus === "all" || 
        (pago.estado === filterStatus);
      
      return matchesSearch && matchesStatus;
    });
    
    // Luego ordenamos el resultado filtrado
    return sortPayments(filtered, sortColumn, sortDirection);
  }, [pagos, searchTerm, filterStatus, sortColumn, sortDirection]);

  // Función para copiar el ID de factura al portapapeles
  const copyInvoiceId = (invoiceId: string) => {
    navigator.clipboard.writeText(invoiceId);
    toast.success(`ID de factura ${invoiceId} copiado al portapapeles`);
  };

  // Función para obtener el color de estado
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "pagado":
        return "bg-green-500 text-white";
      case "pendiente":
        return "bg-amber-500 text-white";
      case "cancelado":
        return "bg-red-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "d MMM yyyy, HH:mm", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Función para formatear valor monetario
  const formatCurrency = (value: string | null) => {
    if (!value) return "0";
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'code'
    }).format(parseInt(value)).replace('COP', '').trim();
  };

  // Obtener iniciales para avatar
  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Abrir modal de detalles de pago
  const openPaymentDetail = (payment: Pago) => {
    setSelectedPayment(payment);
    setPaymentDetailOpen(true);
  };

  // Obtener los detalles de la renta asociada al pago
  const getRentaDetails = (pagoId: number) => {
    // Encontrar la relación pago_renta
    const pagoRenta = pagosRenta.find(pr => pr.id_pago === pagoId);
    if (!pagoRenta || !pagoRenta.id_renta) return null;
    
    // Encontrar la renta
    const renta = rentas.find(r => r.id === pagoRenta.id_renta);
    if (!renta) return null;
    
    return renta;
  };

  // Calcular estadísticas
  const stats = {
    total: pagos.length,
    pagados: pagos.filter(p => p.estado === "pagado").length,
    pendientes: pagos.filter(p => p.estado === "pendiente").length,
    cancelados: pagos.filter(p => p.estado === "cancelado").length,
    montoTotal: pagos.reduce((acc, curr) => acc + (parseInt(curr.monto_pago || "0") || 0), 0)
  };

  // Función para actualizar estado de pago
  const updatePaymentStatus = async (pagoId: number, newStatus: "pagado" | "pendiente" | "cancelado") => {
    try {
      const { error } = await supabase
        .from('pago')
        .update({ 
          estado: newStatus,
          last_updated: new Date().toISOString()
        })
        .eq('id', pagoId);
        
      if (error) throw error;
      
      toast.success(`Estado del pago actualizado a: ${newStatus}`);
      
      // Actualizar datos
      refetch();
      
    } catch (err) {
      toast.error("Error al actualizar el estado del pago");
    }
  };
  
  // Función para abrir el modal de creación de pagos con servicios
  const openCreateModal = () => {
    setCreateModalOpen(true);
  };
  
  // Función que se llama cuando se crea un pago con éxito
  const handlePaymentCreated = () => {
    refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
          </Button>
        </div>

        {/* Estadísticas de pagos */}
        {showStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Total de pagos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Pagos completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pagados}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total ? ((stats.pagados / stats.total) * 100).toFixed(0) : 0}% del total
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Pagos pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.pendientes}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total ? ((stats.pendientes / stats.total) * 100).toFixed(0) : 0}% del total
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-nytrix-purple/20 bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">Monto total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center">
                  <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                  {formatCurrency(stats.montoTotal.toString())}
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
              placeholder="Buscar pagos..."
              className="pl-8 border-nytrix-purple/20 bg-background w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px] border-nytrix-purple/20 bg-background">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-card border-nytrix-purple/20">
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pagado">Pagados</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            className="bg-gradient-nytrix hover:opacity-90"
            onClick={openCreateModal}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Pago con Servicios
          </Button>
        </div>
        
        <div className="border border-nytrix-purple/20 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-card hover:bg-card">
                <TableHead onClick={() => handleSort("id_factura")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    ID Factura
                    <SortIndicator column="id_factura" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("nombre_cliente")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Cliente
                    <SortIndicator column="nombre_cliente" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("plataforma")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Plataforma
                    <SortIndicator column="plataforma" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("monto_pago")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Monto
                    <SortIndicator column="monto_pago" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("metodo_pago")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Método
                    <SortIndicator column="metodo_pago" />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort("estado")} className="cursor-pointer hover:text-nytrix-purple">
                  <div className="flex items-center">
                    Estado
                    <SortIndicator column="estado" />
                  </div>
                </TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer hover:text-nytrix-purple" onClick={() => handleSort("created_at")}>
                  <div className="flex items-center">
                    Fecha
                    <SortIndicator column="created_at" />
                  </div>
                </TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 mb-2 animate-spin text-nytrix-purple" />
                      <p className="text-muted-foreground">Cargando pagos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-8 w-8 mb-2 text-destructive" />
                      <p className="text-destructive">Error al cargar los pagos</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => refetch()}
                      >
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length > 0 ? (
                filteredPayments.map((pago) => (
                  <TableRow key={pago.id} className="group">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Receipt className="h-4 w-4 text-nytrix-purple" />
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                          {pago.id_factura || `#${pago.id}`}
                        </code>
                        {pago.id_factura && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => copyInvoiceId(pago.id_factura || "")}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pago.nombre_cliente ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-nytrix-purple text-white text-xs">
                              {getInitials(pago.nombre_cliente)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{pago.nombre_cliente}</div>
                            <div className="text-xs text-muted-foreground">{pago.correo_cliente}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Sin cliente</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {pago.plataformas && pago.plataformas.length > 0 ? (
                        <div className="flex items-center">
                          <div className="flex -space-x-2 mr-2">
                            {pago.plataformas.slice(0, 3).map((plat, index) => (
                              <Badge 
                                key={`${pago.id}-plat-${plat.id}-${index}`} 
                                className={`${plat.color} text-white border-2 border-background`}
                                variant="outline"
                              >
                                {plat.nombre.substring(0, 2).toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                          {pago.plataformas.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{pago.plataformas.length - 3} más
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-1 rounded bg-nytrix-purple/10 text-sm">
                          {pago.plataforma || "N/A"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-semibold">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                        {formatCurrency(pago.monto_pago)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-1.5 text-nytrix-purple" />
                        <span>{pago.metodo_pago || "No especificado"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(pago.estado)}>
                        {pago.estado === "pagado" ? "Pagado" : 
                          pago.estado === "pendiente" ? "Pendiente" : 
                          pago.estado === "cancelado" ? "Cancelado" : "Desconocido"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {formatDate(pago.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => openPaymentDetail(pago)}
                            className="cursor-pointer"
                          >
                            <Receipt className="mr-2 h-4 w-4" />
                            <span>Ver detalles</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {pago.estado !== "pagado" && (
                            <DropdownMenuItem 
                              onClick={() => updatePaymentStatus(pago.id, "pagado")}
                              className="cursor-pointer text-green-600"
                            >
                              <span>Marcar como pagado</span>
                            </DropdownMenuItem>
                          )}
                          
                          {pago.estado !== "pendiente" && (
                            <DropdownMenuItem 
                              onClick={() => updatePaymentStatus(pago.id, "pendiente")}
                              className="cursor-pointer text-yellow-500"
                            >
                              <span>Marcar como pendiente</span>
                            </DropdownMenuItem>
                          )}
                          
                          {pago.estado !== "cancelado" && (
                            <DropdownMenuItem 
                              onClick={() => updatePaymentStatus(pago.id, "cancelado")}
                              className="cursor-pointer text-red-500"
                            >
                              <span>Marcar como cancelado</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No se encontraron pagos que coincidan con tu búsqueda.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de detalles de pago */}
      <Dialog open={paymentDetailOpen} onOpenChange={setPaymentDetailOpen}>
        <DialogContent className="sm:max-w-[550px] bg-[#1a192d] border-0 text-white p-0">
          <div className="flex flex-col max-h-[95vh]">
            <DialogHeader className="p-6 pb-4 sticky top-0 z-10 bg-[#1a192d]">
              <div className="flex items-center">
                <Button 
                  className="bg-transparent hover:bg-[#252440] text-white border-0 h-8 w-8 p-0 mr-2"
                  onClick={() => setPaymentDetailOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <DialogTitle className="text-white text-xl">
                  Detalles del Pago
                </DialogTitle>
              </div>
            </DialogHeader>
            
            {selectedPayment && (
              <div className="px-6 overflow-y-auto" style={{ maxHeight: "calc(95vh - 85px)" }}>
                <div className="space-y-6 pb-6">
                  {/* Información general del pago */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wide">
                      Información del Pago
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-400">ID Factura</Label>
                        <div className="flex items-center mt-1">
                          <code className="bg-[#252440] px-2 py-1 rounded text-sm font-mono">
                            {selectedPayment.id_factura || `#${selectedPayment.id}`}
                          </code>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-400">Estado</Label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedPayment.estado)}>
                            {selectedPayment.estado === "pagado" ? "Pagado" : 
                              selectedPayment.estado === "pendiente" ? "Pendiente" : 
                              selectedPayment.estado === "cancelado" ? "Cancelado" : "Desconocido"}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-400">Monto</Label>
                        <div className="flex items-center text-lg font-bold text-white mt-1">
                          <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                          {formatCurrency(selectedPayment.monto_pago)}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-400">Método de Pago</Label>
                        <div className="flex items-center mt-1">
                          <CreditCard className="h-4 w-4 mr-1.5 text-nytrix-purple" />
                          <span>{selectedPayment.metodo_pago || "No especificado"}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-gray-400">Fecha</Label>
                        <div className="flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1.5 text-nytrix-purple" />
                          <span>{formatDate(selectedPayment.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Plataformas asociadas al pago */}
                  {selectedPayment.plataformas && selectedPayment.plataformas.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wide">
                        Plataformas Incluidas
                      </h3>
                      
                      <div className="space-y-2">
                        {selectedPayment.plataformas.map((plat, index) => (
                          <div key={`detail-plat-${plat.id}-${index}`} className="bg-[#252440] p-3 rounded-md">
                            <div className="flex items-center">
                              <Badge 
                                className={`${plat.color} text-white mr-2`}
                                variant="outline"
                              >
                                {plat.nombre.substring(0, 2).toUpperCase()}
                              </Badge>
                              <span className="font-medium">{plat.nombre}</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                              <div>
                                <Label className="text-xs text-gray-400">Precio base</Label>
                                <div className="flex items-center mt-1">
                                  <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                                  <span>{plat.precio ? formatCurrency(plat.precio) : "N/A"}</span>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-gray-400">Descuento</Label>
                                <div className="flex items-center mt-1">
                                  {plat.descuento ? (
                                    <>
                                      <DollarSign className="h-3 w-3 text-red-400 mr-1" />
                                      <span className="text-red-400">-{formatCurrency(plat.descuento)}</span>
                                    </>
                                  ) : (
                                    <span className="text-gray-500">Sin descuento</span>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-gray-400">Precio final</Label>
                                <div className="flex items-center mt-1 font-medium">
                                  <DollarSign className="h-3 w-3 text-green-500 mr-1" />
                                  <span>{plat.precio_final ? formatCurrency(plat.precio_final) : formatCurrency(plat.precio)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Información del cliente */}
                  {selectedPayment.nombre_cliente && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wide">
                        Información del Cliente
                      </h3>
                      
                      <div className="flex items-center bg-[#252440] p-3 rounded-md">
                        <Avatar className="h-12 w-12 mr-3">
                          <AvatarFallback className="bg-[#8878ff] text-white">
                            {getInitials(selectedPayment.nombre_cliente)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="font-semibold">{selectedPayment.nombre_cliente}</div>
                          <div className="text-sm text-gray-400">{selectedPayment.correo_cliente || "Sin correo"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Información de la renta relacionada */}
                  {selectedPayment.id_renta && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wide">
                        Información de la Suscripción
                      </h3>
                      
                      {(() => {
                        const renta = getRentaDetails(selectedPayment.id);
                        
                        if (!renta) {
                          return (
                            <div className="text-gray-400 italic">
                              No se encontró información de la suscripción
                            </div>
                          );
                        }
                        
                        return (
                          <div className="bg-[#252440] p-3 rounded-md space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-400">ID Suscripción</Label>
                                <div className="text-sm">#{renta.id}</div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-gray-400">Estado</Label>
                                <div>
                                  <Badge className="bg-nytrix-purple text-white">
                                    {renta.estado || "No definido"}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-gray-400">Inicio</Label>
                                <div className="text-sm">
                                  {renta.fecha_inicio ? formatDate(renta.fecha_inicio) : "No definido"}
                                </div>
                              </div>
                              
                              <div>
                                <Label className="text-xs text-gray-400">Fin</Label>
                                <div className="text-sm">
                                  {renta.fecha_fin ? formatDate(renta.fecha_fin) : "No definido"}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  
                  {/* Resumen de precios */}
                  {selectedPayment.plataformas && selectedPayment.plataformas.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase text-gray-400 tracking-wide">
                        Resumen de Precios
                      </h3>
                      
                      <div className="bg-[#252440] p-4 rounded-md">
                        {(() => {
                          // Calcular totales
                          const precioOriginal = selectedPayment.plataformas.reduce((sum, plat) => 
                            sum + (plat.precio ? parseFloat(plat.precio) : 0), 0);
                          
                          const totalDescuentos = selectedPayment.plataformas.reduce((sum, plat) => 
                            sum + (plat.descuento ? parseFloat(plat.descuento) : 0), 0);
                          
                          const precioFinal = precioOriginal - totalDescuentos;
                          
                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400">Precio original:</span>
                                <div className="flex items-center">
                                  <DollarSign className="h-3 w-3 text-gray-400 mr-1" />
                                  <span>{formatCurrency(precioOriginal.toString())}</span>
                                </div>
                              </div>
                              
                              {totalDescuentos > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                  <span className="text-gray-400">Descuentos aplicados:</span>
                                  <div className="flex items-center">
                                    <DollarSign className="h-3 w-3 text-red-400 mr-1" />
                                    <span className="text-red-400">-{formatCurrency(totalDescuentos.toString())}</span>
                                  </div>
                                </div>
                              )}
                              
                              <div className="border-t border-gray-700 pt-2 mt-2">
                                <div className="flex justify-between items-center font-bold">
                                  <span>Total pagado:</span>
                                  <div className="flex items-center text-lg">
                                    <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                                    <span>{formatCurrency(precioFinal.toString())}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal para crear pagos con servicios */}
      <CreatePaymentServiceModal 
        isOpen={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onPaymentCreated={handlePaymentCreated}
      />
    </AdminLayout>
  );
} 