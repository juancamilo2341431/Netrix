import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import AdminLayout from "@/components/layout/AdminLayout";
import { usePlatforms } from "@/hooks/usePlatforms";
import { PlatformsHeader } from "@/components/admin/platforms/PlatformsHeader";
import { PlatformSearch } from "@/components/admin/platforms/PlatformSearch";
import { PlatformsTable } from "@/components/admin/platforms/PlatformsTable";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Platforms() {
  // El hook usePlatforms ahora incluye suscripción Realtime a la tabla 'plataforma'
  // Las actualizaciones se reciben automáticamente cuando cambia cualquier plataforma
  const { data: platforms, isLoading, error, refetch } = usePlatforms();
  const [searchTerm, setSearchTerm] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const { user } = useAuth();
  
  useEffect(() => {
    // Fetch the persona ID for the current authenticated user
    const fetchUserId = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("persona")
          .select("id")
          .eq("id_user", user.id)
          .single();
          
        if (data && !error) {
          setUserId(data.id);
        }
      }
    };
    
    fetchUserId();
  }, [user]);
  
  // Mantener la función para compatibilidad con componentes existentes
  // Con Realtime activo, los datos se actualizarán automáticamente sin necesidad
  // de llamar a refetch() manualmente cuando hay cambios en la tabla
  const handlePlatformUpdated = () => {
    // Este refetch es redundante con Realtime funcionando, 
    // pero lo mantenemos para compatibilidad con los componentes existentes
    refetch();
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PlatformsHeader onPlatformCreated={handlePlatformUpdated} userId={userId} />
        <PlatformSearch searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <PlatformsTable 
          platforms={platforms || []} 
          isLoading={isLoading} 
          error={error as Error | null} 
          searchTerm={searchTerm}
          onPlatformUpdated={handlePlatformUpdated}
          userId={userId}
        />
      </div>
      <Toaster position="top-right" />
    </AdminLayout>
  );
}
