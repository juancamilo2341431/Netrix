
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";

export default function SecurityTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Cambiar Contraseña</CardTitle>
        <CardDescription>Actualiza tu contraseña para mayor seguridad</CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordForm />
      </CardContent>
    </Card>
  );
}
