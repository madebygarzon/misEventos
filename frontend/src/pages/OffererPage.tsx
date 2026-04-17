import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { listEventsRequest } from "@/api/events";
import { listSessionsByEventRequest } from "@/api/sessions";
import { listSessionSpeakersRequest } from "@/api/speakers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/utils/errors";
import { notifyError, notifyInfo } from "@/utils/notifications";

type OffererMatch = {
  eventId: string;
  eventName: string;
  eventLocation: string | null;
  startDate: string;
  sessionMatches: Array<{
    sessionId: string;
    sessionTitle: string;
    speakerNames: string[];
  }>;
};

export function OffererPage() {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<OffererMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootstrapping(false), 550);
    return () => window.clearTimeout(timer);
  }, []);

  const onSearch = async () => {
    const normalizedQuery = query.trim().toLowerCase();
    setSearched(true);
    setError(null);

    if (!normalizedQuery) {
      setMatches([]);
      await notifyInfo("Ingresa un nombre o parte del nombre para buscar.");
      return;
    }

    setLoading(true);
    const startTs = Date.now();
    try {
      const firstPage = await listEventsRequest({ page: 1, limit: 100 });
      const pendingPages = [];
      for (let page = 2; page <= firstPage.pages; page += 1) {
        pendingPages.push(listEventsRequest({ page, limit: 100 }));
      }

      const restPages = pendingPages.length ? await Promise.all(pendingPages) : [];
      const events = [firstPage, ...restPages].flatMap((page) => page.items);
      const eventRows = await Promise.all(
        events.map(async (event) => {
          const sessions = await listSessionsByEventRequest(event.id);
          const sessionMatches = await Promise.all(
            sessions.map(async (session) => {
              const assignedSpeakers = await listSessionSpeakersRequest(session.id);
              const matchedNames = Array.from(
                new Set(
                  assignedSpeakers
                    .map((item) => item.speaker.full_name)
                    .filter((name) => name.toLowerCase().includes(normalizedQuery))
                )
              );

              if (!matchedNames.length) return null;
              return {
                sessionId: session.id,
                sessionTitle: session.title,
                speakerNames: matchedNames
              };
            })
          );

          const normalizedSessions = sessionMatches.filter((row): row is NonNullable<typeof row> => Boolean(row));
          if (!normalizedSessions.length) return null;

          return {
            eventId: event.id,
            eventName: event.name,
            eventLocation: event.location,
            startDate: event.start_date,
            sessionMatches: normalizedSessions
          };
        })
      );

      const normalizedRows = eventRows.filter((row): row is OffererMatch => Boolean(row));
      setMatches(normalizedRows);

      if (!normalizedRows.length) {
        await notifyInfo("No se encontraron eventos asociados a ese oferente.");
      }
    } catch (err: any) {
      const message = getErrorMessage(err, "No fue posible buscar eventos por oferente.");
      setError(message);
      setMatches([]);
      await notifyError(message);
    } finally {
      const elapsed = Date.now() - startTs;
      if (elapsed < 500) {
        await new Promise((resolve) => window.setTimeout(resolve, 500 - elapsed));
      }
      setLoading(false);
    }
  };

  const onClearSearch = () => {
    setQuery("");
    setMatches([]);
    setError(null);
    setSearched(false);
  };

  return (
    <div className="container">
      <h1 className="my-6">Soy oferente?</h1>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Soy oferente?</CardTitle>
          <CardDescription>
            Busca por nombre o parte del nombre de un oferente y te mostraremos los eventos donde tiene sesiones asignadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ej: Carlos, Ana, Juan..."
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void onSearch();
                }
              }}
            />
            <Button type="button" onClick={() => void onSearch()} disabled={loading}>
              Buscar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClearSearch}
              disabled={loading || (!query.trim() && !searched && !matches.length && !error)}
            >
              Limpiar
            </Button>
          </div>

          {(bootstrapping || loading) && (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={`offerer-loading-skeleton-${index}`}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 bg-muted-foreground/20" />
                    <Skeleton className="h-4 w-1/2 bg-muted-foreground/20" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Skeleton className="h-16 w-full bg-muted-foreground/20" />
                    <Skeleton className="h-16 w-full bg-muted-foreground/20" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-24 bg-muted-foreground/20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          {!bootstrapping && !loading && error && <p className="error mt-4">{error}</p>}

          {!bootstrapping && !loading && searched && !matches.length && !error && (
            <div className="mt-4 space-y-3">
              <p className="muted">No hay resultados para la búsqueda actual.</p>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card key={`offerer-empty-skeleton-${index}`}>
                    <CardHeader>
                      <Skeleton className="h-6 w-2/3 bg-muted-foreground/20" />
                      <Skeleton className="h-4 w-1/2 bg-muted-foreground/20" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-14 w-full bg-muted-foreground/20" />
                      <Skeleton className="h-14 w-full bg-muted-foreground/20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!bootstrapping && !loading && !!matches.length && (
            <div className="mt-5 grid gap-4">
              {matches.map((row) => (
                <Card className="mb-4" key={row.eventId}>
                  <CardHeader>
                    <CardTitle>{row.eventName}</CardTitle>
                    <CardDescription>
                      {row.eventLocation || "Sin ubicación"} · {new Date(row.startDate).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {row.sessionMatches.map((session) => (
                      <div key={session.sessionId} className="rounded-md border border-border bg-muted/20 px-3 py-2">
                        <p className="text-sm font-medium">{session.sessionTitle}</p>
                        <p className="text-sm text-muted-foreground">
                          Oferentes: {session.speakerNames.join(", ")}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter className="">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/events/${row.eventId}`}>Ver evento</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
