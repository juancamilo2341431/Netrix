import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import LoginForm from "@/components/auth/LoginForm";
import EmailConfirmationModal from "@/components/auth/EmailConfirmationModal";

export default function Login() {
  const location = useLocation();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Check if we need to show the confirmation modal
  useEffect(() => {
    if (location.state && location.state.showEmailConfirmation) {
      setShowConfirmationModal(true);
      // Clear the state to prevent showing the modal on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-nytrix-dark-purple/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gradient-nytrix">Bienvenido de vuelta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Inicia sesión para acceder a tus cuentas de streaming
            </p>
          </div>
          
          <LoginForm />
          
          <div className="text-center text-sm">
            <Link to="/" className="text-nytrix-purple hover:underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      <EmailConfirmationModal 
        open={showConfirmationModal} 
        onClose={() => setShowConfirmationModal(false)}
      />
    </>
  );
}
