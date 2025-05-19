
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { RegisterFormData } from "@/hooks/useRegisterForm";

interface ConfirmPasswordFieldProps {
  disabled?: boolean;
}

export default function ConfirmPasswordField({ disabled = false }: ConfirmPasswordFieldProps) {
  const { control } = useFormContext<RegisterFormData>();
  
  return (
    <FormField
      control={control}
      name="confirmPassword"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Confirmar Contraseña</FormLabel>
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
