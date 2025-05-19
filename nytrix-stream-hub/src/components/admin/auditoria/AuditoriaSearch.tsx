
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AuditoriaSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export function AuditoriaSearch({ searchTerm, setSearchTerm }: AuditoriaSearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por acción o usuario..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10 max-w-md"
      />
    </div>
  );
}
