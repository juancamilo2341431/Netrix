import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";
import { useCart } from "@/contexts/CartContext/CartContext";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const initialSessionProcessed = useRef(false);
  const { clearCart } = useCart();

  useEffect(() => {
    // Función para controlar toasts de inicio de sesión
    const getUserToastKey = (userId: string) => `nytrix_auth_toast_${userId}`;
    
    const shouldShowToast = (userId: string, event: string) => {
      // Para cerrar sesión, siempre mostramos toast
      if (event === 'SIGNED_OUT') return true;
      
      // Para otros eventos, verificamos si ya mostramos
      const key = getUserToastKey(userId);
      return !localStorage.getItem(key);
    };
    
    const markToastAsShown = (userId: string) => {
      const key = getUserToastKey(userId);
      localStorage.setItem(key, Date.now().toString());
    };
    
    const clearToastMarker = (userId: string) => {
      const key = getUserToastKey(userId);
      localStorage.removeItem(key);
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth event:", event);
        
        // Actualizar estado
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Ignorar eventos INITIAL_SESSION duplicados
        if (event === 'INITIAL_SESSION') {
          if (initialSessionProcessed.current) return;
          initialSessionProcessed.current = true;
          // No mostramos toast para INITIAL_SESSION
          return;
        }
        
        // Mostrar toasts según el evento
        if (event === 'SIGNED_OUT') {
          toast.success('Has cerrado sesión correctamente');
          // Si tenemos el ID del usuario anterior, limpiamos su marcador
          const previousUserId = localStorage.getItem('nytrix_previous_user');
          if (previousUserId) {
            clearToastMarker(previousUserId);
            localStorage.removeItem('nytrix_previous_user');
          }
        } else if (event === 'SIGNED_IN' && currentSession?.user) {
          const userId = currentSession.user.id;
          
          // Guardar ID de usuario para futura referencia al cerrar sesión
          localStorage.setItem('nytrix_previous_user', userId);
          
          // Verificar si debemos mostrar toast
          if (shouldShowToast(userId, event)) {
            toast.success('Has iniciado sesión correctamente');
            markToastAsShown(userId);
          }
        } else if (event === 'USER_UPDATED' && currentSession?.user?.email_confirmed_at) {
          // El usuario ha confirmado su correo electrónico
          toast.success('Correo confirmado correctamente');
          // Redirigir según el rol (verifica si es admin más adelante)
          navigate('/client');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      // Guardar ID de usuario actual si existe
      if (initialSession?.user) {
        localStorage.setItem('nytrix_previous_user', initialSession.user.id);
      }

      // Redirigir al usuario si está en la página de login o registro y ya está autenticado
      if (initialSession && (location.pathname === '/login' || location.pathname === '/register')) {
        navigate('/client');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    clearCart({ notify: false });
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
