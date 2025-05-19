import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, CircleUserRound } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface NavbarAccountMenuProps {
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export function NavbarAccountMenu({ isLoading, isLoggedIn, isAdmin }: NavbarAccountMenuProps) {
  if (isLoading) {
    return (
      <div className="h-9 w-20 bg-nytrix-purple/20 animate-pulse rounded-md"></div>
    );
  }
  
  if (!isLoggedIn) {
    return (
      <>
        <Link to="/login">
          <Button variant="ghost" className="text-foreground hover:text-nytrix-purple hover:bg-nytrix-purple/10">
            Iniciar Sesión
          </Button>
        </Link>
        <Link to="/register">
          <Button className="bg-gradient-nytrix hover:opacity-90">Registrarse</Button>
        </Link>
      </>
    );
  }
  
  if (isAdmin) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="bg-gradient-nytrix hover:opacity-90">
            <CircleUserRound className="mr-2 h-4 w-4" />
            Mi Cuenta
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-nytrix-dark-purple border-nytrix-purple/20">
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-nytrix-purple/20 focus:text-white">
            <Link to="/client" className="flex w-full">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Mi Dashboard Cliente</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-nytrix-purple/20 focus:text-white">
            <Link to="/admin" className="flex w-full">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Panel Admin</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  
  return (
    <Link to="/client">
      <Button className="bg-gradient-nytrix hover:opacity-90">
        <CircleUserRound className="mr-2 h-4 w-4" />
        Mi Cuenta
      </Button>
    </Link>
  );
}
