import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { differenceInDays } from 'date-fns';

// Definir el tipo para los datos combinados que necesitamos
export type RentedAccountData = {
  id: number;
  accountId: number | null;
  personaId: number | null;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  platformName: string | null;
  platformEmail: string | null;
  startDate: string | null;
  endDate: string | null;
  status: Database["public"]["Enums"]["estado_renta"] | null;
  created_at: string; 
  last_updated: string | null;
  basePrice: number | null; // Precio base de la plataforma
  couponPrice: number | null; // Precio del cupón aplicado
  subtotal: number | null; // Precio base - precio cupón
  remainingDays: number | null; // Días restantes hasta la fecha de fin
};

// --- Función para obtener datos de Supabase ---
const fetchRentedAccounts = async (): Promise<RentedAccountData[]> => {
  try {
    const { data, error: fetchError } = await supabase
      .from('renta')
      .select(`
        id,
        fecha_inicio,
        fecha_fin,
        estado,
        created_at,
        last_updated,
        id_cuenta,
        id_persona,
        id_cupon_persona,
        persona ( 
          nombre_completo,
          correo,
          telefono
        ),
        cuenta ( 
          correo, 
          plataforma ( nombre, precio )
        ),
        cupon_persona (
          id_cupon,
          cupon (
            descuento
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      throw new Error(fetchError.message || "Error al obtener las rentas");
    }
    
    // Fecha actual para calcular días restantes
    const currentDate = new Date();

    // Mapear los datos al formato RentedAccountData
    const formattedData: RentedAccountData[] = data.map(item => {
      // Obtener el precio base de la plataforma
      const basePrice = item.cuenta?.plataforma?.precio 
        ? parseFloat(item.cuenta.plataforma.precio)
        : null;
      
      // Obtener el descuento del cupón si existe
      const couponDiscount = item.cupon_persona?.cupon?.descuento 
        ? parseFloat(item.cupon_persona.cupon.descuento)
        : null;
      
      // Calcular el precio del cupón en base al descuento y precio base
      const couponPrice = couponDiscount ? couponDiscount : null;
      
      // Calcular el subtotal
      const subtotal = (basePrice && couponPrice) 
        ? (basePrice - couponPrice) 
        : basePrice;
      
      // Calcular días restantes
      let remainingDays = null;
      if (item.fecha_fin) {
        const endDate = new Date(item.fecha_fin);
        const daysLeft = differenceInDays(endDate, currentDate);
        remainingDays = daysLeft > 0 ? daysLeft : 0; // Mínimo 0 días
      }

      return {
        id: item.id,
        accountId: item.id_cuenta,
        personaId: item.id_persona,
        userName: item.persona?.nombre_completo ?? 'N/A',
        userEmail: item.persona?.correo ?? null,
        userPhone: item.persona?.telefono ?? null,
        platformName: item.cuenta?.plataforma?.nombre ?? 'N/A',
        platformEmail: item.cuenta?.correo ?? 'N/A',
        startDate: item.fecha_inicio,
        endDate: item.fecha_fin,
        status: item.estado,
        created_at: item.created_at,
        last_updated: item.last_updated,
        basePrice,
        couponPrice,
        subtotal,
        remainingDays
      };
    });

    return formattedData;
  } catch (err: any) {
    console.error("Error processing rented accounts data:", err);
    // Propagar el error para que React Query lo maneje
    throw new Error(err.message || "Error al procesar datos de rentas");
  }
};

// --- Función para actualizar estados de rentas según condiciones de fechas ---
const updateRentalStates = async () => {
  try {
    const fechaActual = new Date();
    
    // 1. Actualizar rentas que están entre 0 y 7 días de vencer 
    // La función SQL ahora utiliza CURRENT_DATE internamente para el rango
    const { error: proximo_error } = await supabase
      .rpc('actualizar_rentas_proximas_a_vencer', { 
        fecha_referencia: fechaActual.toISOString().split('T')[0] 
      });
    
    if (proximo_error) {
      console.error("Error actualizando rentas próximas:", proximo_error);
    }
    
    // 2. Buscar rentas vencidas (1 día después de fecha_fin) y en estado "proximo"
    const unDiaAntes = new Date(fechaActual);
    unDiaAntes.setDate(unDiaAntes.getDate() - 1);
    
    const fechaUnDiaAntes = unDiaAntes.toISOString().split('T')[0];
    
    // Actualizar rentas vencidas y sus cuentas asociadas
    const { error: vencida_error } = await supabase
      .rpc('actualizar_rentas_vencidas', { 
        fecha_referencia: fechaUnDiaAntes 
      });
      
    if (vencida_error) {
      console.error("Error actualizando rentas vencidas:", vencida_error);
    }
  } catch (err) {
    console.error("Error en actualización automática de estados:", err);
  }
};

// --- Hook personalizado useRentedAccounts ---
export const useRentedAccounts = () => {
  const queryClient = useQueryClient();
  const queryKey = ['rentedAccounts']; // Clave única para la query

  // Usar useQuery para obtener los datos
  const { data, isLoading, error, refetch } = useQuery<RentedAccountData[], Error>({
    queryKey: queryKey,
    queryFn: fetchRentedAccounts,
    // Opciones adicionales de React Query (opcional)
    // staleTime: 5 * 60 * 1000, // 5 minutos antes de considerar los datos "stale"
    // refetchOnWindowFocus: false, 
  });

  // Efecto para la suscripción a tiempo real
  useEffect(() => {
    // Crear el canal de Supabase
    const channel = supabase
      .channel('renta_realtime_channel') // Nombre único para el canal
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'renta' }, // Escucha cambios en RENTA
        (payload) => {
          // console.log('Realtime change received (renta):', payload);
          // Usar un toast menos intrusivo o quitarlo si prefieres
          // toast.info("Actualizando rentas...", { duration: 1500 });
          // Invalidar la query para que React Query refetchee los datos
          queryClient.invalidateQueries({ queryKey });
        }
      )
      // --- NUEVO: Añadir listener para la tabla CUENTA --- 
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cuenta' }, // Escucha cambios en CUENTA
        (payload) => {
          // Podríamos filtrar aquí si solo nos interesan ciertos cambios (ej: cambio de estado)
          // Pero por simplicidad, invalidaremos siempre que 'cuenta' cambie, 
          // ya que podría afectar a una renta mostrada.
          // console.log('Realtime change received (cuenta):', payload);
          // toast.info("Actualizando estado de cuentas...", { duration: 1500 });
          queryClient.invalidateQueries({ queryKey });
        }
      )
      // --- Listener para cupones ---
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cupon_persona' }, // Escucha cambios en CUPON_PERSONA
        (payload) => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cupon' }, // Escucha cambios en CUPON
        (payload) => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      // --- FIN NUEVO --- 
      .subscribe((status, err) => {
         if (status === 'SUBSCRIBED') {
            // console.log('Realtime channel for renta subscribed successfully');
            
            // Ejecutar la actualización de estados al iniciar la suscripción
            updateRentalStates();
         } else if (status === 'CHANNEL_ERROR') {
           console.error('Realtime channel subscription error:', err);
           toast.error("Error de conexión en tiempo real", { description: err?.message });
         } else if (status === 'TIMED_OUT') {
            console.warn('Realtime channel subscription timed out.');
            toast.warning("La conexión en tiempo real expiró.");
         }
      });
      
    // Programar la actualización automática de estados cada 12 horas
    const intervalId = setInterval(() => {
      updateRentalStates();
    }, 12 * 60 * 60 * 1000); // 12 horas en milisegundos

    // Función de limpieza para desuscribirse al desmontar
    return () => {
      clearInterval(intervalId); // Limpiar el intervalo
      supabase.removeChannel(channel)
        // .then(() => console.log('Realtime channel for renta unsubscribed.'))
        .catch(err => console.error('Error unsubscribing realtime channel:', err));
    };
  }, [queryClient, queryKey]); // Dependencias del efecto

  return {
    data: data ?? [], // Devolver array vacío si data es undefined
    isLoading,
    error,
    refetch, // Exponer la función refetch por si se necesita manualmente
    updateRentalStates // Exponer la función para poder actualizarla manualmente si es necesario
  };
}; 