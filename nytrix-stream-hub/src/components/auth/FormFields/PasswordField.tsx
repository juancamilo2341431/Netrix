
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { RegisterFormData } from "@/hooks/useRegisterForm";

interface PasswordFieldProps {
  disabled?: boolean;
}

export default function PasswordField({ disabled = false }: PasswordFieldProps) {
  const { control } = useFormContext<RegisterFormData>();
  
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Contraseña</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="password"
              placeholder="••••••••"
              className="border-nytrix-purple/20 bg-background"
              disabled={disabled}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
