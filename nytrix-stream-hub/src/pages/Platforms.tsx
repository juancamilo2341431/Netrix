import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PlatformCard from "@/components/home/PlatformCard";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { RentModal } from "@/components/home/RentModal";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type PlatformWithAvailability = Tables<'plataforma'> & { 
  rent_count: number, 
  popular?: boolean,
  has_available_accounts: boolean,
  coming_soon?: boolean
};

export default function Platforms() {
  const [platforms, setPlatforms] = useState<PlatformWithAvailability[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);
  const { user } = useAuth();
  
  // Si el usuario no está autenticado, redirigir a la página de login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Hacer scroll al inicio cuando se monte el componente
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchAllPlatforms = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Obtener todas las plataformas con estado "mostrar"
        const { data: allPlatformsData, error: platformsError } = await supabase
          .from('plataforma')
          .select('*')
          .eq('estado', 'mostrar');

        if (platformsError) throw platformsError;
        if (!allPlatformsData) throw new Error("No se encontraron plataformas.");

        // 2. Obtener las cuentas rentadas
        const { data: rentedAccountsData, error: accountsError } = await supabase
          .from('cuenta')
          .select('id_plataforma')
          .eq('estado', 'alquilada');

        if (accountsError) throw accountsError;
        
        // 3. Obtener cuentas disponibles por plataforma
        const { data: availableAccountsData, error: availableError } = await supabase
          .from('cuenta')
          .select('id_plataforma, id')
          .eq('estado', 'disponible');
          
        if (availableError) throw availableError;
        
        // Contar cuentas disponibles por plataforma
        const availableCountByPlatform: { [key: number]: number } = {};
        if (availableAccountsData) {
          for (const account of availableAccountsData) {
            if (account.id_plataforma) {
              availableCountByPlatform[account.id_plataforma] = 
                (availableCountByPlatform[account.id_plataforma] || 0) + 1;
            }
          }
        }

        const platformRentCounts: { [key: number]: number } = {};
        if (rentedAccountsData) {
          for (const account of rentedAccountsData) {
            if (account.id_plataforma) {
              platformRentCounts[account.id_plataforma] = (platformRentCounts[account.id_plataforma] || 0) + 1;
            }
          }
        }

        let combinedPlatforms: PlatformWithAvailability[] = allPlatformsData.map(platform => {
          // Verificar si la plataforma tiene cuentas disponibles
          const hasAvailableAccounts = (availableCountByPlatform[platform.id] || 0) > 0;
          
          // Determinar si la plataforma es "próximamente disponible" en lugar de "agotada"
          // Por ejemplo, si es una plataforma nueva (creada recientemente) pero sin cuentas todavía
          const isNewPlatform = new Date(platform.created_at).getTime() > 
                                Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 días
                                
          const isComingSoon = !hasAvailableAccounts && isNewPlatform;
          
          return {
            ...platform,
            rent_count: platformRentCounts[platform.id] || 0,
            has_available_accounts: hasAvailableAccounts,
            coming_soon: isComingSoon
          };
        });

        // Ordenar por popularidad (número de rentas)
        combinedPlatforms.sort((a, b) => {
          // Primero mostrar plataformas con cuentas disponibles
          if (a.has_available_accounts && !b.has_available_accounts) return -1;
          if (!a.has_available_accounts && b.has_available_accounts) return 1;
          
          // Después por número de rentas
          return b.rent_count - a.rent_count;
        });
        
        combinedPlatforms = combinedPlatforms.map((platform, index) => ({
          ...platform,
          popular: index < 3 && platform.rent_count > 0 && platform.has_available_accounts,
        }));

        setPlatforms(combinedPlatforms);

      } catch (err: any) {
        console.error("Error fetching platforms:", err);
        setError(err.message || "Error al cargar las plataformas.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllPlatforms();
  }, []);

  // Filtrar plataformas según el término de búsqueda
  const filteredPlatforms = platforms?.filter(platform => 
    platform.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Manejar el evento de renta
  const handleRent = (platformId: number) => {
    setSelectedPlatformId(platformId);
    setIsRentModalOpen(true);
  };
  
  // Cerrar el modal de renta
  const handleCloseRentModal = () => {
    setIsRentModalOpen(false);
    setSelectedPlatformId(null);
  };

  return (
    <MainLayout>
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-10 max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Todas las Plataformas</h1>
            <p className="text-muted-foreground text-lg">
              Explora todas nuestras plataformas de streaming y encuentra la que mejor se adapte a tus necesidades
            </p>
          </div>

          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar plataforma..."
                className="pl-10 bg-background border-nytrix-purple/20"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading && (
              [...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3 h-full">
                  <Skeleton className="h-[160px] w-full rounded-t-lg" />
                  <div className="p-3 space-y-2 bg-card rounded-b-lg flex-grow">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-1/3 mt-2" />
                  </div>
                </div>
              ))
            )}

            {error && !loading && (
              <div className="text-center text-red-500 w-full col-span-full">
                <p>Error al cargar plataformas: {error}</p>
              </div>
            )}

            {!loading && !error && filteredPlatforms && (
              filteredPlatforms.length > 0 ? (
                filteredPlatforms.map((platform) => (
                  <div key={platform.id}>
                    <PlatformCard
                      name={platform.nombre ?? 'Sin Nombre'}
                      logo={platform.imagen ?? 'https://via.placeholder.com/300'}
                      price={parseFloat(platform.precio ?? '0')}
                      popular={platform.popular}
                      available={platform.has_available_accounts}
                      comingSoon={platform.coming_soon}
                      platformId={platform.id}
                      onRent={handleRent}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center col-span-full py-12">
                  <p className="text-lg text-muted-foreground mb-2">
                    No se encontraron plataformas que coincidan con tu búsqueda.
                  </p>
                  {searchTerm && (
                    <p className="text-sm">
                      Intenta con otro término o elimina los filtros.
                    </p>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </section>
      
      {/* Modal de renta */}
      <RentModal 
        isOpen={isRentModalOpen}
        onClose={handleCloseRentModal}
        platformId={selectedPlatformId}
      />
    </MainLayout>
  );
} 