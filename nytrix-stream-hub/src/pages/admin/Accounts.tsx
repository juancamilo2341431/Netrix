import { useState, useMemo, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { AccountsHeader } from "@/components/admin/accounts/AccountsHeader";
import { AccountsFilters } from "@/components/admin/accounts/AccountsFilters";
import { AccountsTable, Account } from "@/components/admin/accounts/AccountsTable";
import { AccountsStats } from "@/components/admin/accounts/AccountsStats";
import { toast } from "sonner";
import { useAccounts } from "@/hooks/useAccounts";
import { usePlatforms } from "@/hooks/usePlatforms";
import { useQueryClient } from "@tanstack/react-query";
import { CreateAccountButton } from "@/components/admin/accounts/CreateAccountButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Eye, EyeOff } from "lucide-react";

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [lastCreatedAccount, setLastCreatedAccount] = useState<Account | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const { user } = useAuth();
  
  // Get queryClient for manual cache invalidation
  const queryClient = useQueryClient();
  
  // Fetch real accounts data from Supabase
  // Este hook ahora incluye suscripción en tiempo real a la tabla 'cuenta'
  const { data: allAccounts = [], isLoading, error } = useAccounts();
  
  // Obtener el ID del usuario autenticado
  useEffect(() => {
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
  
  // Filtrar cuentas para mostrar solo aquellas en estado "disponible", "alquilada" o "tramite"
  const accounts = useMemo(() => {
    return allAccounts.filter(account => 
      account.estado === "disponible" || 
      account.estado === "alquilada" || 
      account.estado === "tramite"
    );
  }, [allAccounts]);
  
  // Fetch platforms data for the dropdown
  const { data: platformsData = [] } = usePlatforms();
  
  // Get unique platforms from accounts for filtering
  const platforms = Array.from(new Set((accounts || []).map(account => account.platform || "")))
    .filter(platform => platform !== "");
  
  // Handle account creation
  const handleAccountCreated = (newAccount: Account) => {
    // Guardamos la última cuenta creada con la contraseña visible
    setLastCreatedAccount(newAccount);
    
    // Con Realtime activado, no es necesario actualizar manualmente la caché
    // ya que se recibirá automáticamente una notificación de cambio en la tabla
    // Sin embargo, lo dejamos para compatibilidad inmediata
    queryClient.setQueryData<Account[]>(["accounts"], (oldAccounts = []) => {
      // Si la cuenta ya existe (por ID), la reemplazamos
      const accountExists = oldAccounts.some(acc => acc.id === newAccount.id);
      
      if (accountExists) {
        return oldAccounts.map(acc => 
          acc.id === newAccount.id ? newAccount : acc
        );
      } else {
        // Si no existe, la añadimos al principio
        return [newAccount, ...oldAccounts];
      }
    });
    
    toast.success("Cuenta creada exitosamente");
  };

  // Handle account update
  const handleAccountUpdated = (updatedAccount: Account) => {
    // Con Realtime activado, no es necesario actualizar manualmente la caché
    // ya que se recibirá automáticamente una notificación de cambio en la tabla
    // Sin embargo, lo dejamos para compatibilidad inmediata
    queryClient.setQueryData<Account[]>(["accounts"], (oldAccounts = []) => {
      return oldAccounts.map(acc => 
        acc.id === updatedAccount.id ? updatedAccount : acc
      );
    });
  };

  return (
    <AdminLayout 
      title="Gestión de Cuentas"
      renderChildren={(isDesktopSidebarCollapsed) => (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl font-bold tracking-tight">Cuentas Registradas</h1>
              <p className="text-muted-foreground">
                {`Visualiza y administra todas las cuentas de la plataforma. Actualmente hay ${allAccounts ? allAccounts.length : 0} cuentas en total.`}
              </p>
            </div>
            <Button onClick={() => setShowStats(!showStats)} variant="outline" className="mb-4 sm:mb-0 w-full sm:w-auto">
              {showStats ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showStats ? "Ocultar Estadísticas" : "Mostrar Estadísticas"}
            </Button>
          </div>

          {showStats && (
            <div 
              className={`py-2 mx-auto ${
                isDesktopSidebarCollapsed 
                ? 'md:max-w-screen-lg'
                : 'md:max-w-screen-md'
              }`}
            >
              <AccountsStats />
            </div>
          )}
          
          <div className="flex justify-end">
            <CreateAccountButton 
              onAccountCreated={handleAccountCreated}
              platforms={platformsData || []} 
              userId={userId}
            />
          </div>
          
          <AccountsFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterPlatform={filterPlatform}
            setFilterPlatform={setFilterPlatform}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            platforms={platforms}
          />
          
          <AccountsTable
            accounts={accounts}
            searchTerm={searchTerm}
            filterPlatform={filterPlatform}
            filterStatus={filterStatus}
            isLoading={isLoading}
            error={error as Error | null}
            onAccountUpdated={handleAccountUpdated}
            userId={userId}
          />
        </div>
      )}
    />
  );
}
