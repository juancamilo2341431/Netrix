
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PlatformSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export const PlatformSearch = ({ searchTerm, setSearchTerm }: PlatformSearchProps) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar plataforma..."
          className="pl-8 border-nytrix-purple/20 bg-background"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};
