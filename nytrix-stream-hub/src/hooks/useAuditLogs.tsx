import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type AuditLog = {
  id: number;
  created_at: string;
  id_persona: number | null;
  acccion: string | null;
  user_name?: string | null;
};

/**
 * Hook para obtener logs de auditoría con
 * actualización en tiempo real a través de Supabase Realtime
 */
export const useAuditLogs = () => {
  // Acceder al queryClient para invalidar la consulta cuando se detecten cambios
  const queryClient = useQueryClient();

  // Configurar suscripción a cambios en tiempo real para la tabla 'auditoria'
  useEffect(() => {
    // Suscripción a cambios en la tabla 'auditoria'
    const auditSubscription = supabase
      .channel('auditoria-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'auditoria' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
          // No mostrar toast para evitar spam, ya que la auditoría se actualiza constantemente
        }
      )
      .subscribe();

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      auditSubscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria")
        .select(`
          *,
          persona:id_persona (nombre_completo)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform the data to include user_name
      return data.map((log: any): AuditLog => ({
        id: log.id,
        created_at: log.created_at,
        id_persona: log.id_persona,
        acccion: log.acccion,
        user_name: log.persona?.nombre_completo || "Usuario desconocido"
      }));
    },
  });
};
