import { useState, useMemo } from "react";
import ClientLayout from "@/components/layout/ClientLayout";
import AccountCard from "@/components/client/AccountCard";
import { useClientAccounts } from "@/hooks/useClientAccounts";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format, isValid } from 'date-fns';
import { toast } from "@/components/ui/use-toast";

export default function ActiveAccounts() {
  const { data: allAccounts, isLoading, error } = useClientAccounts();
  const [emailFilter, setEmailFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  
  // Filtrar solo las cuentas activas
  const activeAccounts = useMemo(() => {
    return allAccounts?.filter(acc => acc.status === "active") || [];
  }, [allAccounts]);

  // Extraer plataformas únicas para el Select de las cuentas activas
  const uniquePlatforms = useMemo(() => {
    const platforms = activeAccounts.map(acc => acc.platform);
    return [...new Set(platforms)].sort();
  }, [activeAccounts]);

  // Aplicar filtros de búsqueda sobre las cuentas activas
  const filteredAccounts = useMemo(() => {
    let accountsToFilter = activeAccounts;
    if (emailFilter) {
      accountsToFilter = accountsToFilter.filter(acc => 
        (acc.email || "").toLowerCase().includes(emailFilter.toLowerCase())
      );
    }
    if (platformFilter && platformFilter !== "Todas") {
      accountsToFilter = accountsToFilter.filter(acc => 
        acc.platform === platformFilter
      );
    }
    return accountsToFilter;
  }, [activeAccounts, emailFilter, platformFilter]);
  
  const formatDateSafe = (dateInput: string | Date | undefined | null) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return isValid(date) ? format(date, 'yyyy-MM-dd HH:mm:ss') : '';
  };

  const handleDownloadExcel = () => {
    if (filteredAccounts.length === 0) {
      toast({ title: "Sin datos", description: "No hay cuentas activas para exportar según los filtros.", variant: "destructive" });
      return;
    }

    // Datos para el Excel: Plataforma, Email, y Contraseña
    const dataForExcel = filteredAccounts.map(acc => ({
      'Plataforma': acc.platform ?? 'N/A',
      'Email': acc.email ?? '',
      // Según types.ts, la propiedad es 'contrasenia' en la tabla 'cuenta'.
      // Asegúrate de que el hook useClientAccounts la propaga con este nombre o el que corresponda.
      'Contraseña': acc.password ?? '', 
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cuentas Activas");

    const columnKeys = Object.keys(dataForExcel[0] || {});
    if (columnKeys.length > 0) {
      const columnWidths = columnKeys.map(key => ({
        wch: Math.max(key.length, ...dataForExcel.map(row => (row[key as keyof typeof row]?.toString() ?? '').length)) + 2
      }));
      worksheet['!cols'] = columnWidths;
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blobData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const today = format(new Date(), 'yyyy-MM-dd');
    saveAs(blobData, `Mis_Cuentas_Activas_Nytrix_${today}.xlsx`);
    toast({ title: "Descargando", description: "Tu archivo Excel se está descargando..." });
  };
  
  let content;
  if (isLoading) {
    content = (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border border-nytrix-purple/20 rounded-lg overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
    );
  } else if (error) {
    content = (
          <div className="p-8 text-center">
            <p className="text-destructive">Error al cargar las cuentas</p>
          </div>
    );
  } else if (activeAccounts.length === 0) {
    content = (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold">No tienes cuentas activas</h2>
            <p className="text-muted-foreground mt-2 mb-4">
              Explora nuestra selección de plataformas y comienza a disfrutar del mejor contenido
            </p>
            <Button asChild className="bg-gradient-nytrix"><a href="/platforms">Ver Plataformas</a></Button>
          </div>
    );
  } else if (filteredAccounts.length === 0) {
    content = (
      <div className="text-center p-8 text-muted-foreground">
        No hay cuentas activas que coincidan con tus filtros.
      </div>
    );
  } else {
    content = (
      <div className="flex overflow-x-auto space-x-4 pb-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:space-x-0 sm:pb-0">
        {filteredAccounts.map((account) => (
          <AccountCard key={account.id} {...account} />
        ))}
      </div>
    );
  }
  
  return (
    <ClientLayout hideCartIconOnMobile={true}>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-center sm:text-left">Cuentas Activas</h1>
        </div>

        {!isLoading && !error && activeAccounts.length > 0 && (
          <>
            <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="relative w-full sm:flex-1 md:max-w-xs lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email-filter-active"
                  placeholder="Buscar por email..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="pl-10 w-full bg-card border-border focus:border-nytrix-purple"
                />
              </div>
              <div className="flex flex-row justify-between items-center sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline"
                  onClick={handleDownloadExcel}
                  disabled={filteredAccounts.length === 0}
                  className="w-10 h-10 p-0 sm:w-auto sm:h-10 sm:px-4 sm:py-2 flex items-center justify-center bg-card border-border hover:border-nytrix-purple/50"
                >
                  <Download className="h-5 w-5 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Descargar Excel</span>
                </Button>
                <div className="w-full flex-1 sm:w-auto sm:flex-none md:min-w-[200px] lg:min-w-[220px]">
                  <Select value={platformFilter} onValueChange={setPlatformFilter}>
                    <SelectTrigger 
                      id="platform-filter-active" 
                      className="w-full bg-card border-border hover:border-nytrix-purple/50 data-[state=open]:border-nytrix-purple"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todas">Todas las plataformas</SelectItem>
                      {uniquePlatforms.map(platform => (
                        <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {content}
          </>
        )}

        {(isLoading || error || activeAccounts.length === 0) && content}
        
      </div>
    </ClientLayout>
  );
}
