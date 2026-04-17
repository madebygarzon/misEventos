import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="container">
      <div className="mx-auto mt-14 max-w-2xl text-center">
        <p className="text-sm font-semibold text-muted-foreground">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold">Página no encontrada</h1>
        <p className="muted mt-3">
          La ruta que estás buscando no existe o fue movida.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
