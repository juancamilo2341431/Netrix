import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, Ban } from 'lucide-react';
import { WarrantyData } from '@/hooks/useWarranties'; // Tipo de datos de garantía
import { Tables } from '@/integrations/supabase/types'; // Para tipo Cuenta
import { ScrollArea } from '@/components/ui/scroll-area';
import { PasswordField } from '@/components/admin/accounts/form-fields/PasswordField'; // Ajustar ruta si es necesario
import { format, parseISO } from 'date-fns'; // Importar parseISO
import { es } from 'date-fns/locale';

interface ManageWarrantyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  warrantyData: WarrantyData | null;
  onWarrantyManaged: () => void; // Callback para refrescar la tabla principal
}

// Tipo simplificado para las cuentas disponibles
type AvailableAccount = Pick<Tables<'cuenta'>, 'id' | 'correo'>;

export default function ManageWarrantyDialog({
  isOpen,
  onOpenChange,
  warrantyData,
  onWarrantyManaged,
}: ManageWarrantyDialogProps) {
  const [newEndDate, setNewEndDate] = useState('');
  const [selectedNewAccountId, setSelectedNewAccountId] = useState<string>('no-replace');
  const [newPassword, setNewPassword] = useState('');
  const [availableAccounts, setAvailableAccounts] = useState<AvailableAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false); // Nuevo estado para rastrear cambios

  // Formateador de fecha local
  const formatDateLocale = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      // Asumir que la fecha de Supabase viene en formato ISO o similar
      const date = parseISO(dateString); 
      return format(date, "dd 'de' MMMM, yyyy", { locale: es });
    } catch (e) {
      console.error("Error formatting date for display:", e);
      return dateString; // Fallback
    }
  };

  // Cargar cuentas disponibles cuando el diálogo se abre y hay datos de garantía
  useEffect(() => {
    if (isOpen && warrantyData) {
      const platformId = warrantyData.cuenta?.id_plataforma;
      setNewEndDate(warrantyData.fecha_fin?.substring(0, 10) || '');
      setSelectedNewAccountId('no-replace'); // Iniciar con "No reemplazar" seleccionado
      setNewPassword('');
      setAvailableAccounts([]);

      if (platformId) {
        const fetchAccounts = async () => {
          setIsLoadingAccounts(true);
          try {
            const { data, error } = await supabase
              .from('cuenta')
              .select('id, correo')
              .eq('id_plataforma', platformId)
              .eq('estado', 'disponible');
            if (error) throw error;
            setAvailableAccounts(data || []);
          } catch (error: any) {
            console.error("Error fetching available accounts:", error);
            toast.error('Error al cargar cuentas disponibles.');
          } finally {
            setIsLoadingAccounts(false);
          }
        };
        fetchAccounts();
      } else {
         setIsLoadingAccounts(false); // No hay plataforma para buscar
      }

    } else {
      setNewEndDate('');
      setNewPassword('');
    }
  }, [isOpen, warrantyData]);

  // useEffect para detectar si hubo cambios reales en los campos editables
  useEffect(() => {
    if (!warrantyData) {
      setHasChanges(false);
      return;
    }

    const originalEndDate = warrantyData.fecha_fin?.substring(0, 10) || '';
    const isReplacing = selectedNewAccountId !== 'no-replace';

    // Comparar fecha fin
    const endDateChanged = newEndDate !== originalEndDate;
    // Comparar si se añadió contraseña (solo si no se reemplaza)
    const passwordChanged = !!newPassword.trim() && !isReplacing;
    // Comparar si se cambió la cuenta de reemplazo
    const accountChanged = isReplacing; // Si es diferente de 'no-replace' es un cambio

    setHasChanges(endDateChanged || passwordChanged || accountChanged);

  }, [newEndDate, newPassword, selectedNewAccountId, warrantyData]);

  const handleSaveChanges = async () => {
    if (!warrantyData?.id || !warrantyData.cuenta?.id) {
        toast.error("Faltan datos esenciales de la garantía.");
        return;
    }

    if (!newEndDate) {
      toast.warning('La nueva fecha fin es requerida.');
      return;
    }

    const isReplacingAccount = selectedNewAccountId !== 'no-replace';
    const isChangingPassword = !!newPassword.trim() && !isReplacingAccount;
    const originalStartDate = warrantyData.fecha_inicio;
    const originalEndDate = warrantyData.fecha_fin;

    if (!isReplacingAccount && !isChangingPassword && 
        newEndDate === originalEndDate?.substring(0, 10)) {
        toast.info("No se han realizado cambios para guardar.");
        return;   
    }

    if (isChangingPassword && newPassword.trim().length < 6) return;
    if (isReplacingAccount && isChangingPassword) return;

    setIsSaving(true);
    try {
      if (isReplacingAccount) {
        const newAccountId = parseInt(selectedNewAccountId, 10);
        const oldAccountId = warrantyData.id_cuenta;

        const { error: rentUpdErr } = await supabase.from('renta').update({
          id_cuenta: newAccountId,
          fecha_inicio: originalStartDate,
          fecha_fin: newEndDate,
          estado: 'rentada',
          descripcion: `Garantía resuelta. C. Original ${oldAccountId} -> ${newAccountId}.`,
          last_updated: new Date().toISOString()
        }).eq('id', warrantyData.id);
        if (rentUpdErr) throw new Error(`Error actualizando renta: ${rentUpdErr.message}`);

        const { error: newAccUpdErr } = await supabase.from('cuenta').update({
          estado: 'alquilada',
          last_updated: new Date().toISOString()
        }).eq('id', newAccountId);
        if (newAccUpdErr) console.warn(`Error actualizando estado de nueva cuenta ${newAccountId}: ${newAccUpdErr.message}`);

        if (oldAccountId && oldAccountId !== newAccountId) {
          const { error: oldAccUpdErr } = await supabase.from('cuenta').update({
            estado: 'revision',
            last_updated: new Date().toISOString()
          }).eq('id', oldAccountId);
          if (oldAccUpdErr) console.warn(`Error actualizando estado de cuenta original ${oldAccountId}: ${oldAccUpdErr.message}`);
        }

        toast.success('Garantía resuelta reemplazando la cuenta.');

      } else {
         if (isChangingPassword) {
             const { error: pwUpdErr } = await supabase.from('cuenta').update({
                 contrasenia: newPassword,
                 last_updated: new Date().toISOString()
             }).eq('id', warrantyData.cuenta.id); 
             if (pwUpdErr) throw new Error(`Error actualizando contraseña: ${pwUpdErr.message}`);
         }

         const { error: rentUpdErr } = await supabase.from('renta').update({
             fecha_inicio: originalStartDate,
             fecha_fin: newEndDate,
             estado: 'rentada',
             descripcion: `Garantía resuelta. ${isChangingPassword ? 'Contraseña actualizada.' : 'Fecha Fin actualizada.'}`,
             last_updated: new Date().toISOString()
         }).eq('id', warrantyData.id);
         if (rentUpdErr) throw new Error(`Error actualizando renta: ${rentUpdErr.message}`);

         toast.success(`Garantía resuelta. ${isChangingPassword ? 'Contraseña actualizada.' : 'Fecha Fin actualizada.'}`);
      }

      onWarrantyManaged();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error saving warranty changes:', error);
      toast.error('Error al procesar la garantía.', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  // TODO: Implementar lógica para rechazar garantía (cambiar estado a 'vencida'?')
  const handleRejectWarranty = async () => {
      if (!warrantyData) return;
      setIsRejecting(true);
      try {
          const { error } = await supabase
            .from('renta')
            .update({ estado: 'vencida', last_updated: new Date().toISOString() }) // O algún otro estado? 
            .eq('id', warrantyData.id);
          if (error) throw error;
          toast.info('La solicitud de garantía ha sido marcada como no procedente.');
          onWarrantyManaged();
          onOpenChange(false);
      } catch (error: any) {
          console.error('Error rejecting warranty:', error);
          toast.error('Error al rechazar la garantía.', { description: error.message });
      } finally {
          setIsRejecting(false);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-nytrix-purple/20 flex flex-col max-h-[90vh] p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Gestionar Garantía</DialogTitle>
          <DialogDescription>
            Revisa la solicitud, ajusta las fechas si es necesario y asigna una cuenta de reemplazo.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow my-4 pr-3 -mr-3">
          {warrantyData ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium text-muted-foreground">Detalles de la Solicitud</h4>
                <div className="text-sm space-y-1 border border-border/50 rounded-md p-3 bg-background/30">
                   <p><span className="font-semibold w-28 inline-block text-muted-foreground">Usuario:</span> {warrantyData.persona?.nombre_completo || 'N/A'}</p>
                   <p><span className="font-semibold w-28 inline-block text-muted-foreground">Plataforma:</span> {warrantyData.cuenta?.plataforma?.nombre || 'N/A'}</p>
                   <p><span className="font-semibold w-28 inline-block text-muted-foreground">Cuenta Original:</span> {warrantyData.cuenta?.correo || 'N/A'}</p>
                   <p><span className="font-semibold w-28 inline-block text-muted-foreground">Inicio Original:</span> {formatDateLocale(warrantyData.fecha_inicio)}</p>
                   <p><span className="font-semibold w-28 inline-block text-muted-foreground">Descripción:</span> {warrantyData.descripcion || <span className="italic text-muted-foreground/60">Sin descripción</span>}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-muted-foreground">Acciones de Resolución</h4>
                <div>
                   <Label htmlFor="endDate" className="mb-1 block">Nueva Fecha Fin</Label>
                   <Input 
                     id="endDate" 
                     type="date" 
                     value={newEndDate}
                     onChange={(e) => setNewEndDate(e.target.value)}
                     disabled={isSaving || isRejecting}
                     className="bg-background border-input focus-visible:ring-nytrix-purple"
                     min={warrantyData?.fecha_fin?.substring(0, 10)}
                    />
                 </div>

                <div className={selectedNewAccountId !== 'no-replace' ? 'opacity-50' : ''}>
                   <Label htmlFor="newPassword" className={"mb-1 block " + (selectedNewAccountId !== 'no-replace' ? 'text-muted-foreground/50 cursor-not-allowed' : '')}>
                     Nueva Contraseña (Cuenta Original)
                   </Label>
                   <Input 
                     id="newPassword"
                     type="password" 
                     value={newPassword}
                     onChange={(e) => setNewPassword(e.target.value)}
                     placeholder="Dejar vacío para no cambiar"
                     disabled={isSaving || isRejecting || selectedNewAccountId !== 'no-replace'} 
                     className="bg-background border-input focus-visible:ring-nytrix-purple disabled:opacity-50 disabled:cursor-not-allowed"
                   />
                </div>

                <div>
                  <Label htmlFor="newAccount" className="mb-1 block">Asignar Cuenta Reemplazo (Opcional)</Label>
                  <Select 
                    value={selectedNewAccountId} 
                    onValueChange={setSelectedNewAccountId}
                    disabled={isLoadingAccounts || isSaving || isRejecting}
                  >
                    <SelectTrigger id="newAccount" className="bg-background border-input focus:ring-nytrix-purple focus:ring-offset-0">
                      <SelectValue placeholder={isLoadingAccounts ? "Cargando..." : "(No reemplazar) / Selecciona cuenta..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                       <SelectItem value="no-replace">(No reemplazar / Mantener original)</SelectItem>
                      {availableAccounts.map(acc => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.correo}
                        </SelectItem>
                      ))}
                      {availableAccounts.length === 0 && 
                        <SelectItem value="none" disabled> No hay otras cuentas disponibles </SelectItem> 
                      }
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">Cargando datos de garantía...</div>
          )}
        </ScrollArea>
        
        <DialogFooter className="flex-shrink-0 flex justify-between items-center pt-4 border-t border-border/50">
          <Button 
            variant="destructive"
            onClick={handleRejectWarranty}
            disabled={isSaving || isRejecting || !warrantyData}
          >
            {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
            No Procede / Rechazar
          </Button>
          
          <Button 
            type="button" 
            onClick={handleSaveChanges} 
            disabled={
              isSaving || 
              isRejecting || 
              isLoadingAccounts || 
              !warrantyData || 
              !newEndDate || // Fecha fin sigue siendo requerida
              !hasChanges    // Añadir chequeo de cambios
            }
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Guardar Cambios y Resolver
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 