
import * as z from "zod";

export type AccountStatus = "disponible" | "alquilada" | "revision" | "tramite" | "papelera" | "eliminada";

// Expresión regular para validar correos electrónicos más estrictamente
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const accountSchema = z.object({
  correo: z.string()
    .min(5, "El correo debe tener al menos 5 caracteres")
    .max(255, "El correo no puede exceder los 255 caracteres")
    .regex(emailRegex, "Correo electrónico no válido"),
  
  contrasenia: z.string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(100, "La contraseña no puede exceder los 100 caracteres")
    .refine(
      (password) => {
        // Validar que la contraseña tenga al menos un número y una letra
        return /[0-9]/.test(password) && /[a-zA-Z]/.test(password);
      },
      {
        message: "La contraseña debe contener al menos un número y una letra",
      }
    ),
  
  id_plataforma: z.number()
    .int("La plataforma debe ser un número entero")
    .positive("La plataforma debe ser un valor positivo")
    .min(1, "La plataforma es requerida"),
  
  // La cuenta se creará siempre como disponible por defecto
});

export type AccountFormValues = z.infer<typeof accountSchema>;
