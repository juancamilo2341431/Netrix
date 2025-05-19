
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { LoginFormData } from "@/hooks/useLoginForm";
import { Link } from "react-router-dom";

interface PasswordFieldProps {
  disabled?: boolean;
}

export default function LoginPasswordField({ disabled = false }: PasswordFieldProps) {
  const { control } = useFormContext<LoginFormData>();
  
  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>Contraseña</FormLabel>
            <Link to="/forgot-password" className="text-xs text-nytrix-purple hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
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
