import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { EventFeaturedImage } from "@/components/EventFeaturedImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEventsStore } from "@/store/eventsStore";
import { eventStatusLabel } from "@/utils/labels";

export function EventsListPage() {
  const { events, fetchEvents } = useEventsStore();
  const [lottieData, setLottieData] = useState<Record<string, unknown> | null>(null);
  const [LottiePlayer, setLottiePlayer] = useState<ComponentType<any> | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/Core-Apps Associations.json")
      .then((response) => response.json())
      .then((data) => setLottieData(data))
      .catch(() => setLottieData(null));
  }, []);

  useEffect(() => {
    fetchEvents({ page: 1, limit: 12 });
  }, [fetchEvents]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isJsdom = window.navigator.userAgent.toLowerCase().includes("jsdom");
    if (isJsdom) return;

    import("lottie-react")
      .then((module) => setLottiePlayer(() => module.default))
      .catch(() => setLottiePlayer(null));
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider || events.length === 0) return;

    const speedPxPerSecond = 80;
    const animate = (timestamp: number) => {
      if (previousTimestampRef.current === null) {
        previousTimestampRef.current = timestamp;
      }

      const delta = timestamp - previousTimestampRef.current;
      previousTimestampRef.current = timestamp;

      if (!isPaused) {
        slider.scrollLeft += (speedPxPerSecond * delta) / 1000;
        const resetPoint = slider.scrollWidth / 2;
        if (slider.scrollLeft >= resetPoint) {
          slider.scrollLeft -= resetPoint;
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      previousTimestampRef.current = null;
    };
  }, [events.length, isPaused]);

  const loopingEvents = useMemo(() => [...events, ...events], [events]);

  return (
    <div className="container">
      <div className="space-y-6" style={{ marginTop: "30px" }}>
        <div className="mb-10">
          <CardTitle className="text-[35px] text-[#2e2e2e] md:text-[43px]">Bienvenidos a Mis Eventos</CardTitle>
          <CardDescription className="muted text-[22px]">Sistema de gestion de eventos</CardDescription>
          
        </div>

        <div className="grid items-start gap-4 md:grid-cols-2">
          
          <div>
            <CardTitle className="text-[20px] text-[#2e2e2e] md:text-[25px]">Eventos destacados</CardTitle>
            <div className="mt-2 flex h-100 items-end justify-start overflow-hidden">
              {lottieData && LottiePlayer ? (
                <LottiePlayer animationData={lottieData} loop className="ml-0 mr-auto h-full w-auto max-w-full" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border">
                  <p className="muted">No se pudo cargar la animación.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            
            <div
              ref={sliderRef}
              className="mt-4 overflow-x-hidden"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="flex w-max gap-4 pb-2">
                {loopingEvents.map((event, index) => (
                  <Card key={`${event.id}-${index}`} className="w-[290px] shrink-0">
                    <EventFeaturedImage
                      name={event.name}
                      alt={event.featured_image_alt}
                      smUrl={event.featured_image_sm_url}
                      mdUrl={event.featured_image_md_url}
                      lgUrl={event.featured_image_lg_url}
                      className="h-36 w-full object-cover"
                      sizes="290px"
                    />
                    <CardHeader>
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription>
                        {event.location || "Sin ubicación"} · {eventStatusLabel(event.status)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2">{event.description || "Sin descripción"}</p>
                    </CardContent>
                    <CardFooter>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/events/${event.id}`}>Ver detalle</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Button asChild className="w-fit mt-4">
            <Link to="/events">Ir a Eventos</Link>
          </Button>
      </div>

    </div>
  );
}
