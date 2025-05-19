import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart,
  Logs,
  ShieldCheck,
  Trash2,
  Package,
  Ticket,
  AlertCircle,
  DollarSign,
  ClipboardList
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type AdminLayoutProps = {
  children?: ReactNode;
  title?: string;
  renderChildren?: (isDesktopSidebarCollapsed: boolean) => ReactNode;
};

export default function AdminLayout({ children, title, renderChildren }: AdminLayoutProps) {
  const location = useLocation();
  const path = location.pathname;
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    if (title) {
      document.title = `${title} - Nytrix Admin`;
    } else {
      document.title = 'Nytrix Admin';
    }
  }, [title]);

  const navigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      current: path === "/admin",
    },
    {
      name: "Servicios",
      href: "/admin/services",
      icon: Package,
      current: path === "/admin/services",
    },
    {
      name: "Plataformas",
      href: "/admin/platforms",
      icon: BarChart,
      current: path === "/admin/platforms",
    },
    {
      name: "Cuentas",
      href: "/admin/accounts",
      icon: Users,
      current: path === "/admin/accounts",
    },
    {
      name: "Revisar cuentas",
      href: "/admin/review",
      icon: AlertCircle,
      current: path === "/admin/review",
    },
    {
      name: "Corte",
      href: "/admin/corte",
      icon: ClipboardList,
      current: path === "/admin/corte",
    },
    {
      name: "Cupones",
      href: "/admin/coupons",
      icon: Ticket,
      current: path === "/admin/coupons",
    },
    {
      name: "Pagos",
      href: "/admin/payments",
      icon: DollarSign,
      current: path === "/admin/payments",
    },
    {
      name: "Garantía",
      href: "/admin/warranty",
      icon: ShieldCheck,
      current: path === "/admin/warranty",
    },
    {
      name: "Papelera",
      href: "/admin/trash",
      icon: Trash2,
      current: path === "/admin/trash",
    },
    {
      name: "Estadísticas",
      href: "/admin/stats",
      icon: TrendingUp,
      current: path === "/admin/stats",
    },
    {
      name: "Auditoria",
      href: "/admin/logs",
      icon: Logs,
      current: path === "/admin/logs",
    },
    {
      name: "Configuración",
      href: "/admin/settings",
      icon: Settings,
      current: path === "/admin/settings",
    },
  ];

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
  };

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-nytrix-charcoal border-r border-nytrix-purple/20 transition-all duration-300 ease-in-out ${isDesktopSidebarCollapsed ? 'w-20' : 'w-64'} hidden md:flex`}>
        <div className={`flex items-center h-16 px-4 border-b border-nytrix-purple/20 flex-shrink-0 ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/" className={`items-center space-x-2 overflow-hidden ${isDesktopSidebarCollapsed ? 'hidden' : 'flex'}`}>
            <span className={`text-xl font-bold text-gradient-nytrix ${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}>Nytrix Admin</span>
          </Link>
          <Button
            variant="ghost"
            className={`hidden md:flex p-1 text-foreground/70 hover:text-nytrix-purple`}
            onClick={toggleDesktopSidebar}
            title={isDesktopSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            {isDesktopSidebarCollapsed ? <Menu className="h-8 w-8" /> : <X className="h-6 w-6" />}
          </Button>
        </div>
        <nav className={`flex-1 py-4 space-y-1 ${isDesktopSidebarCollapsed ? 'overflow-y-hidden px-2' : 'overflow-y-auto px-3 custom-sidebar-scroll'}`}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              title={item.name}
              className={`flex items-center space-x-3 rounded-md transition-colors ${isDesktopSidebarCollapsed ? 'px-2 py-2 justify-center' : 'px-3 py-2'} ${
                item.current
                  ? "bg-nytrix-purple text-white"
                  : "text-foreground/70 hover:bg-nytrix-purple/10 hover:text-nytrix-purple"
              } ${isDesktopSidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className={`${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-nytrix-purple/20 flex-shrink-0">
          <Button 
            variant="ghost" 
            className={`w-full text-foreground/70 hover:text-destructive ${isDesktopSidebarCollapsed ? 'justify-center' : 'justify-start'}`}
            onClick={signOut}
            title="Cerrar Sesión"
          >
            <LogOut className={`h-5 w-5 ${isDesktopSidebarCollapsed ? '' : 'mr-2'}`} />
            <span className={`${isDesktopSidebarCollapsed ? 'hidden' : 'block'}`}>Cerrar Sesión</span>
          </Button>
        </div>
      </div>

      {/* Mobile Structure with Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <div className={`flex flex-col w-full transition-all duration-300 ease-in-out ${isDesktopSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          {/* Mobile header */}
          <div className="md:hidden sticky top-0 z-20 flex items-center justify-between h-16 px-4 bg-nytrix-charcoal border-b border-nytrix-purple/20">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Alternar Menú</span>
              </Button>
            </SheetTrigger>
            <Link to="/admin" className="flex items-center">
              <span className="text-xl font-bold text-gradient-nytrix">{title || 'Nytrix Admin'}</span>
            </Link>
            <div className="w-10"></div>
          </div>
          
          {/* Main content */}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {renderChildren ? renderChildren(isDesktopSidebarCollapsed) : children}
          </main>
        </div>

        {/* Mobile Sidebar Content (SheetContent) */}
        <SheetContent side="left" className="w-64 bg-nytrix-charcoal border-r border-nytrix-purple/20 p-0 flex flex-col md:hidden">
          <div className="flex items-center justify-between h-16 px-4 border-b border-nytrix-purple/20 flex-shrink-0">
            <Link to="/admin" className="flex items-center space-x-2" onClick={() => setIsMobileSidebarOpen(false)}>
              <span className="text-xl font-bold text-gradient-nytrix">Nytrix Admin</span>
            </Link>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-sidebar-scroll">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  item.current
                    ? "bg-nytrix-purple text-white"
                    : "text-foreground/70 hover:bg-nytrix-purple/10 hover:text-nytrix-purple"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-nytrix-purple/20 flex-shrink-0">
            <Button
              variant="ghost"
              className="w-full justify-start text-foreground/70 hover:text-destructive"
              onClick={() => {
                signOut();
                setIsMobileSidebarOpen(false);
              }}
              title="Cerrar Sesión"
            >
              <LogOut className="mr-2 h-5 w-5" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
