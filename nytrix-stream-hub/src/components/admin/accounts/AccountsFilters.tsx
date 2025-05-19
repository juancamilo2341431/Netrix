import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface AccountsFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterPlatform: string;
  setFilterPlatform: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  platforms: string[];
}

export const AccountsFilters = ({
  searchTerm,
  setSearchTerm,
  filterPlatform,
  setFilterPlatform,
  filterStatus,
  setFilterStatus,
  platforms
}: AccountsFiltersProps) => {
  // Sort platforms alphabetically
  const sortedPlatforms = [...platforms].sort((a, b) => 
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );
  
  // Define and sort status options - Limitados a disponible, alquilada y tramite
  const statusOptions = [
    { value: "disponible", label: "Disponible" },
    { value: "alquilada", label: "Alquilada" },
    { value: "tramite", label: "En trámite" }
  ].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex flex-col md:flex-row gap-3 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar cuentas..."
          className="pl-8 border-nytrix-purple/20 bg-background w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <Select value={filterPlatform} onValueChange={setFilterPlatform}>
        <SelectTrigger className="w-[180px] border-nytrix-purple/20 bg-background">
          <SelectValue placeholder="Plataforma" />
        </SelectTrigger>
        <SelectContent className="bg-card border-nytrix-purple/20">
          <SelectItem value="all">Todas las plataformas</SelectItem>
          {sortedPlatforms.map((platform) => (
            <SelectItem key={platform} value={platform}>
              {platform}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={filterStatus} onValueChange={setFilterStatus}>
        <SelectTrigger className="w-[180px] border-nytrix-purple/20 bg-background">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent className="bg-card border-nytrix-purple/20">
          <SelectItem value="all">Todos los estados</SelectItem>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
