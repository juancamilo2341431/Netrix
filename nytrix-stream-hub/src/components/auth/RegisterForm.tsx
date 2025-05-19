
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useRegisterForm } from "@/hooks/useRegisterForm";
import { 
  NameField, 
  EmailField, 
  PhoneField, 
  PasswordField, 
  ConfirmPasswordField 
} from "@/components/auth/FormFields";

export default function RegisterForm() {
  const { form, isLoading, phoneValue, setPhoneValue, handleSubmit } = useRegisterForm();

  return (
    <Card className="w-full max-w-md bg-card border border-nytrix-purple/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>
          Registra tus datos para acceder a nuestros servicios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <NameField disabled={isLoading} />
            <EmailField disabled={isLoading} />
            <PhoneField 
              disabled={isLoading} 
              value={phoneValue} 
              onChange={setPhoneValue} 
            />
            <PasswordField disabled={isLoading} />
            <ConfirmPasswordField disabled={isLoading} />
            
            <Button
              type="submit"
              className="w-full bg-gradient-nytrix hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <div className="text-sm text-center w-full text-muted-foreground">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="text-nytrix-purple hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
