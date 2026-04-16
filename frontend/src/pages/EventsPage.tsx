import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EventFeaturedImage } from "@/components/EventFeaturedImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { notifyError } from "@/utils/notifications";
import { useAuthStore } from "../store/authStore";
import { useEventsStore } from "../store/eventsStore";
import { eventStatusLabel } from "../utils/labels";

export function EventsPage() {
  const { user } = useAuthStore();
  const { events, loading, error, page, pages, fetchEvents } = useEventsStore();
  const [search, setSearch] = useState("");
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const canManageEvents = Boolean(user?.roles?.includes("organizer") || isAdmin);

  useEffect(() => {
    fetchEvents({ page: 1, limit: 10 });
  }, [fetchEvents]);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const onSearch = () => {
    fetchEvents({ page: 1, limit: 10, search: search || undefined });
  };

  return (
    <div className="container">
      <Card className="mb-4 mt-6">
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
          <CardDescription>Buscador y listado completo de eventos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 pt-2 md:grid-cols-[1fr_auto]">
          <Input
            placeholder="Buscar por nombre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={onSearch} className="md:w-auto">
            Buscar
          </Button>
        </CardContent>
      </Card>

      {loading && <p className="muted">Cargando eventos...</p>}
      {error && <p className="error">{error}</p>}

      {events.map((event) => (
        <Card key={event.id} className="mb-3">
          <EventFeaturedImage
            name={event.name}
            alt={event.featured_image_alt}
            smUrl={event.featured_image_sm_url}
            mdUrl={event.featured_image_md_url}
            lgUrl={event.featured_image_lg_url}
            className="h-44 w-full object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
          />
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {event.location || "Sin ubicación"} · {eventStatusLabel(event.status)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{event.description || "Sin descripción"}</p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/events/${event.id}`}>Ver detalle</Link>
            </Button>
            {canManageEvents && (isAdmin || user?.id === event.organizer_id) && (
              <Button asChild size="sm">
                <Link to={`/events/${event.id}/edit`}>Editar</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}

      <div className="actions">
        <Button variant="outline" disabled={page <= 1} onClick={() => fetchEvents({ page: page - 1 })}>
          Anterior
        </Button>
        <span className="muted">Página {page} de {pages}</span>
        <Button variant="outline" disabled={page >= pages} onClick={() => fetchEvents({ page: page + 1 })}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
