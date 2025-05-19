
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

interface FormSubmitButtonProps {
  isSubmitting: boolean;
}

export const FormSubmitButton = ({ isSubmitting }: FormSubmitButtonProps) => {
  return (
    <DialogFooter>
      <Button 
        type="submit"
        className="bg-gradient-nytrix hover:opacity-90"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creando..." : "Crear Cuenta"}
      </Button>
    </DialogFooter>
  );
};
