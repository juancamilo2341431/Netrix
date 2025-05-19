
import { Separator } from "@/components/ui/separator";
import { UserProfile } from "@/types/profile";

interface ProfileInfoProps {
  profile: UserProfile | null;
  user: { id: string; email?: string | undefined } | null;
  onEdit: () => void;
  formatDate: (dateString: string) => string;
}

export default function ProfileInfo({ profile, user, onEdit, formatDate }: ProfileInfoProps) {
  if (!profile) {
    return (
      <div className="text-center text-muted-foreground">
        No se pudo cargar la información del perfil.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center py-2">
        <div className="text-sm font-medium text-muted-foreground md:w-1/3">Nombre completo</div>
        <div className="font-medium md:w-2/3">{profile.nombre_completo || 'No registrado'}</div>
      </div>
      <Separator />
      
      <div className="flex flex-col md:flex-row md:items-center py-2">
        <div className="text-sm font-medium text-muted-foreground md:w-1/3">Correo electrónico</div>
        <div className="font-medium md:w-2/3">{profile.correo || user?.email}</div>
      </div>
      <Separator />
      
      <div className="flex flex-col md:flex-row md:items-center py-2">
        <div className="text-sm font-medium text-muted-foreground md:w-1/3">Teléfono</div>
        <div className="font-medium md:w-2/3">{profile.telefono || 'No registrado'}</div>
      </div>
      <Separator />
      
      <div className="flex flex-col md:flex-row md:items-center py-2">
        <div className="text-sm font-medium text-muted-foreground md:w-1/3">Tipo de cuenta</div>
        <div className="font-medium capitalize md:w-2/3">{profile.rol || 'Cliente'}</div>
      </div>
      <Separator />
      
      <div className="flex flex-col md:flex-row md:items-center py-2">
        <div className="text-sm font-medium text-muted-foreground md:w-1/3">Miembro desde</div>
        <div className="font-medium md:w-2/3">
          {profile.created_at ? formatDate(profile.created_at) : 'No disponible'}
        </div>
      </div>
    </div>
  );
}
