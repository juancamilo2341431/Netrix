import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Account, AccountStatus } from "@/components/admin/accounts/AccountsTable";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para obtener cuentas de la base de datos con seguridad mejorada
 * y actualización en tiempo real a través de Supabase Realtime
 */
export const useAccounts = () => {
  // Acceder al queryClient para invalidar la consulta cuando se detecten cambios
  const queryClient = useQueryClient();

  // Configurar suscripción a cambios en tiempo real
  useEffect(() => {
    // Suscripción a cambios en la tabla 'cuenta' con manejo específico de cada tipo de evento
    const subscription = supabase
      .channel('cuenta-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'cuenta' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
          toast.success("Nueva cuenta añadida al sistema");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'cuenta' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
          toast.info("Datos de cuenta actualizados");
        }
      )
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'cuenta' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['accounts'] });
          toast.info("Cuenta eliminada del sistema");
        }
      )
      .subscribe();

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<Account[]> => {
      try {
        // Fetch accounts with platform names joined using parameterized queries
        const { data, error } = await supabase
          .from('cuenta')
          .select(`
            id,
            correo,
            contrasenia,
            metadata_perfil,
            estado,
            created_at,
            last_updated,
            id_plataforma,
            plataforma:id_plataforma(id, nombre)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          toast.error("Error al cargar las cuentas");
          throw error;
        }
        
        if (!Array.isArray(data)) {
          toast.error("Formato de respuesta inválido");
          return [];
        }
        
        // For each account with metadata_perfil, call decrypt function
        const accountsWithDecryptedPasswords = await Promise.all(data.map(async account => {
          let decryptedPassword = "••••••••";
          
          if (account && account.metadata_perfil) {
            try {
              // Use RPC to decrypt password (prevents SQL injection)
              const { data: decryptData, error: decryptError } = await supabase
                .rpc('decrypt_password', { 
                  encrypted_password: account.metadata_perfil 
                });
                
              if (!decryptError && decryptData) {
                decryptedPassword = decryptData;
              }
            } catch (decryptException) {
              // Silenciar error
            }
          }
          
          // Make sure estado is properly typed as AccountStatus
          const estado = account.estado as AccountStatus;
          
          // Validate and sanitize all fields
          return {
            id: typeof account.id === 'number' ? account.id : 0,
            correo: account.correo ? String(account.correo) : "",
            contrasenia: decryptedPassword, // This is now the decrypted password from metadata_perfil
            estado: estado || "disponible", // Default to "disponible" if estado is null or undefined
            created_at: account.created_at ? String(account.created_at) : "",
            last_updated: account.last_updated ? String(account.last_updated) : "",
            id_plataforma: typeof account.id_plataforma === 'number' ? account.id_plataforma : 0,
            platform: account.plataforma?.nombre ? String(account.plataforma.nombre) : ""
          };
        }));
        
        return accountsWithDecryptedPasswords || [];
      } catch (error) {
        toast.error("Error inesperado al cargar las cuentas");
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false
  });
};
