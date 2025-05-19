
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Users, DollarSign, ArrowUpRight } from "lucide-react";

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Ingresos</CardTitle>
          <DollarSign className="h-4 w-4 text-nytrix-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">$23,456</div>
          <p className="text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" /> 
            <span className="text-green-500">12%</span> desde el mes pasado
          </p>
        </CardContent>
      </Card>
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
          <Users className="h-4 w-4 text-nytrix-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" /> 
            <span className="text-green-500">8%</span> desde el mes pasado
          </p>
        </CardContent>
      </Card>
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Cuentas Activas</CardTitle>
          <BarChart className="h-4 w-4 text-nytrix-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">3,567</div>
          <p className="text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" /> 
            <span className="text-green-500">5%</span> desde el mes pasado
          </p>
        </CardContent>
      </Card>
      <Card className="border border-nytrix-purple/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Renovación</CardTitle>
          <DollarSign className="h-4 w-4 text-nytrix-purple" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">86%</div>
          <p className="text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" /> 
            <span className="text-green-500">3%</span> desde el mes pasado
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
