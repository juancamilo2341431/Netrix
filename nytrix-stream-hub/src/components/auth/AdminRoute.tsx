
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Define valid roles explicitly
const ADMIN_ROLES = ['admin', 'asistente'] as const;
type AdminRole = typeof ADMIN_ROLES[number];

// Helper function to validate if a role is a valid admin role
const isValidAdminRole = (role: string): role is AdminRole => {
  return ADMIN_ROLES.includes(role as AdminRole);
};

export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      // Validate user ID format to prevent injection
      if (typeof user.id !== 'string' || !user.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error("Invalid user ID format");
        toast.error("Error de autenticación");
        setIsAuthorized(false);
        setCheckingRole(false);
        return;
      }

      try {
        // Use a consistent timestamp for multiple queries to prevent time-of-check time-of-use issues
        const queryTimestamp = new Date().toISOString();
        
        // Limit results and add timeout for security
        const { data, error, statusText } = await Promise.race([
          supabase
            .from('persona')
            .select('rol')
            .eq('id_user', user.id)
            .limit(1)
            .single(),
          new Promise<any>(resolve => 
            setTimeout(() => resolve({ error: { message: 'Query timeout' } }), 5000)
          )
        ]);

        if (error) {
          console.error("Error fetching user role:", error);
          toast.error("Error al verificar permisos de usuario");
          setIsAuthorized(false);
        } else if (!data || !data.rol) {
          // Explicitly handle missing role data
          console.error("User role data is missing");
          toast.error("No se encontró información de rol");
          setIsAuthorized(false);
        } else {
          // Type-safe role validation with explicit check against allowed roles
          const hasAccess = isValidAdminRole(data.rol);
          setIsAuthorized(hasAccess);
          
          if (!hasAccess) {
            // Log access attempts but don't reveal too much information
            console.warn("Unauthorized access attempt to admin area", {
              path: location.pathname,
              timestamp: queryTimestamp
            });
            toast.error("No tienes permisos para acceder a esta área");
          }
        }
      } catch (error) {
        console.error("Unexpected error checking role:", error);
        setIsAuthorized(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkUserRole();
  }, [user, location.pathname]); // Added dependency on pathname to re-check when route changes

  // Show loading state while checking authentication and role
  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-nytrix-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to client dashboard if user is authenticated but not authorized
  if (isAuthorized === false) {
    // Log unauthorized access attempts
    console.warn("Unauthorized access blocked", {
      path: location.pathname,
      timestamp: new Date().toISOString()
    });
    return <Navigate to="/client" state={{ from: location }} replace />;
  }

  // Render the child routes if user is authenticated and authorized
  return <Outlet />;
}
