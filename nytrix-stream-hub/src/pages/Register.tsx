import { Link } from "react-router-dom";
import RegisterForm from "@/components/auth/RegisterForm";

export default function Register() {
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-nytrix-dark-purple/30 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gradient-nytrix">Crea tu cuenta</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Regístrate para acceder a las mejores plataformas de streaming
            </p>
          </div>
          
          <RegisterForm />
          
          <div className="text-center text-sm">
            <Link to="/" className="text-nytrix-purple hover:underline">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
