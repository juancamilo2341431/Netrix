import { useState } from "react";
import ClientLayout from "@/components/layout/ClientLayout";
import AccountsSummary from "@/components/client/AccountsSummary";
import AccountCard from "@/components/client/AccountCard";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { addDays } from "date-fns";
import { generateBoldPaymentLink } from "@/integrations/bold/boldClient";

export default function Dashboard() {
  const { data: allAccountsData, isLoading, error, refetch } = useClientAccounts();
  const [renewingAccountId, setRenewingAccountId] = useState<string | number | null>(null);
  const { toast } = useToast();
  
  // Count accounts by status
  const activeAccountsCount = allAccountsData?.filter(acc => acc.status === "active").length || 0;
  const expiringAccountsCount = allAccountsData?.filter(acc => acc.status === "expiring").length || 0;
  const expiredAccountsCount = allAccountsData?.filter(acc => acc.status === "expired").length || 0;
  
  // Función para renovar una cuenta directamente con redirección a Bold
  const directRenew = async (rentaId: number | string, diasExtension = 30) => {
    try {
      const rentaIdNum = typeof rentaId === 'string' ? parseInt(rentaId, 10) : rentaId;
      
      // Buscar la renta para obtener información necesaria
      const { data: rentaData, error: rentaError } = await supabase
        .from('renta')
        .select(`
          id_cuenta, 
          id_persona, 
          estado, 
          cuenta(
            id,
            plataforma(
              id,
              nombre,
              precio
            )
          )
        `)
        .eq('id', rentaIdNum)
        .single();

      if (rentaError || !rentaData) {
        toast({ 
          title: "Error", 
          description: "No se pudo obtener información de la renta", 
          variant: "destructive" 
        });
        return false;
      }

      // Verificamos si tenemos precio
      const precio = rentaData.cuenta?.plataforma?.precio 
                   ? parseFloat(rentaData.cuenta.plataforma.precio) 
                   : 10000; // Precio por defecto si no hay
      
      // Nombre de plataforma para la descripción
      const nombrePlataforma = rentaData.cuenta?.plataforma?.nombre || "Plataforma";

      // Generar enlace de pago con Bold
      const description = `Renovación de ${nombrePlataforma} por ${diasExtension} días`;
      
      // Asegurarse de que id_cuenta e id_persona existen en rentaData
      if (!rentaData || typeof rentaData.id_cuenta === 'undefined' || typeof rentaData.id_persona === 'undefined') {
        toast({ 
          title: "Error de datos", 
          description: "No se pudo obtener la información completa de la cuenta para el pago.", 
          variant: "destructive" 
        });
        return false;
      }

      // Para Dashboard, siempre es una renovación individual, así que creamos el array con una sola cuenta.
      const cuentasParaBold = [{ id_cuenta: rentaData.id_cuenta }];

      const paymentLinkData = await generateBoldPaymentLink(
        precio, 
        description,
        // Modificado para enviar un array con la cuenta única
        cuentasParaBold, 
        rentaData.id_persona   // id_persona para la Edge Function
      );

      if (!paymentLinkData || !paymentLinkData.paymentLinkUrl) {
        toast({ 
          title: "Error", 
          description: "No se pudo generar el enlace de pago", 
          variant: "destructive" 
        });
        return false;
      }

      // Actualizar la cuenta a estado "tramite"
      if (rentaData.id_cuenta) {
        const { error: updateCuentaError } = await supabase
          .from('cuenta')
          .update({ 
            estado: 'tramite', 
            last_updated: new Date().toISOString() 
          })
          .eq('id', rentaData.id_cuenta);

        if (updateCuentaError) {
          // console.error("Error al actualizar estado de cuenta:", updateCuentaError);
        }
      }

      // Almacenar la información de renovación en localStorage para recuperarla después del pago
      const renovacionData = {
        id_cuenta: rentaData.id_cuenta,
        id_persona: rentaData.id_persona,
        fecha_inicio: new Date().toISOString(),
        fecha_fin: addDays(new Date(), diasExtension).toISOString(),
        estado: 'pendiente',
        referencia_bold: paymentLinkData.orderReference,
        monto: precio
      };

      localStorage.setItem('pendingRenovacion', JSON.stringify(renovacionData));

      // Redirección a Bold
      toast({ 
        title: "Redirigiendo", 
        description: "Redirigiendo a la pasarela de pagos..."
      });
      
      // Redireccionar a la página de pago
      window.location.href = paymentLinkData.paymentLinkUrl;
      
      return true;
    } catch (err) {
      toast({ 
        title: "Error inesperado", 
        description: "Ocurrió un error al renovar la cuenta", 
        variant: "destructive" 
      });
      return false;
    }
  };
  
  // Lógica de renovación individual (adaptada de ExpiredAccounts)
  const handleRenew = async (accountId: string | number) => {
    setRenewingAccountId(accountId); // Marcar que esta cuenta se está renovando
    
    const accountToRenew = allAccountsData?.find(acc => acc.id === accountId);
    const isAvailable = accountToRenew?.cuenta_estado === 'disponible';

    // Para cuentas 'expiring', no necesitamos verificar disponibilidad, siempre se pueden renovar
    // Para cuentas 'expired', sí necesitamos verificar
    if (accountToRenew?.status === 'expired' && !isAvailable) {
      toast({ title: "Error", description: "Esta cuenta ya no está disponible para renovación.", variant: "destructive" });
      setRenewingAccountId(null);
      return;
    }
    
    try {
      // Renovar directamente con redirección a Bold
      await directRenew(accountId);
    } catch (err) {
      toast({ title: "Error", description: "No se pudo renovar la cuenta.", variant: "destructive" });
    } finally {
      setRenewingAccountId(null); // Limpiar estado de renovación
    }
  };
  
  return (
    <ClientLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard del Cliente</h1>
        </div>
        
        <AccountsSummary
          totalAccounts={allAccountsData?.length || 0}
          activeAccounts={activeAccountsCount}
          expiringAccounts={expiringAccountsCount}
          expiredAccounts={expiredAccountsCount}
        />
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Tus Cuentas</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-nytrix-purple/20 rounded-lg overflow-hidden">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-destructive">Error al cargar las cuentas</p>
            </div>
          ) : allAccountsData && allAccountsData.length > 0 ? (
            <div className="flex overflow-x-auto space-x-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:space-x-0 sm:pb-0">
              {allAccountsData.map((account) => {
                // Determinar si es renovable (expiring siempre lo es, expired depende de cuenta_estado)
                const isRenewable = account.status === 'expiring' || account.cuenta_estado === 'disponible';
                
                return (
                  <AccountCard 
                    key={account.id} 
                    {...account} 
                    // Pasar las props necesarias para el botón Renovar
                    onRenew={handleRenew} 
                    isRenewable={isRenewable}
                    isRenewing={renewingAccountId === account.id}
                    // No se necesita selección aquí
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-nytrix-purple/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-nytrix-purple"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold">No tienes cuentas activas</h2>
              <p className="text-muted-foreground mt-2 mb-4">
                Explora nuestra selección de plataformas y comienza a disfrutar del mejor contenido
              </p>
              <a
                href="/platforms"
                className="px-4 py-2 bg-gradient-nytrix text-white rounded-md"
              >
                Ver Plataformas
              </a>
            </div>
          )}
        </div>
      </div>
    </ClientLayout>
  );
}
