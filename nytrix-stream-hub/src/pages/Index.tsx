import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import Hero from "@/components/home/Hero";
import PlatformCard from "@/components/home/PlatformCard";
import { RentModal } from "@/components/home/RentModal";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";

type PlatformWithAvailability = Tables<'plataforma'> & { 
  rent_count: number, 
  popular?: boolean,
  has_available_accounts: boolean,
  coming_soon?: boolean,
  precio: string | null;
};

// Opciones de ordenación
const sortOptions = [
  { value: "popular", label: "Más Populares" },
  { value: "name_asc", label: "Nombre: A-Z" },
  { value: "name_desc", label: "Nombre: Z-A" },
  { value: "price_asc", label: "Precio: Menor a Mayor" },
  { value: "price_desc", label: "Precio: Mayor a Menor" },
];

export default function Index() {
  const [platforms, setPlatforms] = useState<PlatformWithAvailability[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados para el modal de renta
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState(sortOptions[0].value); // Por defecto "popular"
  const [totalFetchedPlatformsCount, setTotalFetchedPlatformsCount] = useState(0);

  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: allPlatformsData, error: platformsError } = await supabase
          .from('plataforma')
          .select('*')
          .eq('estado', 'mostrar');

        if (platformsError) throw platformsError;
        if (!allPlatformsData) throw new Error("No se encontraron plataformas.");

        const { data: rentedAccountsData, error: accountsError } = await supabase
          .from('cuenta')
          .select('id_plataforma')
          .eq('estado', 'alquilada');

        if (accountsError) throw accountsError;
        
        const { data: availableAccountsData, error: availableError } = await supabase
          .from('cuenta')
          .select('id_plataforma, id')
          .eq('estado', 'disponible');
          
        if (availableError) throw availableError;
        
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
          const hasAvailableAccounts = (availableCountByPlatform[platform.id] || 0) > 0;
          const isNewPlatform = new Date(platform.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
          const isComingSoon = !hasAvailableAccounts && isNewPlatform;
          return {
            ...platform,
            rent_count: platformRentCounts[platform.id] || 0,
            has_available_accounts: hasAvailableAccounts,
            coming_soon: isComingSoon,
            precio: platform.precio 
          };
        });
        
        setTotalFetchedPlatformsCount(combinedPlatforms.length);

        if (user && searchTerm) {
          combinedPlatforms = combinedPlatforms.filter(platform =>
            platform.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        switch (sortOrder) {
          case "name_asc":
            combinedPlatforms.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
            break;
          case "name_desc":
            combinedPlatforms.sort((a, b) => (b.nombre || "").localeCompare(a.nombre || ""));
            break;
          case "price_asc":
            combinedPlatforms.sort((a, b) => parseFloat(a.precio || "0") - parseFloat(b.precio || "0"));
            break;
          case "price_desc":
            combinedPlatforms.sort((a, b) => parseFloat(b.precio || "0") - parseFloat(a.precio || "0"));
            break;
          case "popular": 
          default:
            combinedPlatforms.sort((a, b) => {
              if (a.has_available_accounts && !b.has_available_accounts) return -1;
              if (!a.has_available_accounts && b.has_available_accounts) return 1;
              return (b.rent_count || 0) - (a.rent_count || 0);
            });
            break;
        }
        
        combinedPlatforms = combinedPlatforms.map((platform, index) => ({
          ...platform,
          popular: sortOrder === "popular" && index < 3 && (platform.rent_count || 0) > 0 && platform.has_available_accounts,
        }));
        
        const platformsToShow = user ? combinedPlatforms : combinedPlatforms.slice(0, 8);
        setPlatforms(platformsToShow);

      } catch (err: any) {
        console.error("Error fetching platforms:", err);
        setError(err.message || "Error al cargar las plataformas.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, [user, searchTerm, sortOrder]);

  const handleViewAllPlatforms = () => {
    if (user) {
      navigate('/platforms');
    } else {
      navigate('/login');
    }
  };

  const handleRent = (platformId: number) => {
    setSelectedPlatformId(platformId);
    setIsRentModalOpen(true);
  };

  const handleCloseRentModal = () => {
    setIsRentModalOpen(false);
    setSelectedPlatformId(null);
  };

  return (
    <MainLayout>
      {!user && <Hero />} 
      
      {user && (
        <section className="pt-6 pb-4 md:pt-10 md:pb-6 bg-background">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="text-center md:text-left mb-6 md:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gradient-nytrix">
                ¡Bienvenido de vuelta, {user.user_metadata?.nombre_completo || user.email}!
              </h1>
              <p className="text-muted-foreground text-sm sm:text-md md:text-lg mt-1">
                Explora nuestras plataformas y encuentra tu próxima renta.
              </p>
            </div>
            
            {/* Contenedor de filtros ajustado para móviles en una línea */}
            <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              {/* Contenedor del Input de búsqueda con flex-1 */}
              <div className="relative w-full sm:flex-1 md:max-w-xs lg:max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar plataforma..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full bg-card border-border focus:border-nytrix-purple"
                />
              </div>
              {/* Contenedor del Select ajustado para móviles */}
              <div className="w-auto self-end sm:self-auto md:min-w-[200px] lg:min-w-[220px]">
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-full bg-card border-border hover:border-nytrix-purple/50 data-[state=open]:border-nytrix-purple">
                    <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>
      )}

      {!user && (
        <section className="py-12 md:py-16 bg-nytrix-charcoal border-t border-nytrix-purple/10">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-10 md:mb-12 max-w-3xl mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 md:mb-4 text-white">¿Cómo funciona Nytrix?</h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-300">
                Acceder a tus plataformas de streaming favoritas nunca había sido tan fácil y económico
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-card p-4 md:p-6 rounded-lg border border-nytrix-purple/20 hover:shadow-lg hover:shadow-nytrix-purple/10 transition-all duration-300">
                <div className="mb-3 md:mb-4 bg-nytrix-purple/20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-nytrix-purple">1</span>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 md:mb-2">Elige tu plataforma</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  Selecciona entre nuestra amplia variedad de plataformas de streaming disponibles
                </p>
              </div>

              <div className="bg-card p-4 md:p-6 rounded-lg border border-nytrix-purple/20 hover:shadow-lg hover:shadow-nytrix-purple/10 transition-all duration-300">
                <div className="mb-3 md:mb-4 bg-nytrix-purple/20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-nytrix-purple">2</span>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 md:mb-2">Renta la cuenta</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  Paga una fracción del precio de la suscripción estándar por acceso completo
                </p>
              </div>

              <div className="bg-card p-4 md:p-6 rounded-lg border border-nytrix-purple/20 hover:shadow-lg hover:shadow-nytrix-purple/10 transition-all duration-300">
                <div className="mb-3 md:mb-4 bg-nytrix-purple/20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full">
                  <span className="text-base sm:text-lg md:text-xl font-bold text-nytrix-purple">3</span>
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-1 md:mb-2">Disfruta al instante</h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  Recibe tus credenciales inmediatamente y comienza a disfrutar del contenido
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section id="plataformas-section" className={`${user ? 'pt-0 pb-16' : 'py-16'} bg-background`}>
        <div className="container mx-auto px-4 md:px-6">
          
          {!user && (sortOrder === "popular" || !sortOrder) && (
            <div className="text-center mb-10 md:mb-12 max-w-5xl mx-auto">
              <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white opacity-90">
                Plataformas Populares
              </h2>
              <p className="text-gray-300 mt-3 text-base sm:text-lg md:text-xl">
                Las mejores plataformas de streaming al mejor precio.
              </p>
            </div>
          )}
          
          {/* Contenedor único y responsivo para la lista de plataformas */}
          <div className={`
            flex overflow-x-auto space-x-4 pb-4
            sm:grid sm:gap-x-6 sm:gap-y-8 
            sm:grid-cols-2 
            lg:grid-cols-3 
            ${user ? 'xl:grid-cols-4' : 'xl:grid-cols-4'} 
            sm:max-w-5xl sm:mx-auto sm:space-x-0 sm:pb-0
            `}>
            
            {/* Estado de carga */}
            {loading && (
              [...Array(user ? 8 : 4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72 sm:w-auto flex flex-col">
                  {/* Esqueleto de tarjeta */}
                  <Skeleton className="h-[160px] w-full rounded-t-lg" />
                  <div className="p-3 space-y-2 bg-card rounded-b-lg border border-t-0 border-border flex-grow">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-1/3 mt-2" />
                  </div>
                </div>
              ))
            )}

            {/* Estado de error */}
            {error && !loading && (
              <div className="w-full text-center text-red-500 py-12 sm:col-span-full">
                <p>Error al cargar plataformas: {error}</p>
              </div>
            )}

            {/* Plataformas cargadas o mensaje de "no hay plataformas" */}
            {!loading && !error && platforms && (
              platforms.length > 0 ? (
                platforms.map((platform) => (
                  <div key={platform.id} className="flex-shrink-0 w-72 sm:w-auto">
                    {/* Tarjeta de Plataforma */}
                    <PlatformCard
                      platformId={platform.id}
                      name={platform.nombre ?? 'Sin Nombre'}
                      logo={platform.imagen ?? 'https://via.placeholder.com/300'}
                      price={parseFloat(platform.precio ?? '0')}
                      popular={platform.popular} 
                      available={platform.has_available_accounts}
                      comingSoon={platform.coming_soon}
                      onRent={handleRent}
                    />
                  </div>
                ))
              ) : (
                <div className="w-full text-center text-muted-foreground py-12 sm:col-span-full">
                  <p>
                    {searchTerm ? "No se encontraron plataformas que coincidan con tu búsqueda." : "No hay plataformas disponibles en este momento."}
                  </p>
                </div>
              )
            )}
          </div>

          {!user && totalFetchedPlatformsCount > 8 && (
            <div className="mt-12 text-center max-w-5xl mx-auto">
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                ¿No encuentras lo que buscas? Tenemos más plataformas disponibles.
              </p>
              <div className="inline-flex bg-gradient-nytrix rounded-full p-[2px]">
                <button 
                  onClick={handleViewAllPlatforms}
                  className="px-6 py-2 rounded-full bg-nytrix-dark-purple hover:bg-transparent transition-colors duration-300 text-white text-sm sm:text-base"
                >
                  Ver todas las plataformas
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <RentModal 
        isOpen={isRentModalOpen}
        onClose={handleCloseRentModal}
        platformId={selectedPlatformId}
      />
    </MainLayout>
  );
}
