
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { AccountFormValues } from "../account-schema";

interface PlatformFieldProps {
  form: UseFormReturn<AccountFormValues>;
  platforms: { id: number; nombre: string }[];
}

export const PlatformField = ({ form, platforms = [] }: PlatformFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="id_plataforma"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Plataforma</FormLabel>
          <Select 
            onValueChange={(value) => field.onChange(parseInt(value))} 
            value={field.value?.toString()}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una plataforma" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id.toString()}>
                  {platform.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
