
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { accountSchema, type AccountFormValues } from "./account-schema";
import { PlatformField, EmailField, PasswordField } from "./form-fields";
import { FormSubmitButton } from "./form-actions/FormSubmitButton";

interface AccountFormProps {
  onSubmit: (data: AccountFormValues) => Promise<void>;
  isSubmitting: boolean;
  platforms: { id: number; nombre: string }[];
}

export const AccountForm = ({ 
  onSubmit, 
  isSubmitting, 
  platforms = [] // Ensure platforms has a default value
}: AccountFormProps) => {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      correo: "",
      contrasenia: "",
      id_plataforma: undefined,
    },
  });

  const handleSubmit = async (data: AccountFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <PlatformField form={form} platforms={platforms} />
        <EmailField form={form} />
        <PasswordField form={form} />
        <FormSubmitButton isSubmitting={isSubmitting} />
      </form>
    </Form>
  );
};
