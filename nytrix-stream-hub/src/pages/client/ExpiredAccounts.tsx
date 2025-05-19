import { useState, useMemo, useEffect } from "react";
import ClientLayout from "@/components/layout/ClientLayout";
import AccountCard from "@/components/client/AccountCard";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addDays } from "date-fns";
import { generateBoldPaymentLink } from "@/integrations/bold/boldClient";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatCurrencyCOP } from "@/utils/numberFormatting";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { Search, SlidersHorizontal } from "lucide-react";

// Tipo para la información extendida de las cuentas con precio
interface AccountWithPrice {
  id: number | string;
  platform: string;
  logo: string;
  email: string;
  precio: number;
  precioOriginal: number;
  descuento: number;
  cuponAplicado?: {
    id: number;
    nombre: string;
    codigo: string;
    cuponPersonaId: number;
  };
}

// Tipo para los cupones
interface CouponType {
  id: number;
  codigo: string;
  descuento: string;
  nombre: string;
  id_plataforma: number | null;
  cuponPersonaId: number;
}

export default function ExpiredAccounts() {
  const { data: allAccounts, isLoading, error, refetch } = useClientAccounts();
  const [selectedAccountIds, setSelectedAccountIds] = useState<Set<string | number>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBulkRenewingAvailable, setIsBulkRenewingAvailable] = useState(false);
  const [accountsWithPrices, setAccountsWithPrices] = useState<AccountWithPrice[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalDescuento, setTotalDescuento] = useState(0);
  const [userCoupons, setUserCoupons] = useState<CouponType[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const [emailFilter, setEmailFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");

  const expiredAccounts = useMemo(() => {
    return allAccounts?.filter(acc => acc.status === "expired") || [];
  }, [allAccounts]);

  const uniquePlatforms = useMemo(() => {
    const platforms = expiredAccounts.map(acc => acc.platform);
    return [...new Set(platforms)].sort();
  }, [expiredAccounts]);

  const filteredAccounts = useMemo(() => {
    let accountsToFilter = expiredAccounts;
    if (emailFilter) {
      accountsToFilter = accountsToFilter.filter(acc => 
        acc.email.toLowerCase().includes(emailFilter.toLowerCase())
      );
    }
    if (platformFilter && platformFilter !== "Todas") {
      accountsToFilter = accountsToFilter.filter(acc => 
        acc.platform === platformFilter
      );
    }
    return accountsToFilter;
  }, [expiredAccounts, emailFilter, platformFilter]);

  const renewableFilteredAccounts = useMemo(() => {
    return filteredAccounts.filter(acc => acc.cuenta_estado === 'disponible');
  }, [filteredAccounts]);

  const selectedAccounts = useMemo(() => {
    return filteredAccounts.filter(acc => selectedAccountIds.has(acc.id));
  }, [filteredAccounts, selectedAccountIds]);

  // Cargar los cupones del usuario
  useEffect(() => {
    if (user) {
      loadUserCoupons();
    }
  }, [user]);

  // Cargar precios cuando se abra el diálogo de confirmación
  useEffect(() => {
    if (showConfirmDialog && selectedAccounts.length > 0) {
      loadAccountPrices();
    }
  }, [showConfirmDialog, selectedAccounts, userCoupons]);

  // Función para cargar los cupones del usuario
  const loadUserCoupons = async () => {
    try {
      // Primero obtener el ID de persona del usuario
      const { data: personaData, error: personaError } = await supabase
        .from('persona')
        .select('id')
        .eq('id_user', user.id)
        .single();
        
      if (personaError || !personaData) {
        return;
      }
      
      // Luego obtener los cupones activos para esa persona
      const { data: cuponsData, error: cuponsError } = await supabase
        .from('cupon_persona')
        .select(`
          id,
          cupon (
            id,
            codigo,
            descuento,
            nombre,
            id_plataforma
          )
        `)
        .eq('id_persona', personaData.id)
        .eq('estado', 'activo');
        
      if (cuponsError) {
        return;
      }
      
      // Transformar los datos para tener un formato más fácil de usar
      const coupons = cuponsData
        .filter(cp => cp.cupon) // Filtrar casos donde cupon es null
        .map(cp => ({
          id: cp.cupon!.id,
          codigo: cp.cupon!.codigo,
          descuento: cp.cupon!.descuento,
          nombre: cp.cupon!.nombre,
          id_plataforma: cp.cupon!.id_plataforma,
          cuponPersonaId: cp.id
        }));
      
      setUserCoupons(coupons);
    } catch (err) {
    }
  };

  // Función para cargar los precios de las cuentas seleccionadas
  const loadAccountPrices = async () => {
    try {
      const accountPrices: AccountWithPrice[] = [];
      let sumTotal = 0;
      let sumDescuento = 0;

      for (const account of selectedAccounts) {
        // Obtener información de la cuenta incluyendo precio
        const { data: rentaData, error: rentaError } = await supabase
          .from('renta')
          .select(`
            id,
            cuenta(
              id,
              plataforma(
                id,
                nombre,
                precio
              )
            )
          `)
          .eq('id', typeof account.id === 'string' ? parseInt(account.id, 10) : account.id)
          .single();

        if (rentaError || !rentaData) {
          continue;
        }

        const plataformaId = rentaData.cuenta?.plataforma?.id;
        const precioOriginal = rentaData.cuenta?.plataforma?.precio 
                           ? parseFloat(rentaData.cuenta.plataforma.precio) 
                           : 0;
        
        // Buscar si hay un cupón aplicable a esta plataforma
        let descuento = 0;
        let cuponAplicado = undefined;
        const cuponEspecifico = userCoupons.find(c => c.id_plataforma === plataformaId);
        const cuponGeneral = userCoupons.find(c => c.id_plataforma === null);
        
        // Priorizar cupón específico de la plataforma sobre uno general
        if (cuponEspecifico) {
          descuento = parseFloat(cuponEspecifico.descuento || '0');
          cuponAplicado = {
            id: cuponEspecifico.id,
            nombre: cuponEspecifico.nombre,
            codigo: cuponEspecifico.codigo,
            cuponPersonaId: cuponEspecifico.cuponPersonaId
          };
        } else if (cuponGeneral) {
          descuento = parseFloat(cuponGeneral.descuento || '0');
          cuponAplicado = {
            id: cuponGeneral.id,
            nombre: cuponGeneral.nombre,
            codigo: cuponGeneral.codigo,
            cuponPersonaId: cuponGeneral.cuponPersonaId
          };
        }

        // Calcular precio final con descuento
        const precio = Math.max(0, precioOriginal - descuento);

        accountPrices.push({
          id: account.id,
          platform: account.platform,
          logo: account.logo,
          email: account.email,
          precio: precio,
          precioOriginal: precioOriginal,
          descuento: descuento,
          cuponAplicado: cuponAplicado
        });

        sumTotal += precio;
        sumDescuento += descuento;
      }

      setAccountsWithPrices(accountPrices);
      setTotalPrice(sumTotal);
      setTotalDescuento(sumDescuento);
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "No se pudieron cargar los precios de las cuentas", 
        variant: "destructive" 
      });
    }
  };

  // Función para renovar una cuenta directamente con redirección a Bold
  const directRenew = async (rentaId: number | string, diasExtension = 30, isMultipleRenewal = false, allSelectedAccounts = []) => {
    try {
      const rentaIdNum = typeof rentaId === 'string' ? parseInt(rentaId, 10) : rentaId;
      
      // Obtener la información de la cuenta con precio desde nuestros datos procesados
      const accountInfo = accountsWithPrices.find(acc => acc.id === rentaId);
      
      if (!accountInfo) {
        toast({ 
          title: "Error", 
          description: "No se pudo procesar la información de precios", 
          variant: "destructive" 
        });
        return false;
      }
      
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
              nombre
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

      // Usar el precio con descuento ya calculado
      const precio = accountInfo.precio;
      
      // Nombre de plataforma para la descripción
      const nombrePlataforma = rentaData.cuenta?.plataforma?.nombre || "Plataforma";
      
      // Descripción con info de cupón si aplicable
      let description = "";
      
      if (isMultipleRenewal) {
        // Si hay múltiples renovaciones, construir una descripción general
        const totalAccounts = allSelectedAccounts.length;
        if (totalAccounts > 1) {
          description = `Renovación de ${totalAccounts} cuentas por ${diasExtension} días`;
        } else {
          description = `Renovación de ${nombrePlataforma} por ${diasExtension} días`;
          if (accountInfo.cuponAplicado) {
            description += ` (Cupón: ${accountInfo.cuponAplicado.codigo})`;
          }
        }
      } else {
        // Renovación individual - descripción estándar
        description = `Renovación de ${nombrePlataforma} por ${diasExtension} días`;
        if (accountInfo.cuponAplicado) {
          description += ` (Cupón: ${accountInfo.cuponAplicado.codigo})`;
        }
      }

      // En caso de múltiples cuentas, necesitamos el monto total de todas
      const montoTotal = isMultipleRenewal ? totalPrice : precio;

      // Generar enlace de pago con Bold
      // Asegurarse de que id_cuenta e id_persona existen en rentaData
      if (!rentaData || typeof rentaData.id_persona === 'undefined') {
        toast({
          title: "Error de datos",
          description: "No se pudo obtener la información completa de la cuenta para el pago.",
          variant: "destructive"
        });
        return false;
      }
      
      // Preparamos la información de las cuentas para enviar a la Edge Function
      let cuentasParaBold: { id_cuenta: number | string }[];

      if (isMultipleRenewal) {
        if (!allSelectedAccounts || allSelectedAccounts.length === 0) {
          toast({ title: "Error interno", description: "No hay cuentas seleccionadas para procesar.", variant: "destructive" });
          return false;
        }

        // Intentamos obtener id_cuenta. Si no existe, lo buscamos.
        const promisesParaObtenerIdCuenta = allSelectedAccounts.map(async (cuenta) => {
          if (typeof cuenta.id_cuenta !== 'undefined') {
            return { id_cuenta: cuenta.id_cuenta };
          } else if (typeof cuenta.id !== 'undefined') { // Asumimos que cuenta.id es id_renta
            try {
              const { data: rentaData, error: rentaError } = await supabase
                .from('renta')
                .select('id_cuenta')
                .eq('id', cuenta.id)
                .single();
              
              if (rentaError) {
                return null;
              }
              if (rentaData && typeof rentaData.id_cuenta !== 'undefined') {
                return { id_cuenta: rentaData.id_cuenta };
              } else {
                return null;
              }
            } catch (e) {
              return null;
            }
          } else {
            return null;
          }
        });

        const resultadosConIdCuenta = (await Promise.all(promisesParaObtenerIdCuenta)).filter(c => c !== null) as { id_cuenta: number | string }[];
        
        if (resultadosConIdCuenta.length !== allSelectedAccounts.length) {
          toast({ title: "Error de datos", description: "Faltó información de ID de cuenta para algunas selecciones.", variant: "destructive" });
          return false;
        }
        cuentasParaBold = resultadosConIdCuenta;

      } else {
        // Para renovación individual, necesitamos id_cuenta de rentaData
        if (typeof rentaData.id_cuenta === 'undefined') {
            toast({
              title: "Error de datos",
              description: "No se pudo obtener la información completa de la cuenta para el pago.",
              variant: "destructive"
            });
            return false;
        }
        cuentasParaBold = [{ id_cuenta: rentaData.id_cuenta }];
      }

      if (cuentasParaBold.length === 0) {
        toast({ title: "Error", description: "No se seleccionaron cuentas para el pago.", variant: "destructive" });
        return false;
      }
      
      const paymentLinkData = await generateBoldPaymentLink(
        montoTotal, 
        description,
        // Modificado para enviar el array de cuentasInfo
        cuentasParaBold, 
        rentaData.id_persona  // id_persona para la Edge Function
      );

      if (!paymentLinkData || !paymentLinkData.paymentLinkUrl) {
        toast({ 
          title: "Error", 
          description: "No se pudo generar el enlace de pago", 
          variant: "destructive" 
        });
        return false;
      }

      // Actualizar todas las cuentas seleccionadas a estado "tramite"
      if (isMultipleRenewal) {
        // Procesamos todas las cuentas seleccionadas
        const cuentaIds = [];
        for (const acc of accountsWithPrices) {
          const rentaSeleccionada = allSelectedAccounts.find(selectedAcc => selectedAcc.id === acc.id);
          if (rentaSeleccionada) {
            const { data: rentaInfo } = await supabase
              .from('renta')
              .select('id_cuenta')
              .eq('id', typeof acc.id === 'string' ? parseInt(acc.id, 10) : acc.id)
              .single();
            
            if (rentaInfo?.id_cuenta) {
              cuentaIds.push(rentaInfo.id_cuenta);
              // Actualizar estado de la cuenta a tramite
              const { error: updateError } = await supabase
                .from('cuenta')
                .update({ 
                  estado: 'tramite', 
                  last_updated: new Date().toISOString() 
                })
                .eq('id', rentaInfo.id_cuenta);
                
              if (updateError) {
              }
            }
          }
        }
      } else if (rentaData.id_cuenta) {
        // Actualización individual
        const { error: updateCuentaError } = await supabase
          .from('cuenta')
          .update({ 
            estado: 'tramite', 
            last_updated: new Date().toISOString() 
          })
          .eq('id', rentaData.id_cuenta);

        if (updateCuentaError) {
        }
      }

      // Almacenar la información de renovación en localStorage para recuperarla después del pago
      if (isMultipleRenewal) {
        // En caso de múltiple renovación, guardamos un array de renovaciones
        const renovacionesMultiples = allSelectedAccounts.map(acc => {
          const selectedAccountInfo = accountsWithPrices.find(a => a.id === acc.id);
          return {
            id_renta: acc.id,
            id_cuenta: acc.id_cuenta,
            id_persona: rentaData.id_persona, // Usamos el mismo id_persona para todas
            fecha_inicio: new Date().toISOString(),
            fecha_fin: addDays(new Date(), diasExtension).toISOString(),
            estado: 'pendiente',
            referencia_bold: paymentLinkData.orderReference,
            monto: selectedAccountInfo?.precio || 0,
            cupon_id: selectedAccountInfo?.cuponAplicado?.id || null,
            cupon_persona_id: selectedAccountInfo?.cuponAplicado?.cuponPersonaId || null
          };
        });

        localStorage.setItem('pendingRenovaciones', JSON.stringify({
          renovaciones: renovacionesMultiples,
          monto_total: montoTotal,
          referencia_bold: paymentLinkData.orderReference,
          es_multiple: true
        }));
      } else {
        // Renovación individual - formato estándar
        const renovacionData = {
          id_cuenta: rentaData.id_cuenta,
          id_persona: rentaData.id_persona,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: addDays(new Date(), diasExtension).toISOString(),
          estado: 'pendiente',
          referencia_bold: paymentLinkData.orderReference,
          monto: precio,
          cupon_id: accountInfo.cuponAplicado?.id || null,
          cupon_persona_id: accountInfo.cuponAplicado?.cuponPersonaId || null,
          es_multiple: false
        };

        localStorage.setItem('pendingRenovacion', JSON.stringify(renovacionData));
      }

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

  const handleSelectChange = (accountId: number | string, isSelected: boolean) => {
    setSelectedAccountIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(accountId);
      } else {
        newSet.delete(accountId);
      }
      return newSet;
    });
  };

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      const renewableIds = renewableFilteredAccounts.map(acc => acc.id);
      setSelectedAccountIds(new Set(renewableIds));
    } else {
      setSelectedAccountIds(new Set());
    }
  };

  const handleOpenConfirmDialog = () => {
    if (selectedAccountIds.size === 0) {
      toast({ 
        title: "Selección vacía", 
        description: "Por favor selecciona al menos una cuenta para renovar", 
        variant: "destructive" 
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleBulkRenew = async () => {
    setShowConfirmDialog(false);
    const accountsToRenew = filteredAccounts.filter(acc => selectedAccountIds.has(acc.id));
    
    if (accountsToRenew.length === 0) {
      toast({ 
        title: "Selección vacía", 
        description: "No hay cuentas seleccionadas para renovar", 
        variant: "destructive" 
      });
      return;
    }
    
    setIsBulkRenewingAvailable(true);

    try {
      // En lugar de renovar solo la primera cuenta, procesamos todas las seleccionadas
      if (accountsToRenew.length === 1) {
        // Si solo hay una cuenta, usamos el método estándar
        await directRenew(accountsToRenew[0].id);
      } else {
        // Para múltiples cuentas, usamos el modo de renovación múltiple
        await directRenew(accountsToRenew[0].id, 30, true, accountsToRenew);
      }
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "Ocurrió un error durante el proceso de renovación", 
        variant: "destructive"
      });
      setIsBulkRenewingAvailable(false);
      setSelectedAccountIds(new Set());
    }
  };

  const allRenewableSelected = renewableFilteredAccounts.length > 0 && 
                             selectedAccountIds.size === renewableFilteredAccounts.length;
  const isRenewButtonDisabled = selectedAccountIds.size === 0 || isBulkRenewingAvailable;

  let content;
  if (isLoading) {
    content = (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(2)].map((_, i) => (
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
    );
  } else if (error) {
    content = (
          <div className="p-8 text-center">
            <p className="text-destructive">Error al cargar las cuentas</p>
          </div>
    );
  } else if (expiredAccounts.length === 0) {
    content = (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">¡Genial! No tienes cuentas vencidas</h2>
            <p className="text-muted-foreground mt-2">
              Todas tus cuentas están activas y en buen estado
            </p>
          </div>
    );
  } else if (filteredAccounts.length === 0) {
    content = (
      <div className="text-center p-8 text-muted-foreground">
        No hay cuentas vencidas que coincidan con tus filtros.
      </div>
    );
  } else {
    content = (
      <div className="flex overflow-x-auto space-x-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:space-x-0 sm:pb-0">
        {filteredAccounts.map((account) => {
          const isActuallyRenewable = account.cuenta_estado === 'disponible';
          
          return (
            <AccountCard 
              key={account.id} 
              {...account} 
              isRenewable={isActuallyRenewable}
              selected={selectedAccountIds.has(account.id)}
              onSelectChange={isActuallyRenewable ? handleSelectChange : undefined}
            />
          );
        })}
      </div>
    );
  }

  return (
    <ClientLayout hideCartIconOnMobile={true}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Cuentas Vencidas</h1>
        </div>

        {!isLoading && !error && expiredAccounts.length > 0 && (
          <>
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-destructive">
                Estas cuentas han expirado. Renuévalas para recuperar el acceso (si están disponibles).
              </p>
            </div>

            <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="relative w-full sm:flex-1 md:max-w-xs lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email-filter"
                  placeholder="Buscar por email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="pl-10 w-full bg-card border-border focus:border-nytrix-purple"
                />
              </div>
              <div className="flex flex-row justify-between items-center sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                {renewableFilteredAccounts.length > 0 && (
                  <Button
                    onClick={handleOpenConfirmDialog}
                    disabled={isRenewButtonDisabled}
                    className="w-10 h-10 p-0 sm:w-auto sm:h-10 sm:px-4 sm:py-2 flex items-center justify-center bg-gradient-nytrix hover:opacity-90"
                  >
                    <span className="sm:hidden">↻</span>
                    <span className="hidden sm:inline">{isBulkRenewingAvailable ? "Renovando..." : `Renovar (${selectedAccountIds.size})`}</span>
                  </Button>
                )}
                <div className="w-full flex-1 sm:w-auto sm:flex-none md:min-w-[200px] lg:min-w-[220px]">
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger 
                      id="platform-filter" 
                      className="w-full bg-card border-border hover:border-nytrix-purple/50 data-[state=open]:border-nytrix-purple"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todas las plataformas</SelectItem>
                      {uniquePlatforms.map(platform => (
                        <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {renewableFilteredAccounts.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <div className="order-2 sm:order-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="select-all-expired"
                      checked={allRenewableSelected}
                      onCheckedChange={handleSelectAllChange}
                    />
                    <Label htmlFor="select-all-expired" className="text-sm font-medium">
                      Seleccionar Todas Disponibles ({renewableFilteredAccounts.length})
                    </Label>
                  </div>
                </div>
              </div>
            )}

            {content}

          </>
        )}

        {(isLoading || error || expiredAccounts.length === 0) && content}

      </div>

      {/* Diálogo de confirmación */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar renovación</DialogTitle>
            <DialogDescription id="confirm-dialog-description">
              Estás a punto de renovar las siguientes cuentas:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-[300px] overflow-y-auto pr-2 custom-sidebar-scroll" aria-describedby="confirm-dialog-description">
            <div className="space-y-2">
              {accountsWithPrices.map(account => (
                <div key={account.id} className="flex items-center gap-3 p-2 border rounded-md">
                  <div className="w-8 h-8 flex-shrink-0">
                    <img src={account.logo} alt={account.platform} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{account.platform}</p>
                    <p className="text-sm text-muted-foreground truncate">{account.email}</p>
                    {account.cuponAplicado && (
                      <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {account.cuponAplicado.codigo}
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {account.descuento > 0 ? (
                      <>
                        <p className="text-sm line-through text-muted-foreground">
                          ${formatCurrencyCOP(account.precioOriginal)}
                        </p>
                        <p className="font-medium text-green-600">
                          ${formatCurrencyCOP(account.precio)}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium">
                        ${formatCurrencyCOP(account.precio)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="border-t border-border pt-4">
            {totalDescuento > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">Descuento aplicado:</span>
                <span className="text-green-600">-${formatCurrencyCOP(totalDescuento)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center font-semibold text-lg mb-4">
              <span>Total a pagar:</span>
              <span>${formatCurrencyCOP(totalPrice)}</span>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-800 text-sm">
              <p>Al continuar, serás redirigido a la pasarela de pagos para procesar la renovación.</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkRenew}
              className="bg-gradient-nytrix hover:opacity-90"
            >
              Proceder a Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
}
