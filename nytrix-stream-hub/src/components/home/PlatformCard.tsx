import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrencyCOP } from "@/utils/numberFormatting";

type PlatformCardProps = {
  name: string;
  logo: string;
  price: number;
  popular?: boolean;
  available?: boolean;
  comingSoon?: boolean;
  platformId: number;
  onRent?: (platformId: number) => void;
};

export default function PlatformCard({ 
  name, 
  logo, 
  price, 
  popular, 
  available = true, 
  comingSoon = false,
  platformId,
  onRent
}: PlatformCardProps) {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleRentClick = () => {
    if (!user) {
      navigate('/login', { 
        state: { 
          redirectAfterLogin: '/platforms',
          selectedPlatformId: platformId
        } 
      });
    } else if (onRent) {
      onRent(platformId);
    }
  };

  return (
    <div className={`platform-card flex flex-col rounded-lg overflow-hidden border shadow-md transition-all duration-300 bg-card h-full
      ${available ? 'border-nytrix-purple/20 hover:shadow-lg hover:shadow-nytrix-purple/10' : 'border-gray-300 opacity-80'}`}>
      <div className="relative h-40 bg-muted/30">
        {popular && available && (
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-purple-400 text-primary-foreground px-2.5 py-0.5 text-xs font-semibold">
              Popular
            </Badge>
          </div>
        )}
        
        {!available && (
          <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
            <Badge className={`px-3 py-1.5 text-sm font-bold ${comingSoon ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
              {comingSoon ? 'Próximamente disponible' : 'Agotada'}
            </Badge>
          </div>
        )}
        
        {!imageError && logo ? (
          <img
            src={logo}
            alt={name}
            className={`w-full h-full object-cover ${!available ? 'filter grayscale' : ''}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <ImageOff className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent p-3 flex flex-col justify-end platform-overlay">
          <h3 className="text-base font-semibold text-white mb-0.5 drop-shadow-md">{name}</h3>
          <p className="text-xs text-white/80 drop-shadow-sm">Suscripción Premium</p>
        </div>
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between">
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-xs text-muted-foreground">Desde</span>
            <p className="text-lg font-bold">${formatCurrencyCOP(price)} <span className="text-xs font-normal text-muted-foreground">/mes</span></p>
          </div>
          {available ? (
            <Button 
              size="sm" 
              className="bg-gradient-nytrix hover:opacity-90 text-xs px-3 py-1.5"
              onClick={handleRentClick}
            >
              Rentar Ahora
            </Button>
          ) : (
            <Button size="sm" className="bg-gray-400 text-xs px-3 py-1.5 cursor-not-allowed" disabled>
              {comingSoon ? 'Notificarme' : 'No disponible'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
