
import React from "react";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface EmailConfirmationModalProps {
  open: boolean;
  onClose: () => void;
}

const EmailConfirmationModal = ({ open, onClose }: EmailConfirmationModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card border border-nytrix-purple/20">
        <AlertDialogHeader>
          <div className="flex flex-col items-center mb-4">
            <div className="w-16 h-16 bg-nytrix-purple/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-nytrix-purple" />
            </div>
            <AlertDialogTitle className="text-xl text-center">Confirma tu correo electrónico</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-center">
            Hemos enviado un enlace de confirmación a tu correo electrónico.
            Por favor, revisa tu bandeja de entrada y confirma tu cuenta para
            continuar. Después de confirmar, serás redirigido automáticamente a tu dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <AlertDialogCancel asChild>
            <Button
              variant="default"
              className="bg-gradient-nytrix hover:opacity-90 w-full sm:w-auto"
              onClick={onClose}
            >
              Entendido
            </Button>
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EmailConfirmationModal;
