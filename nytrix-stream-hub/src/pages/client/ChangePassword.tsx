
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ClientLayout from "@/components/layout/ClientLayout";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { useAuth } from "@/contexts/AuthContext";

export default function ChangePassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirigir a login si no hay usuario autenticado
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-pulse text-nytrix-purple">Cargando...</div>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <div className="container max-w-md mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold text-gradient-nytrix mb-6">Cambiar contraseña</h1>
        <div className="bg-nytrix-dark-purple/30 p-6 rounded-lg border border-nytrix-purple/20">
          <ChangePasswordForm />
        </div>
      </div>
    </ClientLayout>
  );
}
