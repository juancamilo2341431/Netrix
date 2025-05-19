
import { Platform } from "@/types/platform";
import { EmptyState } from "./table/EmptyState";
import { TableHeader } from "./table/TableHeader";
import { TableContent } from "./table/TableContent";
import { usePlatformTable } from "./table/usePlatformTable";
import {
  Table,
  TableHeader as ShadcnTableHeader,
} from "@/components/ui/table";

interface PlatformsTableProps {
  platforms: Platform[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  onPlatformUpdated: () => void;
  userId?: number | null;
}

export const PlatformsTable = ({ 
  platforms, 
  isLoading, 
  error, 
  searchTerm,
  onPlatformUpdated,
  userId
}: PlatformsTableProps) => {
  const { 
    sortField, 
    sortDirection, 
    sortedPlatforms, 
    handleSortClick, 
    getStatusColor, 
    formatDate 
  } = usePlatformTable(platforms, searchTerm);

  if (!isLoading && !error && platforms.length === 0) {
    return <EmptyState isLoading={isLoading} error={error} searchTerm={searchTerm} />;
  }
  
  return (
    <div className="rounded-md border border-input">
      <Table>
        <ShadcnTableHeader>
          <TableHeader 
            sortField={sortField}
            sortDirection={sortDirection}
            handleSortClick={handleSortClick}
          />
        </ShadcnTableHeader>
        
        <TableContent 
          platforms={platforms}
          sortedPlatforms={sortedPlatforms}
          isLoading={isLoading}
          error={error}
          searchTerm={searchTerm}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          onPlatformUpdated={onPlatformUpdated}
          userId={userId}
        />
      </Table>
    </div>
  );
};
