import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from '@/integrations/supabase/types';
import { RentedAccountData } from '@/hooks/useRentedAccounts'; // Reutilizar el tipo si es posible

interface EditRentalModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rentalData: RentedAccountData | null;
  onRentalUpdated: () => void; // Callback para refrescar
}

export default function EditRentalModal({
  isOpen,
  onOpenChange,
  rentalData,
  onRentalUpdated,
}: EditRentalModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [status, setStatus] = useState<Database["public"]["Enums"]["estado_renta"] | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Opciones de estado para la renta
  const rentalStatusOptions: { value: Database["public"]["Enums"]["estado_renta"]; label: string }[] = [
    { value: "rentada", label: "Rentada" },
    { value: "proximo", label: "Próximo a vencer" },
    { value: "vencida", label: "Vencida" },
    { value: "garantia", label: "En garantía" },
  ];

  // Cargar datos de la renta al abrir el modal
  useEffect(() => {
    if (isOpen && rentalData) {
      try {
          // Intentar parsear las fechas. Asumir UTC si no hay offset explícito.
          const parsedStartDate = rentalData.startDate ? parseISO(rentalData.startDate.includes('T') ? rentalData.startDate : rentalData.startDate.replace(' ', 'T') + 'Z') : undefined;
          const parsedEndDate = rentalData.endDate ? parseISO(rentalData.endDate.includes('T') ? rentalData.endDate : rentalData.endDate.replace(' ', 'T') + 'Z') : undefined;
          
          // Validar fechas antes de asignarlas
          setStartDate(!isNaN(parsedStartDate?.getTime() ?? NaN) ? parsedStartDate : undefined);
          setEndDate(!isNaN(parsedEndDate?.getTime() ?? NaN) ? parsedEndDate : undefined);
          setStatus(rentalData.status ?? "");
      } catch (error) {
          console.error("Error parsing rental dates:", error);
          toast.error("Error al cargar las fechas de la renta.");
          // Resetear fechas si hay error
          setStartDate(undefined);
          setEndDate(undefined);
          setStatus(rentalData.status ?? "");
      }
    } else if (!isOpen) {
      // Resetear el estado cuando el modal se cierra
      setStartDate(undefined);
      setEndDate(undefined);
      setStatus("");
    }
  }, [isOpen, rentalData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rentalData || !status) {
      toast.warning("Faltan datos para actualizar la renta.");
      return;
    }

    setIsSubmitting(true);

    // Preparar los datos para actualizar
    const updateData: Partial<Database['public']['Tables']['renta']['Update']> = {
      estado: status,
      last_updated: new Date().toISOString(),
      // Formatear fechas a ISO string si están definidas y son válidas
      fecha_inicio: startDate && !isNaN(startDate.getTime()) ? startDate.toISOString() : null,
      fecha_fin: endDate && !isNaN(endDate.getTime()) ? endDate.toISOString() : null,
    };

    try {
      // 1. Actualizar la tabla 'renta'
      const { error: rentalUpdateError } = await supabase
        .from('renta')
        .update(updateData)
        .eq('id', rentalData.id);

      if (rentalUpdateError) throw rentalUpdateError;

      // 2. Lógica especial si el estado cambió a 'vencida'
      const previousRentalStatus = rentalData.status;
      const newRentalStatus = status;
      let newAccountStatus: Database["public"]["Enums"]["estado_cuenta"] | null = null;

      if (newRentalStatus !== previousRentalStatus) {
        switch (newRentalStatus) {
          case 'rentada':
            newAccountStatus = 'alquilada';
            break;
          case 'garantia':
            // No hay estado 'garantia' en cuenta, asumimos que sigue alquilada
            newAccountStatus = 'alquilada';
            break;
          case 'vencida':
            newAccountStatus = 'revision';
            break;
          case 'proximo':
            // El estado 'proximo' en renta no cambia el estado de la cuenta directamente
            // Podría seguir siendo 'alquilada'
            newAccountStatus = null; // Indicar que no hay cambio necesario aquí
            break;
        }

        // Solo actualizar si hay un nuevo estado determinado y accountId existe
        if (newAccountStatus && rentalData.accountId) {
          const { error: accountUpdateError } = await supabase
            .from('cuenta')
            .update({ estado: newAccountStatus, last_updated: new Date().toISOString() })
            .eq('id', rentalData.accountId);

          if (accountUpdateError) {
            console.error(`Error updating associated account to '${newAccountStatus}':`, accountUpdateError);
            toast.error(`Renta actualizada, pero hubo un error al actualizar la cuenta a ${newAccountStatus}.`);
          } else {
            toast.info(`Cuenta asociada actualizada a estado: ${newAccountStatus}.`);
          }
        } else if (newAccountStatus === null) {
             // console.log(`Rental status changed to ${newRentalStatus}, no direct change needed for account status.`);
        } else if (!rentalData.accountId) {
             console.warn("No se pudo actualizar la cuenta porque falta accountId en rentalData");
             toast.warning("Renta actualizada, pero no se pudo actualizar el estado de la cuenta asociada (Falta ID).");
        }
      }

      toast.success("Renta actualizada correctamente!");
      onRentalUpdated(); // Refrescar la tabla principal
      onOpenChange(false); // Cerrar el modal

    } catch (error: any) {
      console.error("Error updating rental:", error);
      toast.error(`Error al actualizar la renta: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] bg-card border-nytrix-purple/20">
        <DialogHeader>
          <DialogTitle>Editar Renta</DialogTitle>
          <DialogDescription>
            Modifica las fechas o el estado de la renta para el usuario <span className="font-semibold">{rentalData?.userName ?? 'N/A'}</span> en la plataforma <span className="font-semibold">{rentalData?.platformName ?? 'N/A'}</span>.
          </DialogDescription>
        </DialogHeader>
        {rentalData ? (
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    {/* Fecha Inicio */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="startDate" className="text-right">
                            Fecha Inicio
                        </Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal border-nytrix-purple/20",
                                        !startDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, 'PPP', { locale: es }) : <span>Selecciona fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={setStartDate}
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Fecha Fin */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="endDate" className="text-right">
                            Fecha Fin
                        </Label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal border-nytrix-purple/20",
                                        !endDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, 'PPP', { locale: es }) : <span>Selecciona fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate} // Permitir seleccionar fecha de fin
                                    initialFocus
                                    locale={es}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Estado */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Estado
                        </Label>
                        <Select
                            value={status}
                            onValueChange={(value) => setStatus(value as Database["public"]["Enums"]["estado_renta"])}
                            required
                        >
                        <SelectTrigger id="status" className="col-span-3 border-nytrix-purple/20">
                            <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        <SelectContent>
                            {rentalStatusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
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
                        disabled={isSubmitting}
                        className="bg-gradient-nytrix hover:opacity-90"
                    >
                        {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Guardando...
                        </>
                        ) : (
                        "Guardar Cambios"
                        )}
                    </Button>
                </DialogFooter>
            </form>
        ) : (
          <div className="flex justify-center items-center h-40">
            <p className="text-muted-foreground">No se han cargado los datos de la renta.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 