import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { getMetricsSummaryRequest } from "@/api/metrics";
import { SectionSpinner } from "@/components/SectionSpinner";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import type { MetricsSummaryResponse } from "@/types/metrics";
import { eventStatusLabel, registrationStatusLabel, sessionStatusLabel } from "@/utils/labels";
import { notifyError } from "@/utils/notifications";
import { getErrorMessage } from "../utils/errors";

const eventsByStatusConfig = {
  total: { label: "Eventos", color: "var(--color-chart-1)" }
} satisfies ChartConfig;

const sessionsByStatusConfig = {
  scheduled: { label: sessionStatusLabel("scheduled"), color: "var(--color-chart-1)" },
  in_progress: { label: sessionStatusLabel("in_progress"), color: "var(--color-chart-2)" },
  finished: { label: sessionStatusLabel("finished"), color: "var(--color-chart-3)" },
  cancelled: { label: sessionStatusLabel("cancelled"), color: "var(--color-chart-5)" }
} satisfies ChartConfig;

const registrationsByStatusConfig = {
  registered: { label: registrationStatusLabel("registered"), color: "var(--color-chart-3)" },
  cancelled: { label: registrationStatusLabel("cancelled"), color: "var(--color-chart-5)" },
  waitlist: { label: registrationStatusLabel("waitlist"), color: "var(--color-chart-2)" }
} satisfies ChartConfig;

const monthTrendConfig = {
  total: { label: "Total", color: "var(--color-chart-2)" }
} satisfies ChartConfig;

const organizerConfig = {
  events: { label: "Eventos", color: "var(--color-chart-3)" }
} satisfies ChartConfig;

const speakersConfig = {
  sessions: { label: "Sesiones", color: "var(--color-chart-4)" }
} satisfies ChartConfig;

const occupancyConfig = {
  occupancy: { label: "Ocupación (%)", color: "var(--color-chart-1)" }
} satisfies ChartConfig;

const sessionsPerEventConfig = {
  sessions: { label: "Sesiones", color: "var(--color-chart-5)" }
} satisfies ChartConfig;

type FiltersState = {
  startDate: string;
  endDate: string;
  eventStatus: string;
  organizerId: string;
};

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

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
}

export function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummaryResponse | null>(null);
  const [filters, setFilters] = useState<FiltersState>({
    startDate: "",
    endDate: "",
    eventStatus: "",
    organizerId: ""
  });

  const loadMetrics = async (nextFilters: FiltersState) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMetricsSummaryRequest({
        start_date: nextFilters.startDate ? `${nextFilters.startDate}T00:00:00Z` : undefined,
        end_date: nextFilters.endDate ? `${nextFilters.endDate}T23:59:59Z` : undefined,
        event_status: nextFilters.eventStatus || undefined,
        organizer_id: nextFilters.organizerId || undefined
      });
      setMetrics(data);
    } catch (err: any) {
      const message = getErrorMessage(err, "No fue posible cargar las métricas.");
      setError(message);
      await notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMetrics(filters);
  }, []);

  const onApplyFilters = () => {
    void loadMetrics(filters);
  };

  const onClearFilters = () => {
    const emptyFilters: FiltersState = {
      startDate: "",
      endDate: "",
      eventStatus: "",
      organizerId: ""
    };
    setFilters(emptyFilters);
    void loadMetrics(emptyFilters);
  };

  const kpiCards = useMemo(() => {
    if (!metrics) return [];
    return [
      {
        label: "Eventos",
        value: metrics.totals.events,
        help: "Total de eventos dentro de los filtros activos."
      },
      {
        label: "Sesiones",
        value: metrics.totals.sessions,
        help: "Total de sesiones relacionadas a los eventos filtrados."
      },
      {
        label: "Inscritos",
        value: metrics.totals.registered_attendees,
        help: "Total de registros activos de asistencia."
      },
      {
        label: "Cancelaciones",
        value: metrics.totals.cancelled_registrations,
        help: "Registros que actualmente están en estado cancelado."
      },
      {
        label: "Capacidad total",
        value: metrics.totals.total_capacity,
        help: "Suma de capacidad máxima de los eventos filtrados."
      },
      {
        label: "Ocupación global",
        value: `${metrics.totals.occupancy_rate}%`,
        help: "Inscritos activos sobre capacidad total disponible."
      },
      {
        label: "Tasa de cancelación",
        value: `${metrics.totals.cancellation_rate}%`,
        help: "Cancelaciones sobre el total de registros (inscritos + cancelados)."
      },
      {
        label: "Tasa de publicación",
        value: `${metrics.totals.published_rate}%`,
        help: "Porcentaje de eventos publicados frente al total analizado."
      }
    ];
  }, [metrics]);

  return (
    <div className="container">
      <h1 className="my-6">Métricas</h1>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtros analíticos</CardTitle>
          <CardDescription>
            Acota el análisis por rango de fechas, estado de evento y organizador para tomar decisiones puntuales.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
          />
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
          />
          <select
            value={filters.eventStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, eventStatus: e.target.value }))}
          >
            <option value="">Todos los estados</option>
            <option value="draft">{eventStatusLabel("draft")}</option>
            <option value="published">{eventStatusLabel("published")}</option>
            <option value="cancelled">{eventStatusLabel("cancelled")}</option>
            <option value="finished">{eventStatusLabel("finished")}</option>
          </select>
          <select
            value={filters.organizerId}
            onChange={(e) => setFilters((prev) => ({ ...prev, organizerId: e.target.value }))}
          >
            <option value="">Todos los organizadores</option>
            {(metrics?.organizers || []).map((organizer) => (
              <option key={organizer.id} value={organizer.id}>
                {organizer.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="button" className="h-10 px-3" onClick={onApplyFilters}>
              Aplicar
            </Button>
            <Button type="button" variant="outline" className="h-10 px-3" onClick={onClearFilters}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

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
                <CardTitle>Eventos por estado</CardTitle>
                <CardDescription>Distribución del ciclo de vida de eventos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={eventsByStatusConfig} className="h-[280px] w-full">
                  <BarChart accessibilityLayer data={metrics.events_by_status.map((item) => ({ ...item, label: eventStatusLabel(item.status) }))}>
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
                <CardTitle>Sesiones por estado</CardTitle>
                <CardDescription>Cómo está la operación de sesiones.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={sessionsByStatusConfig} className="h-[280px] w-full">
                  <PieChart accessibilityLayer>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={metrics.sessions_by_status.map((item) => ({ ...item, label: sessionStatusLabel(item.status) }))}
                      dataKey="total"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={95}
                    >
                      {metrics.sessions_by_status.map((entry) => (
                        <Cell key={`session-cell-${entry.status}`} fill={`var(--color-${entry.status})`} />
                      ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registros por estado</CardTitle>
                <CardDescription>Balance entre inscritos, cancelados y lista de espera.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={registrationsByStatusConfig} className="h-[280px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={metrics.registrations_by_status.map((item) => ({ ...item, label: registrationStatusLabel(item.status) }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="total" fill="var(--color-registered)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inscripciones por mes</CardTitle>
                <CardDescription>Tendencia temporal de demanda/asistencia.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={monthTrendConfig} className="h-[280px] w-full">
                  <LineChart
                    accessibilityLayer
                    data={metrics.registrations_by_month.map((item) => ({ ...item, label: formatMonthLabel(item.month) }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line
                      dataKey="total"
                      type="monotone"
                      stroke="var(--color-total)"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--color-total)" }}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos con mayor ocupación</CardTitle>
                <CardDescription>Qué eventos están aprovechando mejor su capacidad.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={occupancyConfig} className="h-[300px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={metrics.event_occupancy.slice(0, 8).map((item) => ({
                      event: item.event_name,
                      occupancy: item.occupancy_rate
                    }))}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="event" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="occupancy" fill="var(--color-occupancy)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top organizadores</CardTitle>
                <CardDescription>Organizadores con mayor volumen de eventos.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={organizerConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={metrics.top_organizers.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={120} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="events" fill="var(--color-events)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top ponentes activos</CardTitle>
                <CardDescription>Ponentes con más participación en sesiones.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={speakersConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={metrics.top_speakers.slice(0, 10)}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="sessions" fill="var(--color-sessions)" radius={8} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Eventos con más sesiones</CardTitle>
                <CardDescription>Carga operativa de cada evento.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={sessionsPerEventConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={metrics.sessions_per_event.slice(0, 10)}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="event_name" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="sessions" fill="var(--color-sessions)" radius={8} />
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
