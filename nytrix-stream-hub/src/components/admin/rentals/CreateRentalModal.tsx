import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Database } from '@/integrations/supabase/types';

// Tipos locales para los datos que necesitamos
type ClientUser = Pick<Database['public']['Tables']['persona']['Row'], 'id' | 'nombre_completo' | 'correo'>;
type Platform = Pick<Database['public']['Tables']['plataforma']['Row'], 'id' | 'nombre'>;

interface CreateRentalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRentalCreated: () => void; // Callback para refrescar la lista principal
}

export default function CreateRentalModal({
  isOpen,
  onOpenChange,
  onRentalCreated,
}: CreateRentalModalProps) {
  const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [duration, setDuration] = useState<number>(1); // Duración en meses
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<number | null>(null);

  // Cargar usuarios cliente y plataformas al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoadingData(true);
        setAvailableAccounts(null); // Resetear cuentas disponibles
        try {
          // Fetch client users
          const { data: usersData, error: usersError } = await supabase
            .from('persona')
            .select('id, nombre_completo, correo')
            .eq('rol', 'cliente')
            .eq('estado', 'habilitado') // Asegurarnos que solo clientes habilitados
            .order('nombre_completo');

          if (usersError) throw usersError;
          setClientUsers(usersData || []);

          // Fetch platforms
          const { data: platformsData, error: platformsError } = await supabase
            .from('plataforma')
            .select('id, nombre')
            .eq('estado', 'mostrar') // Solo plataformas visibles
            .order('nombre');

          if (platformsError) throw platformsError;
          setPlatforms(platformsData || []);

        } catch (error) {
          console.error("Error fetching data for modal:", error);
          toast.error("Error al cargar datos para el formulario.");
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // Efecto para verificar cuentas disponibles cuando cambia la plataforma seleccionada
  useEffect(() => {
    if (selectedPlatformId) {
      const checkAvailability = async () => {
        setAvailableAccounts(null); // Indicar carga
        try {
          const { count, error } = await supabase
            .from('cuenta')
            .select('*', { count: 'exact', head: true })
            .eq('id_plataforma', selectedPlatformId)
            .eq('estado', 'disponible');

          if (error) throw error;
          setAvailableAccounts(count ?? 0);
        } catch (error) {
          console.error("Error fetching available accounts:", error);
          setAvailableAccounts(0); // Asumir 0 si hay error
        }
      };
      checkAvailability();
    } else {
      setAvailableAccounts(null);
    }
  }, [selectedPlatformId]);

  // Calcular fecha de fin
  const calculateEndDate = (startDate: Date, months: number): Date => {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedPlatformId || quantity < 1 || duration < 1) {
      toast.warning("Por favor completa todos los campos.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verificar disponibilidad nuevamente por si acaso cambió
      const { data: availableAccountsData, error: availabilityError } = await supabase
        .from('cuenta')
        .select('id')
        .eq('id_plataforma', selectedPlatformId)
        .eq('estado', 'disponible')
        .limit(quantity);

      if (availabilityError) throw availabilityError;

      if (!availableAccountsData || availableAccountsData.length < quantity) {
        toast.error(`No hay suficientes cuentas disponibles. Solo quedan ${availableAccountsData?.length ?? 0}.`);
        // Actualizar el contador visual
        setAvailableAccounts(availableAccountsData?.length ?? 0);
        setIsSubmitting(false);
        return;
      }

      const accountsToRentIds = availableAccountsData.map(acc => acc.id);

      // 2. Preparar datos de la renta
      const startDate = new Date();
      const endDate = calculateEndDate(startDate, duration);
      const personaId = parseInt(selectedUserId);

      // 3. Crear las rentas y actualizar cuentas (idealmente en transacción, pero Supabase JS client tiene limitaciones)
      // Lo hacemos secuencialmente, manejando errores.

      const rentalPromises = accountsToRentIds.map(accountId => async () => {
         // Actualizar estado de la cuenta a 'alquilada'
         const { error: updateError } = await supabase
           .from('cuenta')
           .update({ estado: 'alquilada', last_updated: startDate.toISOString() })
           .eq('id', accountId);

         if (updateError) {
             console.error(`Error updating account ${accountId}:`, updateError);
             // Podríamos intentar revertir, pero es complejo sin transacciones.
             // Por ahora, lanzamos un error para detener el proceso.
             throw new Error(`Error al actualizar estado de la cuenta ${accountId}.`);
         }

         // Crear registro de renta
         const { error: insertError } = await supabase
            .from('renta')
            .insert({
              id_persona: personaId,
              id_cuenta: accountId,
              fecha_inicio: startDate.toISOString(),
              fecha_fin: endDate.toISOString(),
              estado: 'rentada', // Estado inicial de la renta
              created_at: startDate.toISOString(),
              last_updated: startDate.toISOString()
              // id_cupon_persona se deja null por ahora
            });

         if (insertError) {
             console.error(`Error creating rental for account ${accountId}:`, insertError);
             // Intentar revertir el estado de la cuenta si la inserción falla
             await supabase.from('cuenta').update({ estado: 'disponible' }).eq('id', accountId);
             throw new Error(`Error al crear la renta para la cuenta ${accountId}.`);
         }
      });

      // Ejecutar promesas secuencialmente para mayor control de errores
      for (const promiseFn of rentalPromises) {
          await promiseFn();
      }

      toast.success(`${quantity} cuenta(s) rentada(s) exitosamente!`);
      onRentalCreated(); // Llama al callback para refrescar la tabla principal
      onOpenChange(false); // Cierra el modal
      resetForm();

    } catch (error: any) {
      console.error("Error creating rental:", error);
      toast.error(`Error al crear la renta: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setSelectedUserId("");
    setSelectedPlatformId("");
    setQuantity(1);
    setDuration(1);
    setAvailableAccounts(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetForm(); // Resetear al cerrar
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[525px] bg-card border-nytrix-purple/20">
        <DialogHeader>
          <DialogTitle>Crear Nueva Renta</DialogTitle>
          <DialogDescription>
            Selecciona el usuario, la plataforma y la duración de la renta.
          </DialogDescription>
        </DialogHeader>
        {isLoadingData ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-nytrix-purple" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Selector de Usuario */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">
                  Usuario
                </Label>
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  required
                >
                  <SelectTrigger id="user" className="col-span-3">
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.nombre_completo} ({user.correo})
                      </SelectItem>
                    ))}
                     {clientUsers.length === 0 && (
                         <p className='text-center text-sm text-muted-foreground p-4'>No hay clientes habilitados</p>
                     )}
                  </SelectContent>
                </Select>
              </div>

              {/* Selector de Plataforma */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="platform" className="text-right">
                  Plataforma
                </Label>
                 <div className="col-span-3 flex items-center gap-2">
                     <Select
                         value={selectedPlatformId}
                         onValueChange={setSelectedPlatformId}
                         required
                         className="flex-grow"
                     >
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Selecciona una plataforma" />
                      </SelectTrigger>
                      <SelectContent>
                        {platforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id.toString()}>
                            {platform.nombre}
                          </SelectItem>
                        ))}
                         {platforms.length === 0 && (
                             <p className='text-center text-sm text-muted-foreground p-4'>No hay plataformas disponibles</p>
                         )}
                      </SelectContent>
                    </Select>
                     {/* Indicador de cuentas disponibles */}
                     {selectedPlatformId && (
                         <span className={`text-xs px-2 py-1 rounded ${
                             availableAccounts === null ? 'bg-muted text-muted-foreground animate-pulse' : // Cargando
                             availableAccounts !== null && availableAccounts > 0 ? 'bg-green-100 text-green-700' : // Disponibles
                             'bg-red-100 text-red-700' // No disponibles
                         }`}>
                             {availableAccounts === null ? 'Verificando...' : `${availableAccounts} disp.`}
                         </span>
                     )}
                 </div>
              </div>

              {/* Cantidad de Cuentas */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="col-span-3"
                  required
                />
              </div>

              {/* Duración */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duración
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    className="flex-grow"
                    required
                  />
                  <span className="text-sm text-muted-foreground">Mes(es)</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                  type="submit"
                  disabled={isSubmitting || isLoadingData || !selectedUserId || !selectedPlatformId || availableAccounts === null || availableAccounts < quantity}
                  className="bg-gradient-nytrix hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando Renta...
                  </>
                ) : (
                  "Crear Renta"
                )}
              </Button>
            </DialogFooter>
             {/* Mensaje de error si no hay suficientes cuentas */}
             {selectedPlatformId && availableAccounts !== null && availableAccounts < quantity && (
                 <p className="text-red-600 text-sm text-center mt-3">
                     No hay suficientes cuentas disponibles ({availableAccounts}) para la cantidad solicitada ({quantity}).
                 </p>
             )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 