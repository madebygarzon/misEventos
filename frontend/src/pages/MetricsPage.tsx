import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricsPage() {
  return (
    <div className="container">
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Métricas</CardTitle>
          <CardDescription>
            Panel base para indicadores de uso y desempeño de eventos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="muted">
            Esta sección está lista para integrar KPIs, embudos de inscripción y reportes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
