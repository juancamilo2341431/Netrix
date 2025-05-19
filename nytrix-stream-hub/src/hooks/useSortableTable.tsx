
import { useState, useMemo } from "react";
import { Account } from "@/components/admin/accounts/AccountsTable";

export type SortField = 'created_at' | 'platform' | 'correo' | 'contrasenia' | 'estado' | 'last_updated';
export type SortDirection = 'asc' | 'desc';

export const useSortableTable = (accounts: Account[], searchTerm: string, filterPlatform: string, filterStatus: string) => {
  // Sort state
  const [sortField, setSortField] = useState<SortField>('last_updated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filter accounts based on search term, platform and status
  const filteredAccounts = useMemo(() => 
    accounts?.filter(account => {
      const matchesSearch = 
        (account.platform?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        account.correo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPlatform = filterPlatform === "all" || account.platform === filterPlatform;
      const matchesStatus = filterStatus === "all" || account.estado === filterStatus;
      
      return matchesSearch && matchesPlatform && matchesStatus;
    }) || [], 
    [accounts, searchTerm, filterPlatform, filterStatus]
  );
  
  // Sort accounts
  const sortedAccounts = useMemo(() => 
    [...filteredAccounts].sort((a, b) => {
      if (sortField === 'created_at' || sortField === 'last_updated') {
        const dateA = a[sortField] ? new Date(a[sortField]).getTime() : 0;
        const dateB = b[sortField] ? new Date(b[sortField]).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      const valueA = (a[sortField] || '').toString().toLowerCase();
      const valueB = (b[sortField] || '').toString().toLowerCase();
      return sortDirection === 'asc' 
        ? valueA.localeCompare(valueB) 
        : valueB.localeCompare(valueA);
    }),
    [filteredAccounts, sortField, sortDirection]
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

  return {
    sortField,
    sortDirection,
    sortedAccounts,
    handleSortClick
  };
};
