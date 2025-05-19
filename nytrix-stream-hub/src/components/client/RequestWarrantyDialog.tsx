import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Para obtener ID de persona si es necesario

interface RequestWarrantyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  rentaId: number | null;
  // Podríamos pasar la info de la cuenta/plataforma para mostrar en el diálogo
  accountEmail?: string | null;
  platformName?: string | null;
}

export default function RequestWarrantyDialog({
  isOpen,
  onOpenChange,
  rentaId,
  accountEmail,
  platformName,
}: RequestWarrantyDialogProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth(); // Acceso al usuario autenticado

  const handleSubmit = async () => {
    if (!rentaId) {
      toast.error('No se pudo identificar la renta para la solicitud.');
      return;
    }
    if (!description.trim()) {
      toast.warning('Por favor, describe el problema.');
      return;
    }
    // Podríamos necesitar el ID de persona de Supabase si queremos registrarlo en auditoría
    // const { data: personaData } = await supabase.from('persona').select('id').eq('id_user', user?.id).single();
    // const personaId = personaData?.id;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('renta')
        .update({
          estado: 'garantia',
          descripcion: description.trim(),
          last_updated: new Date().toISOString(), // Actualizar timestamp
        })
        .eq('id', rentaId);

      if (error) throw error;

      toast.success('Solicitud de garantía enviada con éxito.', {
        description: 'Revisaremos tu caso lo antes posible.',
      });
      setDescription(''); // Limpiar descripción
      onOpenChange(false); // Cerrar diálogo

      // Aquí podríamos invalidar queries o dejar que Realtime haga su trabajo
      // Ejemplo: queryClient.invalidateQueries(['clientAccounts']);

      // TODO: Opcional - Registrar evento en tabla de auditoría
      // await logWarrantyRequest(personaId, rentaId, description.trim());

    } catch (error: any) {
      console.error('Error submitting warranty request:', error);
      toast.error('Error al enviar la solicitud.', {
        description: error.message || 'Por favor, intenta de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resetear estado al cerrar
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDescription('');
      setIsSubmitting(false);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Solicitar Soporte / Garantía</DialogTitle>
          <DialogDescription>
            Describe el problema que estás experimentando con tu cuenta {platformName ? `de ${platformName}` : ''} ({accountEmail || 'N/A'}). Nuestro equipo lo revisará.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Descripción del Problema</Label>
            <Textarea
              id="description"
              placeholder="Ej: La contraseña no funciona, el perfil asignado no existe, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting || !description.trim()}
            className="bg-gradient-nytrix"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar Solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 