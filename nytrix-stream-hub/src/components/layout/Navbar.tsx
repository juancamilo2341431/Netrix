import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NavbarDesktopMenu } from "./NavbarDesktopMenu";
import { NavbarAccountMenu } from "./NavbarAccountMenu";
import { NavbarMobileMenu } from "./NavbarMobileMenu";
import { useAdminRole } from "@/hooks/useAdminRole";
import { CartStatusIcon } from "@/components/cart/CartStatusIcon";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isAdmin } = useAdminRole(user);
  const location = useLocation();

  // Ocultar siempre en /login y /register
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <header className="fixed top-0 w-full z-50 bg-nytrix-dark-purple/90 backdrop-blur-sm border-b border-nytrix-purple/20">
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-gradient-nytrix">Nytrix</span>
        </Link>

        {/* Desktop Navigation */}
        <NavbarDesktopMenu />

        {/* Auth Buttons or Dashboard Access & Cart Icon for Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          <CartStatusIcon />
          <NavbarAccountMenu 
            isLoading={loading} 
            isLoggedIn={!!user} 
            isAdmin={isAdmin} 
          />
        </div>
        
        {/* Mobile Area: Cart Icon and Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
          <CartStatusIcon />
          <button 
            className="focus:outline-none" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <NavbarMobileMenu 
        isOpen={isOpen}
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        loading={loading}
        onClose={() => setIsOpen(false)}
      />
    </header>
  );
}
