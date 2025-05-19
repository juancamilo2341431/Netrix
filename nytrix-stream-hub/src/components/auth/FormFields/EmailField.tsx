
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { RegisterFormData } from "@/hooks/useRegisterForm";

interface EmailFieldProps {
  disabled?: boolean;
}

export default function EmailField({ disabled = false }: EmailFieldProps) {
  const { control } = useFormContext<RegisterFormData>();
  
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input
              {...field}
              type="email"
              placeholder="nombre@ejemplo.com"
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
