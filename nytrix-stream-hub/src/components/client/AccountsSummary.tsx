import { TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AccountsSummaryProps = {
  totalAccounts: number;
  activeAccounts: number;
  expiringAccounts: number;
  expiredAccounts: number;
};

export default function AccountsSummary({
  totalAccounts,
  activeAccounts,
  expiringAccounts,
  expiredAccounts,
}: AccountsSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>Total de Cuentas</span>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalAccounts}</div>
          <p className="text-xs text-muted-foreground">
            Cuentas contratadas con Nytrix
          </p>
        </CardContent>
      </Card>
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>Cuentas Activas</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeAccounts}</div>
          <p className="text-xs text-muted-foreground">
            Acceso disponible ahora
          </p>
        </CardContent>
      </Card>
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>Por Vencer</span>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiringAccounts}</div>
          <p className="text-xs text-muted-foreground">
            Expirarán en 7 días
          </p>
        </CardContent>
      </Card>
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span>Vencidas</span>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{expiredAccounts}</div>
          <p className="text-xs text-muted-foreground">
            Requieren renovación
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
