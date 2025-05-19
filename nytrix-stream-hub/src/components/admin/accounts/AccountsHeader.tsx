
import { CreateAccountButton } from "./CreateAccountButton";
import { Account } from "./AccountsTable";

interface AccountsHeaderProps {
  onAccountCreated: (account: Account) => void;
  platforms: { id: number; nombre: string }[];
}

export const AccountsHeader = ({ onAccountCreated, platforms }: AccountsHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold tracking-tight">Cuentas</h1>
      <CreateAccountButton onAccountCreated={onAccountCreated} platforms={platforms} />
    </div>
  );
};
