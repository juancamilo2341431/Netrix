
import { z } from "zod";

// Schema for platform creation form
export const platformSchema = z.object({
  nombre: z.string().min(1, { message: "El nombre es requerido" }),
  descripcion: z.string().optional(),
  precio: z.string().refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0;
    },
    { message: "El precio debe ser un número positivo" }
  ),
});

export type PlatformFormValues = z.infer<typeof platformSchema>;

