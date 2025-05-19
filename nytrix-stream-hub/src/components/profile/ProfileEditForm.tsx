
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneField from "@/components/auth/FormFields/PhoneField";
import { ProfileFormData } from "@/hooks/useProfile";

// Validation schema for profile editing
const profileSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Introduce un correo electrónico válido"),
  phone: z.string().min(6, "Introduce un número de teléfono válido"),
});

interface ProfileEditFormProps {
  initialData: ProfileFormData;
  phoneValue: string;
  onPhoneChange: (value: string) => void;
  onSubmit: (data: ProfileFormData) => void;
}

export default function ProfileEditForm({ 
  initialData, 
  phoneValue, 
  onPhoneChange, 
  onSubmit 
}: ProfileEditFormProps) {
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: initialData
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Juan Pérez"
                  className="border-nytrix-purple/20 bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="border-nytrix-purple/20 bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <PhoneField 
          value={phoneValue}
          onChange={onPhoneChange}
        />
      </form>
    </Form>
  );
}
