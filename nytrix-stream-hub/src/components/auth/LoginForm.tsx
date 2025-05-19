
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useLoginForm } from "@/hooks/useLoginForm";
import { EmailField, LoginPasswordField } from "@/components/auth/FormFields";

export default function LoginForm() {
  const { form, isLoading, handleSubmit } = useLoginForm();

  return (
    <Card className="w-full max-w-md bg-card border border-nytrix-purple/20">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <EmailField disabled={isLoading} />
            <LoginPasswordField disabled={isLoading} />
            
            <Button
              type="submit"
              className="w-full bg-gradient-nytrix hover:opacity-90"
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-sm text-center text-muted-foreground">
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="text-nytrix-purple hover:underline">
            Regístrate
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
