
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, "La contraseña actual debe tener al menos 6 caracteres"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
  confirmNewPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "La nueva contraseña debe ser diferente a la actual",
  path: ["newPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

export default function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = async (values: PasswordChangeFormValues) => {
    setIsLoading(true);
    try {
      // Primero verificamos la contraseña actual intentando iniciar sesión
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email || '',
        password: values.currentPassword,
      });

      if (signInError) {
        form.setError("currentPassword", { 
          type: "manual", 
          message: "La contraseña actual es incorrecta" 
        });
        setIsLoading(false);
        return;
      }

      // Si la contraseña actual es correcta, actualizamos la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (updateError) {
        toast.error("Error al actualizar la contraseña", {
          description: updateError.message,
        });
        setIsLoading(false);
        return;
      }

      toast.success("Contraseña actualizada exitosamente");
      form.reset();
    } catch (error) {
      toast.error("Error al cambiar la contraseña", {
        description: "Por favor intenta nuevamente más tarde.",
      });
      console.error("Error al cambiar la contraseña:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña actual</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  className="border-nytrix-purple/20 bg-background"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nueva contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  className="border-nytrix-purple/20 bg-background"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nueva contraseña</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  {...field}
                  className="border-nytrix-purple/20 bg-background"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full bg-gradient-nytrix"
            disabled={isLoading}
          >
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Form>
  );
}
