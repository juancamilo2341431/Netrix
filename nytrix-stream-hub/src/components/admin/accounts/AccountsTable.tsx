import { 
  Table, 
  TableBody, 
  TableHeader 
} from "@/components/ui/table";
import { TableLoadingState } from "@/components/admin/platforms/table/TableLoadingState";
import { TableErrorState } from "@/components/admin/platforms/table/TableErrorState";
import { AccountRow } from "@/components/admin/accounts/AccountRow";
import { NoAccountsState } from "@/components/admin/accounts/NoAccountsState";
import { TableHeader as AccountsTableHeader } from "@/components/admin/accounts/TableHeader";
import { useSortableTable } from "@/hooks/useSortableTable";

export type AccountStatus = "disponible" | "alquilada" | "revision" | "tramite" | "papelera" | "eliminada";

export type Account = {
  id: number;
  created_at: string;
  correo: string;
  contrasenia: string;
  estado: AccountStatus;
  last_updated: string;
  id_plataforma: number;
  platform?: string; // Para mostrar el nombre de la plataforma en la tabla
};

interface AccountsTableProps {
  accounts: Account[];
  isLoading?: boolean;
  error?: Error | null;
  searchTerm: string;
  filterPlatform: string;
  filterStatus: string;
  onAccountUpdated?: (updatedAccount: Account) => void;
  userId?: number | null;
}

export const AccountsTable = ({
  accounts,
  isLoading = false,
  error = null,
  searchTerm,
  filterPlatform,
  filterStatus,
  onAccountUpdated = () => {},
  userId = null
}: AccountsTableProps) => {
  // Use the sortable table hook
  const { sortField, sortDirection, sortedAccounts, handleSortClick } = 
    useSortableTable(accounts, searchTerm, filterPlatform, filterStatus);
  
  return (
    <div className="border border-nytrix-purple/20 rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <AccountsTableHeader 
            sortField={sortField}
            sortDirection={sortDirection}
            handleSortClick={handleSortClick}
          />
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableLoadingState />
          ) : error ? (
            <TableErrorState error={error} />
          ) : sortedAccounts.length > 0 ? (
            sortedAccounts.map((account) => (
              <AccountRow 
                key={account.id} 
                account={account}
                onAccountUpdated={onAccountUpdated}
                userId={userId}
              />
            ))
          ) : (
            <NoAccountsState searchTerm={searchTerm} />
          )}
        </TableBody>
      </Table>
    </div>
  );
};
