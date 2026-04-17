import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { listEventsRequest } from "@/api/events";
import { listSessionsByEventRequest } from "@/api/sessions";
import { listSessionSpeakersRequest } from "@/api/speakers";
import { SectionSpinner } from "@/components/SectionSpinner";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getErrorMessage } from "@/utils/errors";
import { eventStatusLabel, sessionStatusLabel } from "@/utils/labels";
import { notifyError } from "@/utils/notifications";

const EVENT_STATUS_ORDER = ["draft", "published", "cancelled", "finished"] as const;
const SESSION_STATUS_ORDER = ["scheduled", "in_progress", "finished", "cancelled"] as const;

type MetricsData = {
  eventsByStatus: Array<{ status: string; label: string; total: number }>;
  sessionsByStatus: Array<{ status: string; label: string; total: number }>;
  eventsByMonth: Array<{ month: string; eventos: number }>;
  topOrganizers: Array<{ name: string; eventos: number }>;
  topSpeakers: Array<{ name: string; sesiones: number }>;
  sessionsPerEvent: Array<{ event: string; sesiones: number }>;
  totals: {
    events: number;
    sessions: number;
    speakerAssignments: number;
    avgSessionsPerEvent: number;
    avgSpeakersPerSession: number;
    publishedRate: number;
    upcomingEvents: number;
  };
};

const eventsByStatusConfig = {
  total: { label: "Eventos", color: "var(--color-chart-1)" }
} satisfies ChartConfig;

const sessionsByStatusConfig = {
  scheduled: { label: sessionStatusLabel("scheduled"), color: "var(--color-chart-1)" },
  in_progress: { label: sessionStatusLabel("in_progress"), color: "var(--color-chart-2)" },
  finished: { label: sessionStatusLabel("finished"), color: "var(--color-chart-3)" },
  cancelled: { label: sessionStatusLabel("cancelled"), color: "var(--color-chart-5)" }
} satisfies ChartConfig;

const eventsByMonthConfig = {
  eventos: { label: "Eventos", color: "var(--color-chart-2)" }
} satisfies ChartConfig;

const topOrganizersConfig = {
  eventos: { label: "Eventos", color: "var(--color-chart-3)" }
} satisfies ChartConfig;

const topSpeakersConfig = {
  sesiones: { label: "Sesiones", color: "var(--color-chart-4)" }
} satisfies ChartConfig;

const sessionsPerEventConfig = {
  sesiones: { label: "Sesiones", color: "var(--color-chart-5)" }
} satisfies ChartConfig;

function MetricInfo({ description }: { description: string }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Información de la métrica"
        >
          <AlertCircle className="h-4 w-4" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 text-sm">{description}</HoverCardContent>
    </HoverCard>
  );
}

function MetricTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      <MetricInfo description={description} />
    </div>
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildMetricsData(payload: {
  events: Array<{
    id: string;
    name: string;
    organizer_name?: string | null;
    organizer_id: string;
    status: string;
    start_date: string;
    created_at: string;
  }>;
  sessionsByEvent: Record<string, Array<{ id: string; title: string; status: string }>>;
  speakersBySession: Record<string, Array<{ speaker: { full_name: string } }>>;
}): MetricsData {
  const { events, sessionsByEvent, speakersBySession } = payload;
  const allSessions = Object.values(sessionsByEvent).flat();
  const allSpeakerAssignments = Object.values(speakersBySession).flat();
  const now = Date.now();

  const eventsByStatus = EVENT_STATUS_ORDER.map((status) => ({
    status,
    label: eventStatusLabel(status),
    total: events.filter((event) => event.status === status).length
  }));

  const sessionsByStatus = SESSION_STATUS_ORDER.map((status) => ({
    status,
    label: sessionStatusLabel(status),
    total: allSessions.filter((session) => session.status === status).length
  }));

  const monthMap = new Map<string, number>();
  events.forEach((event) => {
    const date = new Date(event.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
  });
  const eventsByMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([monthKey, total]) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return {
        month: date.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
        eventos: total
      };
    });

  const organizerMap = new Map<string, number>();
  events.forEach((event) => {
    const key = event.organizer_name || `Org ${event.organizer_id.slice(0, 8)}`;
    organizerMap.set(key, (organizerMap.get(key) || 0) + 1);
  });
  const topOrganizers = Array.from(organizerMap.entries())
    .map(([name, eventos]) => ({ name, eventos }))
    .sort((a, b) => b.eventos - a.eventos)
    .slice(0, 6);

  const speakerMap = new Map<string, number>();
  allSpeakerAssignments.forEach((assignment) => {
    const key = assignment.speaker.full_name;
    speakerMap.set(key, (speakerMap.get(key) || 0) + 1);
  });
  const topSpeakers = Array.from(speakerMap.entries())
    .map(([name, sesiones]) => ({ name, sesiones }))
    .sort((a, b) => b.sesiones - a.sesiones)
    .slice(0, 8);

  const sessionsPerEvent = events
    .map((event) => ({
      event: event.name,
      sesiones: sessionsByEvent[event.id]?.length || 0
    }))
    .sort((a, b) => b.sesiones - a.sesiones)
    .slice(0, 8);

  const publishedEvents = events.filter((event) => event.status === "published").length;
  const upcomingEvents = events.filter((event) => new Date(event.start_date).getTime() >= now).length;

  return {
    eventsByStatus,
    sessionsByStatus,
    eventsByMonth,
    topOrganizers,
    topSpeakers,
    sessionsPerEvent,
    totals: {
      events: events.length,
      sessions: allSessions.length,
      speakerAssignments: allSpeakerAssignments.length,
      avgSessionsPerEvent: events.length ? round2(allSessions.length / events.length) : 0,
      avgSpeakersPerSession: allSessions.length ? round2(allSpeakerAssignments.length / allSessions.length) : 0,
      publishedRate: events.length ? round2((publishedEvents / events.length) * 100) : 0,
      upcomingEvents
    }
  };
}

export function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsData | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const firstPage = await listEventsRequest({ page: 1, limit: 100 });
        const pageRequests = [];
        for (let page = 2; page <= firstPage.pages; page += 1) {
          pageRequests.push(listEventsRequest({ page, limit: 100 }));
        }
        const pageResults = pageRequests.length ? await Promise.all(pageRequests) : [];
        const events = [firstPage, ...pageResults].flatMap((row) => row.items);

        const sessionsByEvent: Record<string, Array<{ id: string; title: string; status: string }>> = {};
        const sessionsResults = await Promise.allSettled(
          events.map(async (event) => {
            const sessions = await listSessionsByEventRequest(event.id);
            return { eventId: event.id, sessions };
          })
        );
        sessionsResults.forEach((result) => {
          if (result.status === "fulfilled") {
            sessionsByEvent[result.value.eventId] = result.value.sessions;
          }
        });

        const sessionIds = Object.values(sessionsByEvent).flatMap((sessions) => sessions.map((session) => session.id));
        const speakersBySession: Record<string, Array<{ speaker: { full_name: string } }>> = {};
        const speakersResults = await Promise.allSettled(
          sessionIds.map(async (sessionId) => {
            const speakers = await listSessionSpeakersRequest(sessionId);
            return { sessionId, speakers };
          })
        );
        speakersResults.forEach((result) => {
          if (result.status === "fulfilled") {
            speakersBySession[result.value.sessionId] = result.value.speakers;
          }
        });

        setMetrics(
          buildMetricsData({
            events,
            sessionsByEvent,
            speakersBySession
          })
        );
      } catch (err: any) {
        const message = getErrorMessage(err, "No fue posible cargar las métricas.");
        setError(message);
        await notifyError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const kpiCards = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        label: "Eventos",
        value: metrics.totals.events,
        help: "Total de eventos registrados en la plataforma, sin importar su estado."
      },
      {
        label: "Sesiones",
        value: metrics.totals.sessions,
        help: "Total de sesiones creadas y asociadas a eventos."
      },
      {
        label: "Asignaciones de ponentes",
        value: metrics.totals.speakerAssignments,
        help: "Cantidad total de relaciones sesión-ponente existentes."
      },
      {
        label: "Promedio sesiones / evento",
        value: metrics.totals.avgSessionsPerEvent,
        help: "Promedio de sesiones por evento: total de sesiones dividido por total de eventos."
      },
      {
        label: "Promedio ponentes / sesión",
        value: metrics.totals.avgSpeakersPerSession,
        help: "Promedio de ponentes asignados por sesión."
      },
      {
        label: "Tasa de publicación",
        value: `${metrics.totals.publishedRate}%`,
        help: "Porcentaje de eventos en estado publicado sobre el total de eventos."
      },
      {
        label: "Eventos próximos",
        value: metrics.totals.upcomingEvents,
        help: "Eventos cuya fecha de inicio aún no ocurre."
      }
    ];
  }, [metrics]);

  return (
    <div className="container">
      <h1 className="my-6">Métricas</h1>
      {loading && <SectionSpinner label="Cargando métricas..." />}
      {!loading && error && <p className="error">{error}</p>}

      {!loading && !error && metrics && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <Card key={card.label}>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <span>{card.label}</span>
                    <MetricInfo description={card.help} />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <MetricTitle
                    title="Eventos por estado"
                    description="Muestra cuántos eventos hay en cada estado: borrador, publicado, cancelado y finalizado."
                  />
                </CardTitle>
                <CardDescription>Distribución actual del ciclo de vida de eventos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={eventsByStatusConfig} className="h-[280px] w-full">
                  <BarChart accessibilityLayer data={metrics.eventsByStatus}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-total)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <MetricTitle
                    title="Sesiones por estado"
                    description="Distribución de sesiones según su estado operativo: programada, en progreso, finalizada o cancelada."
                  />
                </CardTitle>
                <CardDescription>Cómo están distribuidas las sesiones en la plataforma.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={sessionsByStatusConfig} className="h-[280px] w-full">
                  <PieChart accessibilityLayer>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie data={metrics.sessionsByStatus} dataKey="total" nameKey="label" innerRadius={60} outerRadius={95}>
                      {metrics.sessionsByStatus.map((entry) => (
                        <Cell key={`cell-${entry.status}`} fill={`var(--color-${entry.status})`} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <MetricTitle
                    title="Eventos creados por mes"
                    description="Tendencia temporal de creación de eventos agrupada por mes."
                  />
                </CardTitle>
                <CardDescription>Tendencia de creación en los últimos meses.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={eventsByMonthConfig} className="h-[280px] w-full">
                  <LineChart accessibilityLayer data={metrics.eventsByMonth}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line
                      dataKey="eventos"
                      type="monotone"
                      stroke="var(--color-eventos)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--color-eventos)" }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <MetricTitle
                    title="Top organizadores"
                    description="Ranking de usuarios organizadores con mayor número de eventos creados."
                  />
                </CardTitle>
                <CardDescription>Usuarios con más eventos creados.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={topOrganizersConfig} className="h-[280px] w-full">
                  <BarChart accessibilityLayer data={metrics.topOrganizers} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="eventos" fill="var(--color-eventos)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <MetricTitle
                    title="Top ponentes activos"
                    description="Ranking de ponentes con más asignaciones a sesiones."
                  />
                </CardTitle>
                <CardDescription>Más asignaciones en sesiones.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={topSpeakersConfig} className="h-[280px] w-full">
                  <BarChart accessibilityLayer data={metrics.topSpeakers}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="sesiones" fill="var(--color-sesiones)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <MetricTitle
                    title="Eventos con más sesiones"
                    description="Eventos con mayor cantidad de sesiones asociadas."
                  />
                </CardTitle>
                <CardDescription>Ranking de eventos por número de sesiones.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={sessionsPerEventConfig} className="h-[280px] w-full">
                  <BarChart accessibilityLayer data={metrics.sessionsPerEvent}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="event" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="sesiones" fill="var(--color-sesiones)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
