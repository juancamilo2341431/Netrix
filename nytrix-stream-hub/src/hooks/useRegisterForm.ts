
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Schema for form validation
export const registerFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un email válido"),
  phone: z.string().optional(),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export const useRegisterForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const navigate = useNavigate();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: ""
    }
  });

  const handleSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    
    try {
      console.log("Iniciando registro con datos:", { 
        email: data.email,
        nombre: data.name,
        telefono: phoneValue 
      });
      
      // Registrar usuario en Supabase Auth con metadata
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nombre_completo: data.name,
            telefono: phoneValue || ""
          }
        }
      });

      if (signUpError) {
        console.error("Error de autenticación:", signUpError);
        throw signUpError;
      }

      if (!authData?.user) {
        console.error("No se retornaron datos de usuario después del registro");
        throw new Error("Error al crear la cuenta. Inténtalo nuevamente.");
      }

      console.log("Registro exitoso:", authData);
      
      // Crear entrada en la tabla persona
      const { error: profileError } = await supabase
        .from('persona')
        .insert({
          id_user: authData.user.id,
          nombre_completo: data.name,
          correo: data.email,
          telefono: phoneValue || null,
          rol: 'cliente',
          estado: 'habilitado'
        });

      if (profileError) {
        console.error("Error al crear perfil de persona:", profileError);
        // No lanzamos error aquí para permitir que el flujo continúe,
        // pero mostramos una notificación
        toast.error("Se creó tu cuenta pero hubo un problema al configurar tu perfil");
      } else {
        console.log("Perfil de persona creado exitosamente");
      }
      
      // Redirect to login page with showConfirmationModal flag
      navigate("/login", { state: { showEmailConfirmation: true } });
      
    } catch (error: any) {
      console.error("Error de registro:", error);
      
      // Manejo de errores comunes
      if (error.message.includes("Email already registered")) {
        toast.error("Este correo ya está registrado. Intenta iniciar sesión.");
      } else if (error.message.includes("Database error saving new user")) {
        toast.error("Error en la base de datos al guardar el usuario. Por favor intenta más tarde.");
      } else if (error.message.includes("invalid_email")) {
        toast.error("El formato del correo electrónico no es válido.");
      } else if (error.message.includes("weak_password")) {
        toast.error("La contraseña es demasiado débil. Intenta con una más segura.");
      } else {
        toast.error(error.message || "Error al crear la cuenta. Inténtalo nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    phoneValue,
    setPhoneValue,
    handleSubmit: form.handleSubmit(handleSubmit)
  };
};
