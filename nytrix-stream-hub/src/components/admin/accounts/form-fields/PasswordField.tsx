
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { AccountFormValues } from "../account-schema";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PasswordFieldProps {
  form: UseFormReturn<AccountFormValues>;
}

export const PasswordField = ({ form }: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={form.control}
      name="contrasenia"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Contraseña</FormLabel>
          <div className="relative">
            <FormControl>
              <Input 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                className="pr-10"
                autoComplete="new-password"
                {...field} 
              />
            </FormControl>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only">
                {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              </span>
            </Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
