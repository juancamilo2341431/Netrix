
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";
import { RegisterFormData } from "@/hooks/useRegisterForm";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface PhoneFieldProps {
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneField({ disabled = false, value, onChange }: PhoneFieldProps) {
  const { control, setValue } = useFormContext<RegisterFormData>();
  
  return (
    <FormField
      control={control}
      name="phone"
      render={() => (
        <FormItem>
          <FormLabel>Teléfono</FormLabel>
          <FormControl>
            <div className="phone-input-container">
              <PhoneInput
                country={'co'}
                value={value}
                onChange={(value) => {
                  onChange(value);
                  setValue("phone", value);
                }}
                containerClass="w-full"
                inputClass="w-full h-10 px-3 py-2 border rounded-md border-nytrix-purple/20 bg-background text-base"
                buttonClass="bg-background border-nytrix-purple/20"
                dropdownClass="bg-card border border-nytrix-purple/20"
                disabled={disabled}
                searchClass="bg-background text-foreground"
                searchPlaceholder="Buscar país..."
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
