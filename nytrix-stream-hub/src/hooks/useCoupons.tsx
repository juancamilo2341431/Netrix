import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Tipos 
export interface Cupon {
  id: number;
  nombre: string | null;
  codigo: string | null;
  descripcion: string | null;
  descuento: string | null;
  created_at: string;
  last_updated: string | null;
  id_plataforma: number | null;
  plataforma?: string | null;
  usuarios?: number[];
  usuariosActivos?: number[];
  estado?: "activo" | "inactivo" | null;
}

export interface Plataforma {
  id: number;
  nombre: string | null;
}

export interface Usuario {
  id: number;
  nombre_completo: string | null;
  correo: string | null;
  avatar?: string | null;
  estado_cupon?: string | null;
}

export interface CuponPersona {
  id: number;
  id_cupon: number | null;
  id_persona: number | null;
  estado: string | null;
  created_at: string;
  last_updated?: string | null;
}

/**
 * Hook para obtener cupones de la base de datos con
 * actualización en tiempo real a través de Supabase Realtime
 */
export const useCoupons = () => {
  // Acceder al queryClient para invalidar la consulta cuando se detecten cambios
  const queryClient = useQueryClient();

  // Configurar suscripción a cambios en tiempo real para la tabla 'cupon'
  useEffect(() => {
    // Suscripción a cambios en la tabla 'cupon'
    const couponSubscription = supabase
      .channel('cupon-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'cupon' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['coupons'] });
          toast.success("Nuevo cupón añadido");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'cupon' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['coupons'] });
          toast.info("Cupón actualizado");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'cupon' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['coupons'] });
          toast.info("Cupón eliminado");
        }
      )
      .subscribe();

    // Suscripción a cambios en la tabla 'cupon_persona'
    const couponPersonSubscription = supabase
      .channel('cupon-persona-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'cupon_persona' 
        }, 
        () => {
          // Cuando hay cambios en las relaciones cupon_persona, también actualizamos los cupones
          queryClient.invalidateQueries({ queryKey: ['coupons'] });
        }
      )
      .subscribe();

    // Limpiar las suscripciones cuando el componente se desmonte
    return () => {
      couponSubscription.unsubscribe();
      couponPersonSubscription.unsubscribe();
    };
  }, [queryClient]);

  // Función para cargar datos de cupones con todas sus relaciones
  const fetchCouponsData = async () => {
    try {
      // Cargar plataformas
      const { data: platformsData, error: platformsError } = await supabase
        .from('plataforma')
        .select('id, nombre')
        .eq('estado', 'mostrar');

      if (platformsError) throw platformsError;

      // Cargar cupones
      const { data: couponsData, error: couponsError } = await supabase
        .from('cupon')
        .select('*');

      if (couponsError) throw couponsError;

      // Cargar relaciones cupon_persona
      const { data: couponPersonData, error: couponPersonError } = await supabase
        .from('cupon_persona')
        .select('*');

      if (couponPersonError) throw couponPersonError;

      // Cargar usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('persona')
        .select('id, nombre_completo, correo');

      if (usersError) throw usersError;

      // Procesar los datos para agregar plataforma y usuarios a cada cupón
      const processedCoupons: Cupon[] = couponsData?.map(coupon => {
        // Encontrar la plataforma relacionada
        const plataforma = platformsData?.find(p => p.id === coupon.id_plataforma);
        
        // Encontrar todos los usuarios relacionados con el cupón
        const allUserRelations = couponPersonData?.filter(cp => cp.id_cupon === coupon.id) || [];
        
        // Filtrar para obtener solo los usuarios activos
        const activeUserRelations = allUserRelations.filter(rel => rel.estado !== "suspendido");
        
        // Obtener IDs de todos los usuarios (activos e inactivos)
        const userIds = allUserRelations
          .map(cp => cp.id_persona)
          .filter(id => id !== null) as number[];
          
        // Obtener IDs solo de usuarios activos
        const activeUserIds = activeUserRelations
          .map(cp => cp.id_persona)
          .filter(id => id !== null) as number[];
          
        return {
          ...coupon,
          plataforma: plataforma?.nombre || null,
          usuarios: userIds,
          usuariosActivos: activeUserIds
        };
      }) || [];

      // Resultado final
      return {
        cupones: processedCoupons,
        plataformas: platformsData || [],
        usuarios: usersData || [],
        cuponPersonas: couponPersonData || []
      };
    } catch (err) {
      toast.error("Error al cargar datos de cupones");
      throw err;
    }
  };

  return useQuery({
    queryKey: ["coupons"],
    queryFn: fetchCouponsData
  });
}; 