import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Database, Tables } from "@/integrations/supabase/types";
import { useEffect } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

export type ClientAccountStatus = "active" | "expiring" | "expired" | "warranty";

export type ClientAccount = {
  id: number;
  platform: string;
  logo: string;
  email: string;
  password: string;
  expiresAt: string;
  status: ClientAccountStatus;
  cuenta_id: number;
  cuenta_estado: Database["public"]["Enums"]["estado_cuenta"] | null;
  renta_estado: Database["public"]["Enums"]["estado_renta"] | null;
};

/**
 * Hook para obtener las cuentas rentadas por un cliente, con actualizaciones en tiempo real.
 */
export const useClientAccounts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Efecto para configurar el canal Realtime
  useEffect(() => {
    // No hacer nada si no hay usuario
    if (!userId) return;

    let channel: RealtimeChannel | null = null;
    let idPersona: number | null = null;

    const setupRealtime = async () => {
      // 1. Obtener id_persona (necesario para filtrar el canal)
      const { data: personaData, error: personaError } = await supabase
        .from("persona")
        .select("id")
        .eq("id_user", userId)
        .single();

      if (personaError || !personaData) {
        console.error("Realtime: Error obteniendo id_persona para el canal:", personaError);
        // No podemos configurar el canal sin id_persona
        return;
      }
      idPersona = personaData.id;

      // 2. Crear y suscribirse al canal filtrado por id_persona
      channel = supabase
        .channel(`client_rentas_${idPersona}`)
        .on<Tables<'renta'> >(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'renta',
            filter: `id_persona=eq.${idPersona}` // Filtrar eventos por el id_persona del cliente
          },
          (payload) => {
            console.log('Client Realtime event received:', payload);
            // Invalidar la query de useQuery para forzar un refetch
            // Esto re-ejecutará queryFn y obtendrá los datos actualizados
            queryClient.invalidateQueries({ queryKey: ['clientAccounts', userId] });
            toast.info("Tus cuentas se han actualizado."); // Notificación opcional
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Realtime: Conectado al canal client_rentas_${idPersona}`);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime Error:', status, err);
            toast.error('Error de conexión en tiempo real', { description: err?.message });
          } else {
            console.log('Realtime status:', status); // Otros estados (CONNECTING, CLOSED)
          }
        });
    };

    setupRealtime();

    // Limpieza al desmontar o si cambia el userId
    return () => {
      if (channel) {
        supabase.removeChannel(channel).catch(err => console.error("Error removing channel:", err));
        console.log(`Realtime: Desconectado del canal client_rentas_${idPersona}`);
      }
    };
  }, [userId, queryClient, supabase]);

  return useQuery({
    queryKey: ["clientAccounts", userId],
    queryFn: async (): Promise<ClientAccount[]> => {
      if (!userId) {
        return [];
      }

      // Obtener el id_persona basado en el user.id
      const { data: personaData, error: personaError } = await supabase
        .from("persona")
        .select("id")
        .eq("id_user", userId)
        .single();

      if (personaError) {
        console.error("Error obteniendo id_persona:", personaError);
        toast.error("Error obteniendo información del usuario");
        return [];
      }

      const idPersona = personaData.id;

      // Ahora obtenemos las rentas del cliente con las cuentas y plataformas asociadas
      const { data: rentas, error: rentasError } = await supabase
        .from("renta")
        .select(`
          id,
          fecha_inicio,
          fecha_fin,
          estado,
          cuenta:id_cuenta(
            id,
            correo,
            contrasenia,
            estado,
            metadata_perfil,
            plataforma:id_plataforma(
              id,
              nombre,
              imagen
            )
          )
        `)
        .eq("id_persona", idPersona);

      if (rentasError) {
        console.error("Error obteniendo rentas:", rentasError);
        toast.error("Error obteniendo cuentas rentadas");
        return [];
      }

      // Procesamos los datos, desencriptando las contraseñas cuando sea posible
      const accounts: ClientAccount[] = [];
      
      for (const renta of rentas.filter(r => r.cuenta)) {
        let password = "••••••••";
        
        // Si tenemos un metadata_perfil, intentamos desencriptarlo
        if (renta.cuenta.metadata_perfil) {
          const { data: decryptedPwd, error: decryptError } = await supabase
            .rpc('decrypt_password', { encrypted_password: renta.cuenta.metadata_perfil });
            
          if (!decryptError && decryptedPwd) {
            password = decryptedPwd;
          }
        }
        
        // Determinar estado basado en fechas
        let status: ClientAccountStatus;
        if (renta.estado === 'garantia') {
          status = "warranty";
        } else {
          const today = new Date();
          const finDate = renta.fecha_fin ? new Date(renta.fecha_fin.replace(' ', 'T') + 'Z') : null;
          const isValidDate = finDate instanceof Date && !isNaN(finDate.getTime());

          if (isValidDate && finDate) {
            const daysUntilExpiration = Math.ceil((finDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiration <= 0) {
              status = "expired";
            } else if (daysUntilExpiration <= 7) {
              status = "expiring";
            } else {
              status = "active";
            }
          } else {
            console.warn(`Fecha de fin inválida o nula para renta ID: ${renta.id}. Estado por defecto: active`);
            status = "active";
          }
        }
        
        // Formatear fecha de expiración
        const finDateForFormat = renta.fecha_fin ? new Date(renta.fecha_fin.replace(' ', 'T') + 'Z') : null;
        const isValidFinDate = finDateForFormat instanceof Date && !isNaN(finDateForFormat.getTime());
        const options: Intl.DateTimeFormatOptions = { 
          day: "numeric", 
          month: "long", 
          year: "numeric" 
        };
        const expiresAt = isValidFinDate && finDateForFormat ? finDateForFormat.toLocaleDateString("es-ES", options) : "Indefinido";
        
        accounts.push({
          id: renta.id,
          platform: renta.cuenta.plataforma?.nombre || "Desconocida",
          logo: renta.cuenta.plataforma?.imagen || "https://picsum.photos/seed/unknown/300/300",
          email: renta.cuenta.correo || "",
          password,
          expiresAt,
          status,
          cuenta_id: renta.cuenta.id,
          cuenta_estado: renta.cuenta.estado,
          renta_estado: renta.estado
        });
      }
        
      return accounts;
    },
    enabled: !!userId
  });
};
