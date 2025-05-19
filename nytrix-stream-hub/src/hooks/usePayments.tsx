import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Tipos 
export interface Pago {
  id: number;
  estado: "pagado" | "cancelado" | "pendiente" | null;
  id_factura: string | null;
  metodo_pago: string | null;
  monto_pago: string | null;
  created_at: string;
  last_updated: string | null;
  // Campos adicionales para mostrar información relacionada
  nombre_cliente?: string | null;
  correo_cliente?: string | null;
  plataforma?: string | null;
  plataformas?: Array<{
    id: number, 
    nombre: string, 
    color?: string,
    precio?: string | null,
    descuento?: string | null,
    precio_final?: string | null
  }>;
  id_renta?: number | null;
}

export interface PagoRenta {
  id: number;
  id_pago: number | null;
  id_renta: number | null;
  created_at: string;
}

export interface Renta {
  id: number;
  id_persona: number | null;
  id_cuenta: number | null;
  estado: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  id_plataforma?: number | null;
  nombre_plataforma?: string | null;
}

export interface Cliente {
  id: number;
  nombre_completo: string | null;
  correo: string | null;
  telefono: string | null;
}

/**
 * Hook para obtener pagos de la base de datos con
 * actualización en tiempo real a través de Supabase Realtime
 */
export const usePayments = () => {
  // Acceder al queryClient para invalidar la consulta cuando se detecten cambios
  const queryClient = useQueryClient();

  // Configurar suscripción a cambios en tiempo real para las tablas relacionadas con pagos
  useEffect(() => {
    // Suscripción a cambios en la tabla 'pago'
    const pagoSubscription = supabase
      .channel('pago-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'pago' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          toast.success("Nuevo pago registrado");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'pago' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          toast.info("Pago actualizado");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'pago' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          toast.info("Pago eliminado");
        }
      )
      .subscribe();

    // Suscripción a cambios en la tabla 'pago_renta'
    const pagoRentaSubscription = supabase
      .channel('pago-renta-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'pago_renta' 
        }, 
        () => {
          // Cuando hay cambios en las relaciones pago_renta, también actualizamos los pagos
          queryClient.invalidateQueries({ queryKey: ['payments'] });
        }
      )
      .subscribe();

    // Limpiar las suscripciones cuando el componente se desmonte
    return () => {
      pagoSubscription.unsubscribe();
      pagoRentaSubscription.unsubscribe();
    };
  }, [queryClient]);

  // Función para cargar datos de pagos con todas sus relaciones
  const fetchPaymentsData = async () => {
    try {
      // Cargar pagos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('pago')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Cargar relaciones pago_renta
      const { data: pagoRentaData, error: pagoRentaError } = await supabase
        .from('pago_renta')
        .select('*');

      if (pagoRentaError) throw pagoRentaError;

      // Cargar rentas
      const { data: rentasData, error: rentasError } = await supabase
        .from('renta')
        .select('*');

      if (rentasError) throw rentasError;

      // Cargar clientes (personas)
      const { data: clientesData, error: clientesError } = await supabase
        .from('persona')
        .select('id, nombre_completo, correo, telefono');

      if (clientesError) throw clientesError;

      // Cargar cuentas y plataformas para obtener información adicional
      const { data: cuentasData, error: cuentasError } = await supabase
        .from('cuenta')
        .select('id, id_plataforma');

      if (cuentasError) throw cuentasError;

      // Cargar plataformas
      const { data: plataformasData, error: plataformasError } = await supabase
        .from('plataforma')
        .select('id, nombre, precio');

      if (plataformasError) throw plataformasError;

      // Procesar los datos para agregar información relacionada a cada pago
      const processedPayments: Pago[] = [];

      // Procesar cada pago de forma secuencial para permitir consultas async adicionales
      for (const pago of paymentsData || []) {
        // Encontrar todas las relaciones pago_renta para este pago
        const pagosRentaParaEstePago = pagoRentaData?.filter(pr => pr.id_pago === pago.id) || [];
        
        // Obtener información del cliente del primer pago-renta (todos compartirán el mismo cliente)
        let clienteInfo = null;
        let plataformaInfoPrincipal = null;
        
        // Rastrear todas las plataformas asociadas a este pago
        const plataformasAsociadas: Array<{
          id: number, 
          nombre: string, 
          precio?: string | null,
          descuento?: string | null,
          precio_final?: string | null
        }> = [];
        
        // Procesar cada relación pago_renta
        for (const pagoRenta of pagosRentaParaEstePago) {
          // Encontrar la renta
          const rentaInfo = rentasData?.find(r => r.id === pagoRenta.id_renta);
          
          if (rentaInfo) {
            // Si aún no tenemos clienteInfo y esta renta tiene id_persona, obtenerlo
            if (!clienteInfo && rentaInfo.id_persona) {
              clienteInfo = clientesData?.find(c => c.id === rentaInfo.id_persona);
            }
            
            // Encontrar plataforma a través de la cuenta
            const cuentaInfo = cuentasData?.find(c => c.id === rentaInfo.id_cuenta);
            if (cuentaInfo && cuentaInfo.id_plataforma) {
              const plataformaInfo = plataformasData?.find(p => p.id === cuentaInfo.id_plataforma);
              
              if (plataformaInfo) {
                // Guardar como principal si es la primera
                if (!plataformaInfoPrincipal) {
                  plataformaInfoPrincipal = plataformaInfo;
                }
                
                // Verificar si esta plataforma ya está en el array para evitar duplicados
                const existente = plataformasAsociadas.some(p => p.id === plataformaInfo.id);
                if (!existente) {
                  // Obtener el precio de la plataforma
                  const precioPlataforma = plataformaInfo.precio || null;
                  
                  // Verificar si hay cupón aplicado a esta renta
                  let descuentoCupon = null;
                  let precioFinal = precioPlataforma;
                  
                  if (rentaInfo.id_cupon_persona) {
                    // Buscar información del cupón
                    const { data: cuponPersonaData, error: cuponError } = await supabase
                      .from('cupon_persona')
                      .select('id_cupon, cupon(descuento)')
                      .eq('id', rentaInfo.id_cupon_persona)
                      .single();
                      
                    if (!cuponError && cuponPersonaData && cuponPersonaData.cupon) {
                      descuentoCupon = cuponPersonaData.cupon.descuento;
                      
                      // Calcular precio final si hay descuento
                      if (precioPlataforma && descuentoCupon) {
                        const precioBase = parseFloat(precioPlataforma);
                        // El descuento ya viene como valor absoluto, no necesita cálculo adicional
                        const descuento = parseFloat(descuentoCupon);
                        precioFinal = (precioBase - descuento).toString();
                      }
                    }
                  }
                  
                  plataformasAsociadas.push({
                    id: plataformaInfo.id,
                    nombre: plataformaInfo.nombre || 'Sin nombre',
                    precio: precioPlataforma,
                    descuento: descuentoCupon,
                    precio_final: precioFinal
                  });
                }
              }
            }
          }
        }
        
        // Asignar colores aleatorios a las plataformas para mostrarlas
        const coloresFondo = [
          'bg-blue-500',  // azul
          'bg-green-500', // verde
          'bg-purple-500', // púrpura
          'bg-pink-500',  // rosa
          'bg-yellow-500', // amarillo
          'bg-red-500',   // rojo
          'bg-indigo-500', // índigo
          'bg-orange-500', // naranja
        ];
        
        const plataformasConColor = plataformasAsociadas.map((plat, index) => ({
          ...plat,
          color: coloresFondo[index % coloresFondo.length]
        }));
        
        processedPayments.push({
          ...pago,
          nombre_cliente: clienteInfo?.nombre_completo || null,
          correo_cliente: clienteInfo?.correo || null,
          plataforma: plataformaInfoPrincipal?.nombre || null, // Mantener para compatibilidad
          plataformas: plataformasConColor,
          id_renta: pagosRentaParaEstePago[0]?.id_renta || null
        });
      }

      // Resultado final
      return {
        pagos: processedPayments,
        pagosRenta: pagoRentaData || [],
        rentas: rentasData || [],
        clientes: clientesData || []
      };
    } catch (err) {
      toast.error("Error al cargar datos de pagos");
      throw err;
    }
  };

  return useQuery({
    queryKey: ["payments"],
    queryFn: fetchPaymentsData
  });
}; 