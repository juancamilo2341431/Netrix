import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, EyeOffIcon, ShieldQuestion, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import RequestWarrantyDialog from "./RequestWarrantyDialog";
import { ClientAccountStatus } from "@/hooks/useClientAccounts";

type AccountCardProps = {
  id: number | string;
  platform: string;
  logo: string;
  email: string;
  password: string;
  expiresAt: string;
  status: ClientAccountStatus;
  selected?: boolean;
  onSelectChange?: (accountId: number | string, isSelected: boolean) => void;
  isRenewable?: boolean;
  isRenewing?: boolean;
  onRenew?: (accountId: number | string) => void;
};

export default function AccountCard({
  id,
  platform,
  logo,
  email,
  password,
  expiresAt,
  status,
  selected,
  onSelectChange,
  isRenewable,
  isRenewing,
  onRenew,
}: AccountCardProps) {
  const getStatusColor = (status: ClientAccountStatus): string => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "expiring":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "expired":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "warranty":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: ClientAccountStatus): string => {
    switch (status) {
      case "active":
        return "Activa";
      case "expiring":
        return "Por vencer";
      case "expired":
        return "Vencida";
      case "warranty":
        return "En Garantía";
      default:
        return "";
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  const [isWarrantyDialogOpen, setIsWarrantyDialogOpen] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    if (onSelectChange) {
      onSelectChange(id, checked);
    }
  };

  const handleSupportClick = () => {
    setIsWarrantyDialogOpen(true);
  }

  return (
    <>
      <Card className="overflow-hidden border border-nytrix-purple/20 bg-card hover:shadow-md hover:shadow-nytrix-purple/10 transition-shadow flex flex-col h-full min-w-[280px] sm:min-w-0">
        <div className="relative h-24 md:h-32 bg-gradient-to-r from-nytrix-dark-purple to-nytrix-charcoal">
          {(status === 'expiring' || status === 'expired') && onSelectChange && (
            <div className="absolute top-1 left-1 md:top-2 md:left-2 z-10 bg-background/70 backdrop-blur-sm p-1 rounded">
              <Checkbox 
                id={`select-${id}`}
                checked={selected}
                onCheckedChange={handleCheckboxChange}
                className="h-4 w-4"
              />
              <Label htmlFor={`select-${id}`} className="sr-only">Seleccionar {platform}</Label>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <img src={logo} alt={platform} className="w-20 h-20 md:w-20 md:h-20 object-contain" />
          </div>
          <Badge className={`absolute top-2 right-2 text-xs px-2 py-1 flex items-center gap-1 ${getStatusColor(status)}`}>
            {status === 'warranty' && <Clock className="h-3 w-3" />}
            {getStatusText(status)}
          </Badge>
        </div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold mb-2">{platform}</h3>
          <div className="space-y-2 text-sm flex-grow">
            <div>
              <p className="text-muted-foreground">Email:</p>
              <p className="font-medium break-all">{email}</p>
            </div>
            
            {status !== 'expired' && status !== 'warranty' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-muted-foreground">Contraseña:</p>
                    <Button
                      variant="ghost"
                      className="h-6 p-0 text-xs text-nytrix-purple hover:text-nytrix-purple/80 flex items-center gap-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <>
                          <EyeOffIcon className="h-3 w-3" />
                          Ocultar
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-3 w-3" />
                          Mostrar
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="font-medium break-all">
                    {showPassword ? password : "••••••••••"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expira el:</p>
                  <p className="font-medium">{expiresAt}</p>
                </div>
              </>
            )}

            {status === 'warranty' && (
              <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs text-blue-600">
                Tu solicitud de garantía está siendo procesada.
              </div>
            )}
          </div>
          <div className={`mt-4 pt-4 border-t border-nytrix-purple/10 flex items-center justify-start`}>
            {status !== 'expired' && status !== 'warranty' && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-nytrix-purple/30 flex items-center gap-1"
                onClick={handleSupportClick}
              >
                <ShieldQuestion className="h-4 w-4 text-muted-foreground"/>
                Soporte
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <RequestWarrantyDialog 
        isOpen={isWarrantyDialogOpen}
        onOpenChange={setIsWarrantyDialogOpen}
        rentaId={id}
        accountEmail={email}
        platformName={platform}
      />
    </>
  );
}
