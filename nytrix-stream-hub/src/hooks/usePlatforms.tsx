import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Platform } from "@/types/platform";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para obtener plataformas de la base de datos con
 * actualización en tiempo real a través de Supabase Realtime
 */
export const usePlatforms = () => {
  // Acceder al queryClient para invalidar la consulta cuando se detecten cambios
  const queryClient = useQueryClient();

  // Configurar suscripción a cambios en tiempo real
  useEffect(() => {
    // Suscripción a cambios en la tabla 'plataforma' con manejo específico de cada tipo de evento
    const subscription = supabase
      .channel('plataforma-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'plataforma' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['platforms'] });
          toast.success("Nueva plataforma añadida");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'plataforma' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['platforms'] });
          toast.info("Plataforma actualizada");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'plataforma' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['platforms'] });
          toast.info("Plataforma eliminada");
        }
      )
      .subscribe();

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["platforms"],
    queryFn: async (): Promise<Platform[]> => {
      const { data, error } = await supabase
        .from('plataforma')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) {
        console.error("Error fetching platforms:", error);
        toast.error("Error al cargar las plataformas");
        throw error;
      }
      
      return data || [];
    }
  });
};
