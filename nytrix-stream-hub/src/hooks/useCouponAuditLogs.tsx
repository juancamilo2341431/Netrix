import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AuditLog } from "./useAuditLogs";

export const useCouponAuditLogs = () => {
  return useQuery({
    queryKey: ["coupon-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria")
        .select(`
          *,
          persona:id_persona (nombre_completo)
        `)
        .or('acccion.ilike.%cupón%,acccion.ilike.%cupon%')
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