import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function OffererPage() {
  return (
    <div className="container">
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Soy oferente?</CardTitle>
          <CardDescription>
            Espacio para el flujo de proveedores/oferentes del sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="muted">
            Aquí podremos configurar el proceso para que un usuario se postule como oferente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
