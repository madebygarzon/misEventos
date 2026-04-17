import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { EventFeaturedImage } from "@/components/EventFeaturedImage";
import { SectionSpinner } from "@/components/SectionSpinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { notifyError } from "@/utils/notifications";
import { useAuthStore } from "../store/authStore";
import { useEventsStore } from "../store/eventsStore";
import { eventStatusLabel } from "../utils/labels";

export function EventsPage() {
  const { user } = useAuthStore();
  const { events, loading, error, page, pages, fetchEvents } = useEventsStore();
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const canManageEvents = Boolean(
    user?.roles?.includes("organizer") || isAdmin,
  );

  useEffect(() => {
    fetchEvents({ page: 1, limit: 10 });
  }, [fetchEvents]);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const onSearch = () => {
    fetchEvents({ page: 1, limit: 10, search: search || undefined });
  };

  const onClearSearch = () => {
    setSearch("");
    setFilterDate("");
    fetchEvents({ page: 1, limit: 10 });
  };

  const buildPageItems = () => {
    if (pages <= 5) return Array.from({ length: pages }, (_, i) => i + 1);
    const items: Array<number | "ellipsis"> = [];
    items.push(1);

    const start = Math.max(2, page - 1);
    const end = Math.min(pages - 1, page + 1);

    if (start > 2) items.push("ellipsis");
    for (let p = start; p <= end; p += 1) items.push(p);
    if (end < pages - 1) items.push("ellipsis");

    items.push(pages);
    return items;
  };

  const pageItems = buildPageItems();
  const formatEventDate = (value: string) =>
    new Date(value).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const selectedFilterDate = filterDate ? new Date(`${filterDate}T00:00:00`) : null;
  const visibleEvents = events.filter((event) => {
    if (!selectedFilterDate) return true;
    const selectedTime = selectedFilterDate.getTime();
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return selectedTime >= start.getTime() && selectedTime <= end.getTime();
  });

  return (
    <div className="container">
      <h1 className="my-6">Eventos</h1>

      <Card className="mb-4 mt-6">
        <CardHeader>
          <CardDescription>
            Buscador y listado completo de eventos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid items-center gap-3 px-4 pt-2 md:grid-cols-[1fr_auto_180px_auto]">
          <Input
            className="h-10"
            placeholder="Buscar por nombre"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button onClick={onSearch} className="h-10 md:w-auto">
            Buscar
          </Button>
          <Input
            className="h-10"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <Button
            onClick={onClearSearch}
            variant="outline"
            className="h-10 md:w-auto"
            disabled={!search.trim() && !filterDate}
          >
            Limpiar
          </Button>
        </CardContent>
      </Card>

      {loading && <SectionSpinner label="Cargando eventos..." />}
      {error && <p className="error">{error}</p>}

      {loading && (
        <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`skeleton-${index}`}>
              <Skeleton className="h-44 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-11/12" />
              </CardContent>
              <CardFooter className="gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden pt-0">
            <EventFeaturedImage
              name={event.name}
              alt={event.featured_image_alt}
              smUrl={event.featured_image_sm_url}
              mdUrl={event.featured_image_md_url}
              lgUrl={event.featured_image_lg_url}
              className="h-44 w-full object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
            <CardHeader>
              <CardTitle>{event.name}</CardTitle>
              <CardDescription>
                {event.location || "Sin ubicación"} ·{" "}
                {eventStatusLabel(event.status)}
              </CardDescription>
              <p className="muted">
                Fecha: {formatEventDate(event.start_date)} -{" "}
                {formatEventDate(event.end_date)}
              </p>
            </CardHeader>
            <CardContent>
              <p>{event.description || "Sin descripción"}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/events/${event.id}`}>Ver detalle</Link>
              </Button>
              {canManageEvents &&
                (isAdmin || user?.id === event.organizer_id) && (
                  <Button asChild size="sm">
                    <Link to={`/events/${event.id}/edit`}>Editar</Link>
                  </Button>
                )}
            </CardFooter>
          </Card>
        ))}
      </div>
      {!loading && !visibleEvents.length && (
        <p className="muted mt-3">No hay eventos para la fecha seleccionada.</p>
      )}

      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="Anterior"
              onClick={(e) => {
                e.preventDefault();
                if (page > 1)
                  fetchEvents({
                    page: page - 1,
                    limit: 10,
                    search: search || undefined,
                  });
              }}
            />
          </PaginationItem>

          {pageItems.map((item, index) => (
            <PaginationItem key={`${item}-${index}`}>
              {item === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  isActive={item === page}
                  onClick={(e) => {
                    e.preventDefault();
                    fetchEvents({
                      page: item,
                      limit: 10,
                      search: search || undefined,
                    });
                  }}
                >
                  {item}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              href="#"
              text="Siguiente"
              onClick={(e) => {
                e.preventDefault();
                if (page < pages)
                  fetchEvents({
                    page: page + 1,
                    limit: 10,
                    search: search || undefined,
                  });
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
