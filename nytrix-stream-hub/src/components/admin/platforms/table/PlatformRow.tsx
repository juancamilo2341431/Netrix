
import { Platform } from "@/types/platform";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlatformImage } from "./PlatformImage";
import { PlatformActions } from "./PlatformActions";

interface PlatformRowProps {
  platform: Platform;
  formatDate: (dateString: string | null) => string;
  getStatusColor: (status: string) => string;
  onPlatformUpdated: () => void;
  userId?: number | null;
}

export const PlatformRow = ({ 
  platform, 
  formatDate, 
  getStatusColor,
  onPlatformUpdated,
  userId
}: PlatformRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <PlatformImage 
          imageUrl={platform.imagen} 
          altText={platform.nombre || 'Plataforma'} 
        />
      </TableCell>
      <TableCell className="font-medium">{platform.nombre || 'Sin nombre'}</TableCell>
      <TableCell className="text-right">${platform.precio || '0.00'}</TableCell>
      <TableCell className="max-w-xs truncate">{platform.descripcion || 'Sin descripción'}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(platform.estado)}>
          {platform.estado}
        </Badge>
      </TableCell>
      <TableCell>{formatDate(platform.created_at)}</TableCell>
      <TableCell>{formatDate(platform.last_updated)}</TableCell>
      <TableCell>
        <PlatformActions 
          platform={platform} 
          onPlatformUpdated={onPlatformUpdated} 
          userId={userId} 
        />
      </TableCell>
    </TableRow>
  );
};
