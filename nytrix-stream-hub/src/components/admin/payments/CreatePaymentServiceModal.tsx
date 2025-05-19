import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Package, 
  Calendar, 
  Trash2, 
  Plus, 
  Receipt, 
  CreditCard, 
  DollarSign, 
  Tag, 
  Loader2,
  Percent
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { PagoOntologyService } from "@/integrations/ontology/pago";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Definición de tipos
interface Cliente {
  id: number;
  nombre_completo: string | null;
  correo: string | null;
}

interface Plataforma {
  id: number;
  nombre: string | null;
  precio: string | null;
}

interface Cuenta {
  id: number;
  correo: string | null;
  id_plataforma: number | null;
  estado: string | null;
}

interface Cupon {
  id: number;
  nombre: string | null;
  codigo: string | null;
  descuento: string | null;
  id_plataforma: number | null;
}

interface CuponPersona {
  id: number;
  id_cupon: number;
  id_persona: number;
  estado: string;
}

interface Servicio {
  plataforma_id: number | null;
  cuenta_id: number | null;
  fecha_inicio: string;
  fecha_fin: string;
  precio_base: number;
  cupon_id: number | null;
  cupon_descuento: number;
  precio_final: number;
}

interface CreatePaymentServiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentCreated: () => void;
}

export default function CreatePaymentServiceModal({
  isOpen,
  onOpenChange,
  onPaymentCreated
}: CreatePaymentServiceModalProps) {
  // Estados para el formulario
  const [clienteId, setClienteId] = useState<string>("");
  const [facturaId, setFacturaId] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("efectivo");
  const [estadoPago, setEstadoPago] = useState<string>("pagado");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Estados para servicios (rentas)
  const [servicios, setServicios] = useState<Servicio[]>([]);
  
  // Estados para los datos auxiliares
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [plataformas, setPlataformas] = useState<Plataforma[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cupones, setCupones] = useState<Cupon[]>([]);
  const [cuponesPersona, setCuponesPersona] = useState<CuponPersona[]>([]);
  
  // Cargar datos necesarios cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    } else {
      // Reiniciar formulario al cerrar
      resetForm();
    }
  }, [isOpen]);
  
  // Efecto para cargar cupones cuando cambia el cliente seleccionado
  useEffect(() => {
    if (clienteId) {
      loadCuponesCliente(parseInt(clienteId));
    }
  }, [clienteId]);
  
  // Función para cargar datos iniciales
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Cargar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('persona')
        .select('id, nombre_completo, correo')
        .eq('rol', 'cliente')
        .eq('estado', 'habilitado')
        .order('nombre_completo');
      
      if (clientesError) throw clientesError;
      setClientes(clientesData || []);
      
      // Cargar plataformas
      const { data: plataformasData, error: plataformasError } = await supabase
        .from('plataforma')
        .select('id, nombre, precio')
        .eq('estado', 'mostrar')
        .order('nombre');
      
      if (plataformasError) throw plataformasError;
      setPlataformas(plataformasData || []);
      
      // Cargar cuentas disponibles
      const { data: cuentasData, error: cuentasError } = await supabase
        .from('cuenta')
        .select('id, correo, id_plataforma, estado')
        .eq('estado', 'disponible')
        .order('id_plataforma');
      
      if (cuentasError) throw cuentasError;
      setCuentas(cuentasData || []);
      
      // Cargar todos los cupones activos (serán filtrados por cliente y plataforma después)
      const { data: cuponesData, error: cuponesError } = await supabase
        .from('cupon')
        .select('id, nombre, codigo, descuento, id_plataforma')
        .eq('estado', 'activo')
        .order('nombre');
      
      if (cuponesError) throw cuponesError;
      setCupones(cuponesData || []);
      
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      toast.error("Error al cargar datos necesarios");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar cupones del cliente
  const loadCuponesCliente = async (clienteId: number) => {
    try {
      // Cargar las relaciones cupon_persona para este cliente
      const { data: cuponPersonaData, error: cuponPersonaError } = await supabase
        .from('cupon_persona')
        .select('id, id_cupon, id_persona, estado')
        .eq('id_persona', clienteId)
        .eq('estado', 'activo');
      
      if (cuponPersonaError) throw cuponPersonaError;
      setCuponesPersona(cuponPersonaData || []);
      
    } catch (err) {
      console.error("Error al cargar cupones del cliente:", err);
    }
  };
  
  // Función para obtener cupones disponibles para una plataforma específica y el cliente seleccionado
  const getCuponesDisponibles = (plataformaId: number | null) => {
    if (!clienteId) return [];
    
    // IDs de cupones habilitados para este cliente
    const cuponIdsHabilitados = cuponesPersona.map(cp => cp.id_cupon);
    
    return cupones.filter(cupon => 
      // El cupón debe estar habilitado para este cliente
      cuponIdsHabilitados.includes(cupon.id) &&
      // El cupón debe ser para esta plataforma o para todas (id_plataforma = null)
      (cupon.id_plataforma === plataformaId || cupon.id_plataforma === null)
    );
  };
  
  // Función para resetear el formulario
  const resetForm = () => {
    setClienteId("");
    setFacturaId("");
    setMetodoPago("efectivo");
    setEstadoPago("pagado");
    setServicios([]);
    setCuponesPersona([]);
  };
  
  // Función para añadir un nuevo servicio
  const addServicio = () => {
    // Fechas por defecto
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(today.getMonth() + 1); // Un mes desde hoy
    
    const newServicio: Servicio = {
      plataforma_id: null,
      cuenta_id: null,
      fecha_inicio: format(today, 'yyyy-MM-dd'),
      fecha_fin: format(endDate, 'yyyy-MM-dd'),
      precio_base: 0,
      cupon_id: null,
      cupon_descuento: 0,
      precio_final: 0
    };
    
    setServicios([...servicios, newServicio]);
  };
  
  // Función para eliminar un servicio
  const removeServicio = (index: number) => {
    const updatedServicios = [...servicios];
    updatedServicios.splice(index, 1);
    setServicios(updatedServicios);
  };
  
  // Función para actualizar datos de un servicio
  const updateServicio = (index: number, field: string, value: any) => {
    const updatedServicios = [...servicios];
    const servicio = { ...updatedServicios[index] };
    
    // Actualizar el campo específico
    switch (field) {
      case "plataforma_id":
        servicio.plataforma_id = parseInt(value);
        
        // Actualizar precio base basado en la plataforma seleccionada
        const plataforma = plataformas.find(p => p.id === parseInt(value));
        if (plataforma && plataforma.precio) {
          servicio.precio_base = parseInt(plataforma.precio);
        } else {
          servicio.precio_base = 0;
        }
        
        // Reset cuenta y cupón cuando cambia la plataforma
        servicio.cuenta_id = null;
        servicio.cupon_id = null;
        servicio.cupon_descuento = 0;
        break;
      
      case "cuenta_id":
        servicio.cuenta_id = parseInt(value);
        break;
      
      case "fecha_inicio":
        servicio.fecha_inicio = value;
        break;
      
      case "fecha_fin":
        servicio.fecha_fin = value;
        break;
      
      case "cupon_id":
        servicio.cupon_id = value ? parseInt(value) : null;
        
        // Actualizar descuento del cupón
        if (value) {
          const cupon = cupones.find(c => c.id === parseInt(value));
          if (cupon && cupon.descuento) {
            servicio.cupon_descuento = parseInt(cupon.descuento);
          } else {
            servicio.cupon_descuento = 0;
          }
        } else {
          servicio.cupon_descuento = 0;
        }
        break;
    }
    
    // Calcular precio final
    servicio.precio_final = Math.max(servicio.precio_base - servicio.cupon_descuento, 0);
    
    updatedServicios[index] = servicio;
    setServicios(updatedServicios);
  };
  
  // Calcular monto total
  const calcularMontoTotal = (): number => {
    return servicios.reduce((total, servicio) => total + servicio.precio_final, 0);
  };
  
  // Guardar pago y servicios
  const handleSubmit = async () => {
    // Validaciones
    if (!clienteId) {
      toast.error("Debes seleccionar un cliente");
      return;
    }
    
    if (servicios.length === 0) {
      toast.error("Debes agregar al menos un servicio");
      return;
    }
    
    // Validar que todos los servicios tengan plataforma y cuenta
    const serviciosIncompletos = servicios.some(
      servicio => !servicio.plataforma_id || !servicio.cuenta_id
    );
    
    if (serviciosIncompletos) {
      toast.error("Todos los servicios deben tener plataforma y cuenta asignada");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 1. Crear el pago en Supabase
      const montoTotal = calcularMontoTotal();
      
      const { data: pago, error: pagoError } = await supabase
        .from('pago')
        .insert({
          id_factura: facturaId || null,
          metodo_pago: metodoPago,
          monto_pago: montoTotal.toString(),
          estado: estadoPago as 'pagado' | 'pendiente' | 'cancelado',
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        })
        .select()
        .single();
        
      if (pagoError) throw pagoError;

      // 2. Almacenar en la ontología
      try {
        await PagoOntologyService.crearPago({
          id: pago.id.toString(),
          idFactura: pago.id_factura || '',
          montoPago: parseFloat(pago.monto_pago || '0'),
          metodoPago: pago.metodo_pago || '',
          fechaPago: new Date(pago.created_at),
          estadoPago: pago.estado as 'pagado' | 'pendiente' | 'cancelado'
        });
      } catch (ontologyError) {
        console.error("Error al almacenar en ontología:", ontologyError);
        // No lanzamos el error para no interrumpir el flujo principal
        toast.warning("El pago se creó pero hubo un error al almacenar en la ontología");
      }
      
      // 3. Crear rentas y asociarlas al pago
      for (const servicio of servicios) {
        // Crear renta
        const { data: renta, error: rentaError } = await supabase
          .from('renta')
          .insert({
            id_persona: parseInt(clienteId),
            id_cuenta: servicio.cuenta_id,
            fecha_inicio: servicio.fecha_inicio,
            fecha_fin: servicio.fecha_fin,
            estado: 'rentada',
            created_at: new Date().toISOString(),
            last_updated: new Date().toISOString()
          })
          .select()
          .single();
          
        if (rentaError) throw rentaError;
        
        // Asociar renta con pago
        const { error: pagoRentaError } = await supabase
          .from('pago_renta')
          .insert({
            id_pago: pago.id,
            id_renta: renta.id,
            created_at: new Date().toISOString()
          });
          
        if (pagoRentaError) throw pagoRentaError;
        
        // Si hay cupón, asociarlo a la renta
        if (servicio.cupon_id) {
          // Obtener el id de la relación cupon_persona para este cupón y cliente
          const cuponPersona = cuponesPersona.find(cp => cp.id_cupon === servicio.cupon_id);
          
          if (cuponPersona) {
            // Actualizar la renta con el id de cupon_persona
            const { error: updateRentaError } = await supabase
              .from('renta')
              .update({
                id_cupon_persona: cuponPersona.id
              })
              .eq('id', renta.id);
                
            if (updateRentaError) throw updateRentaError;
          }
        }
        
        // Actualizar estado de la cuenta
        const { error: updateCuentaError } = await supabase
          .from('cuenta')
          .update({
            estado: 'alquilada',
            last_updated: new Date().toISOString()
          })
          .eq('id', servicio.cuenta_id);
          
        if (updateCuentaError) throw updateCuentaError;
      }
      
      toast.success("Pago y servicios creados correctamente");
      onPaymentCreated();
      onOpenChange(false);
      resetForm();
      
    } catch (err) {
      console.error("Error al crear pago y servicios:", err);
      toast.error("Error al procesar la operación");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-[#1a192d] border-0 text-white p-0 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="text-xl font-semibold">
            Crear Pago con Servicios
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Genera un pago y servicios asociados en una sola operación
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 pt-2">
          {/* Sección de cliente */}
          <div className="mb-6">
            <Card className="bg-[#252440] border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center">
                  <User className="h-4 w-4 mr-2 text-nytrix-purple" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cliente_id">Seleccionar Cliente</Label>
                    <Select 
                      value={clienteId} 
                      onValueChange={setClienteId}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-[#1e1d38] border-0">
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252440] border-[#333] text-white">
                        {clientes.map(cliente => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nombre_completo} ({cliente.correo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Sección de servicios */}
          <div className="mb-6">
            <Card className="bg-[#252440] border-0">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-md flex items-center">
                  <Package className="h-4 w-4 mr-2 text-nytrix-purple" />
                  Servicios
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-nytrix-purple text-nytrix-purple bg-transparent hover:bg-nytrix-purple/10"
                  onClick={addServicio}
                  disabled={isLoading}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Añadir Servicio
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {servicios.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-500 opacity-50" />
                    <p>No hay servicios añadidos</p>
                    <p className="text-sm">Haz clic en "Añadir Servicio" para comenzar</p>
                  </div>
                ) : (
                  servicios.map((servicio, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-700 rounded-md p-4 relative"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-red-950"
                        onClick={() => removeServicio(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Plataforma</Label>
                          <Select 
                            value={servicio.plataforma_id?.toString() || "0"} 
                            onValueChange={(value) => updateServicio(index, "plataforma_id", value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className="bg-[#1e1d38] border-0">
                              <SelectValue placeholder="Selecciona una plataforma" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#252440] border-[#333] text-white">
                              {plataformas.map(plataforma => (
                                <SelectItem key={plataforma.id} value={plataforma.id.toString()}>
                                  {plataforma.nombre} - {plataforma.precio ? `$${plataforma.precio}` : 'Sin precio'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Cuenta</Label>
                          <Select 
                            value={servicio.cuenta_id?.toString() || "0"} 
                            onValueChange={(value) => updateServicio(index, "cuenta_id", value)}
                            disabled={isLoading || !servicio.plataforma_id}
                          >
                            <SelectTrigger className="bg-[#1e1d38] border-0">
                              <SelectValue placeholder="Selecciona una cuenta" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#252440] border-[#333] text-white">
                              {cuentas
                                .filter(cuenta => cuenta.id_plataforma === servicio.plataforma_id)
                                .map(cuenta => (
                                  <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                                    {cuenta.correo}
                                  </SelectItem>
                                ))
                              }
                              {(!servicio.plataforma_id || cuentas.filter(cuenta => cuenta.id_plataforma === servicio.plataforma_id).length === 0) && (
                                <SelectItem value="0" disabled>No hay cuentas disponibles</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Fecha de Inicio</Label>
                          <Input
                            type="date"
                            value={servicio.fecha_inicio}
                            onChange={(e) => updateServicio(index, "fecha_inicio", e.target.value)}
                            className="bg-[#1e1d38] border-0"
                            disabled={isLoading}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Fecha de Fin</Label>
                          <Input
                            type="date"
                            value={servicio.fecha_fin}
                            onChange={(e) => updateServicio(index, "fecha_fin", e.target.value)}
                            className="bg-[#1e1d38] border-0"
                            disabled={isLoading}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Cupón</Label>
                          <Select 
                            value={servicio.cupon_id?.toString() || "0"} 
                            onValueChange={(value) => updateServicio(index, "cupon_id", value === "0" ? null : value)}
                            disabled={isLoading || !servicio.plataforma_id || !clienteId}
                          >
                            <SelectTrigger className="bg-[#1e1d38] border-0">
                              <SelectValue placeholder="Sin cupón" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#252440] border-[#333] text-white">
                              <SelectItem value="0">Sin cupón</SelectItem>
                              {getCuponesDisponibles(servicio.plataforma_id).map(cupon => (
                                <SelectItem key={cupon.id} value={cupon.id.toString()}>
                                  {cupon.nombre} - {cupon.descuento ? `$${cupon.descuento}` : 'Sin descuento'}
                                </SelectItem>
                              ))}
                              {clienteId && servicio.plataforma_id && getCuponesDisponibles(servicio.plataforma_id).length === 0 && (
                                <SelectItem value="no-cupones" disabled>No hay cupones disponibles</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Resumen de Precios</Label>
                          <div className="flex flex-col space-y-1 bg-[#1e1d38] p-2 rounded-md h-10 justify-center">
                            <div className="flex justify-between items-center text-sm">
                              <span>Base: ${servicio.precio_base}</span>
                              {servicio.cupon_descuento > 0 && (
                                <span className="text-red-400">-${servicio.cupon_descuento}</span>
                              )}
                              <span className="font-bold">${servicio.precio_final}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sección de pago */}
          <div className="mb-6">
            <Card className="bg-[#252440] border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-md flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-nytrix-purple" />
                  Información del Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="factura_id">ID Factura</Label>
                    <div className="flex items-center space-x-2">
                      <Receipt className="h-4 w-4 text-gray-400" />
                      <Input
                        id="factura_id"
                        placeholder="Identificación de factura (opcional)"
                        value={facturaId}
                        onChange={(e) => setFacturaId(e.target.value)}
                        className="bg-[#1e1d38] border-0"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="metodo_pago">Método de Pago</Label>
                    <Select 
                      value={metodoPago} 
                      onValueChange={setMetodoPago}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-[#1e1d38] border-0">
                        <SelectValue placeholder="Selecciona método de pago" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252440] border-[#333] text-white">
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="cripto">Criptomoneda</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estado_pago">Estado del Pago</Label>
                    <Select 
                      value={estadoPago} 
                      onValueChange={setEstadoPago}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-[#1e1d38] border-0">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#252440] border-[#333] text-white">
                        <SelectItem value="pagado">Pagado</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Monto Total</Label>
                    <div className="flex items-center bg-[#1e1d38] rounded-md p-2 h-10">
                      <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                      <span className="text-lg font-bold">${calcularMontoTotal()}</span>
                    </div>
                  </div>
                </div>
                
                {/* Resumen de Servicios */}
                {servicios.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-400 mb-2 block">Resumen de Servicios</Label>
                    <div className="bg-[#1e1d38] rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
                      {servicios.map((servicio, index) => {
                        const plataforma = plataformas.find(p => p.id === servicio.plataforma_id);
                        return (
                          <div key={index} className="flex justify-between items-center text-sm border-b border-gray-700 pb-1 last:border-0 last:pb-0">
                            <div className="flex items-center">
                              <Package className="h-3.5 w-3.5 mr-1.5 text-nytrix-purple" />
                              <span>{plataforma?.nombre || "Plataforma no seleccionada"}</span>
                              {servicio.cupon_id && (
                                <Badge className="ml-2 bg-purple-900 text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  Cupón
                                </Badge>
                              )}
                            </div>
                            <span className="font-semibold">${servicio.precio_final}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="p-6 pt-2 bg-[#252440]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-gradient-nytrix hover:opacity-90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Crear Pago y Servicios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 