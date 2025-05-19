
import { useState, useMemo } from "react";
import { Platform } from "@/types/platform";
import { SortField, SortDirection } from "./TableHeader";

export const usePlatformTable = (platforms: Platform[], searchTerm: string) => {
  // Sort state
  const [sortField, setSortField] = useState<SortField>('last_updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter platforms based on search term
  const filteredPlatforms = useMemo(() => 
    platforms?.filter(platform => 
      platform.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [], 
    [platforms, searchTerm]
  );
  
  // Sort platforms
  const sortedPlatforms = useMemo(() => 
    [...filteredPlatforms].sort((a, b) => {
      if (sortField === 'precio') {
        const priceA = parseFloat(a[sortField] || '0');
        const priceB = parseFloat(b[sortField] || '0');
        return sortDirection === 'asc' ? priceA - priceB : priceB - priceA;
      }
      
      if (sortField === 'created_at' || sortField === 'last_updated') {
        const dateA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
        const dateB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      const valueA = a[sortField] || '';
      const valueB = b[sortField] || '';
      return sortDirection === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }),
    [filteredPlatforms, sortField, sortDirection]
  );
  
  // Handle sort click
  const handleSortClick = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "mostrar":
        return "bg-green-500 text-white";
      case "ocultar":
        return "bg-yellow-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return {
    sortField,
    sortDirection,
    sortedPlatforms,
    handleSortClick,
    getStatusColor,
    formatDate
  };
};
