
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useFormContext } from "react-hook-form";
import { RegisterFormData } from "@/hooks/useRegisterForm";

interface NameFieldProps {
  disabled?: boolean;
}

export default function NameField({ disabled = false }: NameFieldProps) {
  const { control } = useFormContext<RegisterFormData>();
  
  return (
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nombre completo</FormLabel>
          <FormControl>
            <Input
              {...field}
              placeholder="Juan Pérez"
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
