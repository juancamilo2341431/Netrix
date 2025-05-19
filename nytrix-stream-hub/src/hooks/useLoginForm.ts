import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Schema for form validation
export const loginFormSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(1, "La contraseña es requerida")
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export const useLoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  const handleSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        throw error;
      }

      // Para fines de demo, verificar si es administrador
      const { data: personaData } = await supabase
        .from('persona')
        .select('rol')
        .eq('id_user', authData.user.id)
        .single();
      
      // Se eliminó el toast de éxito para evitar duplicados con AuthContext
      
      // Redireccionar según el rol
      if (personaData?.rol === 'admin') {
        navigate("/admin");
      } else {
        // Redirige a la página de inicio para clientes
        navigate("/");
      }
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);
      
      // Manejo de errores comunes
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Credenciales incorrectas. Inténtalo de nuevo.");
      } else {
        toast.error(error.message || "Error al iniciar sesión.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    handleSubmit: form.handleSubmit(handleSubmit)
  };
};
