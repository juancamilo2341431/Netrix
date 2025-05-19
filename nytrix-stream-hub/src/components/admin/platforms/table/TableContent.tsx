
import { Platform } from "@/types/platform";
import { TableBody } from "@/components/ui/table";
import { PlatformRow } from "./PlatformRow";
import { TableLoadingState } from "./TableLoadingState";
import { TableErrorState } from "./TableErrorState";
import { NoResultsState } from "./NoResultsState";

interface TableContentProps {
  platforms: Platform[];
  sortedPlatforms: Platform[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  formatDate: (dateString: string | null) => string;
  getStatusColor: (status: string) => string;
  onPlatformUpdated: () => void;
  userId?: number | null;
}

export const TableContent = ({
  platforms,
  sortedPlatforms,
  isLoading,
  error,
  searchTerm,
  formatDate,
  getStatusColor,
  onPlatformUpdated,
  userId
}: TableContentProps) => {
  if (isLoading) {
    return (
      <TableBody>
        <TableLoadingState />
      </TableBody>
    );
  }
  
  if (error) {
    return (
      <TableBody>
        <TableErrorState error={error} />
      </TableBody>
    );
  }
  
  if (platforms.length === 0) {
    return (
      <TableBody>
        <NoResultsState searchTerm={searchTerm} />
      </TableBody>
    );
  }
  
  return (
    <TableBody>
      {sortedPlatforms.length > 0 ? (
        sortedPlatforms.map((platform) => (
          <PlatformRow 
            key={platform.id} 
            platform={platform}
            formatDate={formatDate}
            getStatusColor={getStatusColor}
            onPlatformUpdated={onPlatformUpdated}
            userId={userId}
          />
        ))
      ) : (
        <NoResultsState searchTerm={searchTerm} />
      )}
    </TableBody>
  );
};
