import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

interface NavbarMobileMenuProps {
  isOpen: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  loading: boolean;
  onClose: () => void;
}

export function NavbarMobileMenu({ isOpen, isLoggedIn, isAdmin, loading, onClose }: NavbarMobileMenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="md:hidden bg-nytrix-dark-purple border-t border-nytrix-purple/20">
      <div className="container mx-auto px-4 py-4 space-y-4">
        <div className="pt-2 space-y-2">
          {loading ? (
            <div className="h-10 bg-nytrix-purple/20 animate-pulse rounded-md"></div>
          ) : isLoggedIn ? (
            <>
              <Link to="/client" className="block w-full" onClick={onClose}>
                <Button className="w-full bg-gradient-nytrix">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Mi Dashboard
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="block w-full" onClick={onClose}>
                  <Button variant="outline" className="w-full border-nytrix-purple/30 hover:bg-nytrix-purple/10">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Panel Admin
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/login" className="block w-full" onClick={onClose}>
                <Button variant="outline" className="w-full border-nytrix-purple/30 hover:bg-nytrix-purple/10">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register" className="block w-full" onClick={onClose}>
                <Button className="w-full bg-gradient-nytrix">Registrarse</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
