import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { EventFeaturedImage } from "@/components/EventFeaturedImage";
import { SectionSpinner } from "@/components/SectionSpinner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { confirmDialog, notifyError, notifySuccess } from "@/utils/notifications";
import { cancelRegistrationRequest, myRegistrationsRequest, registerToEventRequest } from "../api/registrations";
import {
  assignSpeakerToSessionRequest,
  createSpeakerRequest,
  listSessionSpeakersRequest,
  listSpeakersRequest,
  removeSpeakerFromSessionRequest
} from "../api/speakers";
import {
  createSessionRequest,
  deleteSessionRequest,
  listSessionsByEventRequest,
  updateSessionRequest
} from "../api/sessions";
import type { RegistrationItem } from "../types/registration";
import type { SessionItem } from "../types/session";
import type { SessionSpeakerItem, SpeakerItem } from "../types/speaker";
import { useAuthStore } from "../store/authStore";
import { useEventsStore } from "../store/eventsStore";
import { getErrorMessage } from "../utils/errors";
import { eventStatusLabel, sessionStatusLabel } from "../utils/labels";

export function EventDetailPage() {
  type SessionSpeakerDraft = {
    speakerId: string;
    roleInSession: string;
  };

  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { currentEvent, loading, error, fetchEventById, deleteEvent } = useEventsStore();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState<{
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    status: "scheduled" | "in_progress" | "finished" | "cancelled";
  }>({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    status: "scheduled"
  });
  const [sessionSpeakerDrafts, setSessionSpeakerDrafts] = useState<SessionSpeakerDraft[]>([]);
  const [showQuickSpeakerForm, setShowQuickSpeakerForm] = useState(false);
  const [quickSpeakerName, setQuickSpeakerName] = useState("");
  const [quickSpeakerEmail, setQuickSpeakerEmail] = useState("");
  const [quickSpeakerLoading, setQuickSpeakerLoading] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [speakerMessage, setSpeakerMessage] = useState<string | null>(null);
  const [speakerError, setSpeakerError] = useState<string | null>(null);
  const [sessionSpeakersMap, setSessionSpeakersMap] = useState<Record<string, SessionSpeakerItem[]>>({});
  const [assignmentDrafts, setAssignmentDrafts] = useState<Record<string, { speakerId: string; roleInSession: string }>>({});
  const [assigningSessionId, setAssigningSessionId] = useState<string | null>(null);
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const canManageEvents = Boolean(user?.roles?.includes("organizer") || isAdmin);
  const isOrganizer = Boolean(
    isAuthenticated &&
      canManageEvents &&
      user &&
      currentEvent &&
      (isAdmin || currentEvent.organizer_id === user.id)
  );

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  useEffect(() => {
    if (sessionsError) notifyError(sessionsError);
  }, [sessionsError]);

  useEffect(() => {
    if (speakerError) notifyError(speakerError);
  }, [speakerError]);

  useEffect(() => {
    if (regError) notifyError(regError);
  }, [regError]);

  useEffect(() => {
    if (sessionMessage) notifySuccess(sessionMessage);
  }, [sessionMessage]);

  useEffect(() => {
    if (speakerMessage) notifySuccess(speakerMessage);
  }, [speakerMessage]);

  useEffect(() => {
    if (regMessage) notifySuccess(regMessage);
  }, [regMessage]);

  const loadSessions = async (eventId: string) => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await listSessionsByEventRequest(eventId);
      setSessions(data);
    } catch (err: any) {
      setSessions([]);
      setSessionsError(getErrorMessage(err, "No fue posible cargar las sesiones."));
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEventById(id);
      loadSessions(id);
    }
  }, [id, fetchEventById]);

  useEffect(() => {
    if (!isAuthenticated) {
      setRegistrations([]);
      return;
    }

    myRegistrationsRequest()
      .then((data) => setRegistrations(data.items))
      .catch(() => setRegistrations([]));
  }, [isAuthenticated, id]);

  useEffect(() => {
    if (!isOrganizer) return;
    setSpeakerError(null);
    listSpeakersRequest()
      .then((data) => setSpeakers(data))
      .catch((err: any) => setSpeakerError(getErrorMessage(err, "No fue posible cargar ponentes.")));
  }, [isOrganizer]);

  useEffect(() => {
    if (!sessions.length) {
      setSessionSpeakersMap({});
      return;
    }
    Promise.all(
      sessions.map(async (sessionItem) => {
        const items = await listSessionSpeakersRequest(sessionItem.id);
        return { sessionId: sessionItem.id, items };
      })
    )
      .then((rows) => {
        const nextMap: Record<string, SessionSpeakerItem[]> = {};
        rows.forEach((row) => {
          nextMap[row.sessionId] = row.items;
        });
        setSessionSpeakersMap(nextMap);
      })
      .catch(() => {
        setSpeakerError("No fue posible cargar los ponentes por sesión.");
      });
  }, [sessions]);

  const isRegistered = useMemo(() => {
    if (!id) return false;
    return registrations.some((item) => item.event_id === id && item.status === "registered");
  }, [registrations, id]);

  const resetSessionForm = () => {
    setEditingSessionId(null);
    setSessionForm({
      title: "",
      description: "",
      start_time: "",
      end_time: "",
      status: "scheduled"
    });
    setSessionSpeakerDrafts([]);
    setShowQuickSpeakerForm(false);
    setQuickSpeakerName("");
    setQuickSpeakerEmail("");
  };

  const toLocalInputDateTime = (isoDateTime: string): string => {
    const d = parseApiDateTime(isoDateTime);
    const pad = (v: number) => String(v).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const parseApiDateTime = (value: string): Date => {
    const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
    return new Date(hasTimeZone ? value : `${value}Z`);
  };

  const formatEsDateTime = (value: string): string =>
    parseApiDateTime(value).toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

  const onSessionSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setSessionActionLoading(true);
    setSessionMessage(null);
    setSessionsError(null);

    try {
      const startDate = new Date(sessionForm.start_time);
      const endDate = new Date(sessionForm.end_time);
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      if (currentEvent) {
        const eventStart = parseApiDateTime(currentEvent.start_date);
        const eventEnd = parseApiDateTime(currentEvent.end_date);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
          setSessionsError("Fecha u hora inválida. Verifica el formato de la sesión.");
          setSessionActionLoading(false);
          return;
        }

        if (startDate.getTime() < eventStart.getTime() || endDate.getTime() > eventEnd.getTime()) {
          setSessionsError(
            `La sesión debe estar dentro del rango del evento: ${formatEsDateTime(
              currentEvent.start_date
            )} - ${formatEsDateTime(currentEvent.end_date)}`
          );
          setSessionActionLoading(false);
          return;
        }
      }

      const payload = {
        ...sessionForm,
        description: sessionForm.description || null,
        start_time: startIso,
        end_time: endIso
      };

      const savedSession = editingSessionId
        ? await updateSessionRequest(editingSessionId, payload)
        : await createSessionRequest(id, payload);

      const targetSessionId = editingSessionId || savedSession.id;
      const existingSpeakerIds = new Set(
        editingSessionId ? (sessionSpeakersMap[editingSessionId] || []).map((item) => item.speaker_id) : []
      );
      const uniqueDrafts = sessionSpeakerDrafts.filter(
        (draft, index, arr) =>
          draft.speakerId &&
          arr.findIndex((candidate) => candidate.speakerId === draft.speakerId) === index
      );

      for (const draft of uniqueDrafts) {
        if (existingSpeakerIds.has(draft.speakerId)) continue;
        await assignSpeakerToSessionRequest(targetSessionId, draft.speakerId, {
          role_in_session: draft.roleInSession || null
        });
      }

      setSessionMessage(
        editingSessionId
          ? "Sesión actualizada correctamente."
          : uniqueDrafts.length
            ? "Sesión creada y ponentes asignados correctamente."
            : "Sesión creada correctamente."
      );

      resetSessionForm();
      setSessionDialogOpen(false);
      await loadSessions(id);
      await reloadSessionSpeakers(targetSessionId);
    } catch (err: any) {
      setSessionsError(getErrorMessage(err, "No fue posible guardar la sesión."));
    } finally {
      setSessionActionLoading(false);
    }
  };

  const onEditSession = (session: SessionItem) => {
    setEditingSessionId(session.id);
    setSessionMessage(null);
    setSessionsError(null);
    setSessionForm({
      title: session.title,
      description: session.description || "",
      start_time: toLocalInputDateTime(session.start_time),
      end_time: toLocalInputDateTime(session.end_time),
      status: session.status
    });
    setSessionSpeakerDrafts(
      (sessionSpeakersMap[session.id] || []).map((item) => ({
        speakerId: item.speaker_id,
        roleInSession: item.role_in_session || ""
      }))
    );
    setSessionDialogOpen(true);
  };

  const addSessionSpeakerDraft = () => {
    setSessionSpeakerDrafts((prev) => [...prev, { speakerId: "", roleInSession: "" }]);
  };

  const removeSessionSpeakerDraft = (index: number) => {
    setSessionSpeakerDrafts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSessionSpeakerDraft = (index: number, patch: Partial<SessionSpeakerDraft>) => {
    setSessionSpeakerDrafts((prev) =>
      prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft))
    );
  };

  const onCreateQuickSpeaker = async () => {
    if (!quickSpeakerName.trim()) {
      setSessionsError("El nombre del ponente es obligatorio.");
      return;
    }
    setQuickSpeakerLoading(true);
    setSessionsError(null);
    try {
      const created = await createSpeakerRequest({
        full_name: quickSpeakerName.trim(),
        email: quickSpeakerEmail.trim() || null
      });
      setSpeakers((prev) => [created, ...prev]);
      setSessionSpeakerDrafts((prev) => [...prev, { speakerId: created.id, roleInSession: "" }]);
      setQuickSpeakerName("");
      setQuickSpeakerEmail("");
      setShowQuickSpeakerForm(false);
      setSessionMessage("Ponente externo creado y listo para asignar.");
    } catch (err: any) {
      setSessionsError(getErrorMessage(err, "No fue posible crear el ponente externo."));
    } finally {
      setQuickSpeakerLoading(false);
    }
  };

  const onDeleteSession = async (sessionId: string, sessionTitle: string) => {
    if (!id) return;
    const confirmed = await confirmDialog({
      title: "Eliminar sesión",
      text: `¿Seguro que quieres eliminar la sesión "${sessionTitle}"? Esta acción no se puede deshacer.`,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      icon: "warning"
    });
    if (!confirmed) return;

    setSessionActionLoading(true);
    setSessionMessage(null);
    setSessionsError(null);

    try {
      await deleteSessionRequest(sessionId);
      setSessionMessage("Sesión eliminada.");
      if (editingSessionId === sessionId) {
        resetSessionForm();
      }
      await loadSessions(id);
    } catch (err: any) {
      setSessionsError(getErrorMessage(err, "No fue posible eliminar la sesión."));
    } finally {
      setSessionActionLoading(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    const confirmed = await confirmDialog({
      title: "Eliminar evento",
      text: "Esta acción no se puede deshacer.",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      icon: "warning"
    });
    if (!confirmed) return;
    const ok = await deleteEvent(id);
    if (ok) navigate("/");
  };

  const onRegister = async () => {
    if (!id) return;
    setRegLoading(true);
    setRegError(null);
    setRegMessage(null);

    try {
      await registerToEventRequest(id);
      const data = await myRegistrationsRequest();
      setRegistrations(data.items);
      setRegMessage("Inscripción realizada correctamente.");
    } catch (err: any) {
      setRegError(getErrorMessage(err, "No fue posible registrar la inscripción."));
    } finally {
      setRegLoading(false);
    }
  };

  const onCancel = async () => {
    if (!id) return;
    setRegLoading(true);
    setRegError(null);
    setRegMessage(null);

    try {
      await cancelRegistrationRequest(id);
      const data = await myRegistrationsRequest();
      setRegistrations(data.items);
      setRegMessage("Inscripción cancelada.");
    } catch (err: any) {
      setRegError(getErrorMessage(err, "No fue posible cancelar la inscripción."));
    } finally {
      setRegLoading(false);
    }
  };


  const getDraft = (sessionId: string) => {
    const current = assignmentDrafts[sessionId];
    if (current) return current;
    return { speakerId: speakers[0]?.id || "", roleInSession: "" };
  };

  const updateDraft = (sessionId: string, patch: Partial<{ speakerId: string; roleInSession: string }>) => {
    setAssignmentDrafts((prev) => ({
      ...prev,
      [sessionId]: {
        ...getDraft(sessionId),
        ...patch
      }
    }));
  };

  const reloadSessionSpeakers = async (sessionId: string) => {
    const items = await listSessionSpeakersRequest(sessionId);
    setSessionSpeakersMap((prev) => ({ ...prev, [sessionId]: items }));
  };

  const onAssignSpeaker = async (sessionId: string) => {
    const draft = getDraft(sessionId);
    if (!draft.speakerId) return;

    setAssigningSessionId(sessionId);
    setSpeakerMessage(null);
    setSpeakerError(null);
    try {
      await assignSpeakerToSessionRequest(sessionId, draft.speakerId, {
        role_in_session: draft.roleInSession || null
      });
      await reloadSessionSpeakers(sessionId);
      setSpeakerMessage("Ponente asignado correctamente.");
      updateDraft(sessionId, { roleInSession: "" });
    } catch (err: any) {
      setSpeakerError(getErrorMessage(err, "No fue posible asignar el ponente."));
    } finally {
      setAssigningSessionId(null);
    }
  };

  const onRemoveSpeaker = async (sessionId: string, speakerId: string) => {
    setAssigningSessionId(sessionId);
    setSpeakerMessage(null);
    setSpeakerError(null);
    try {
      await removeSpeakerFromSessionRequest(sessionId, speakerId);
      await reloadSessionSpeakers(sessionId);
      setSpeakerMessage("Ponente removido de la sesión.");
    } catch (err: any) {
      setSpeakerError(getErrorMessage(err, "No fue posible remover el ponente."));
    } finally {
      setAssigningSessionId(null);
    }
  };

  const eventStatusBadgeClass = (status: string) => {
    if (status === "published") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "draft") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "cancelled") return "bg-rose-100 text-rose-700 border-rose-200";
    if (status === "finished") return "bg-slate-200 text-slate-700 border-slate-300";
    return "bg-muted text-muted-foreground border-border";
  };

  const sessionStatusBadgeClass = (status: string) => {
    if (status === "scheduled") return "bg-sky-100 text-sky-700 border-sky-200";
    if (status === "in_progress") return "bg-amber-100 text-amber-700 border-amber-200";
    if (status === "finished") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (status === "cancelled") return "bg-rose-100 text-rose-700 border-rose-200";
    return "bg-muted text-muted-foreground border-border";
  };

  const renderSessionViewDialog = (session: SessionItem) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={`Ver detalles de la sesión ${session.title}`}
        >
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session.title}</DialogTitle>
          <DialogDescription>Detalle de la sesión</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Horario</p>
            <p className="mt-1">
              {formatEsDateTime(session.start_time)} - {formatEsDateTime(session.end_time)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${sessionStatusBadgeClass(session.status)}`}>
              {sessionStatusLabel(session.status)}
            </span>
          </div>

          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</p>
            <p className="mt-1">{session.description || "Sin descripción"}</p>
          </div>

          <div className="grid gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ponentes asignados</p>
            {!sessionSpeakersMap[session.id]?.length && (
              <p className="muted">No hay ponentes asignados en esta sesión.</p>
            )}
            {!!sessionSpeakersMap[session.id]?.length && (
              <div className="flex flex-wrap gap-2">
                {sessionSpeakersMap[session.id].map((item) => (
                  <span
                    key={`speaker-badge-${item.id}`}
                    className="inline-flex rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {item.speaker.full_name}
                    {item.role_in_session ? ` · ${item.role_in_session}` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container">
      {loading && <SectionSpinner label="Cargando evento..." />}
      {error && <p className="error">{error}</p>}

      {currentEvent && (
        <Card className="mb-4">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className=" text-2xl font-semibold">{currentEvent.name}</CardTitle>
            <div className="actions sm:justify-end">
              {isAuthenticated && !isRegistered && (
                <Button onClick={onRegister} disabled={regLoading}>Inscribirme</Button>
              )}
              {isAuthenticated && isRegistered && (
                <Button variant="outline" onClick={onCancel} disabled={regLoading}>
                  Cancelar inscripción
                </Button>
              )}
              {isOrganizer && (
                <Button className="rounded-[30px] text-white">
                  <Link to={`/events/${currentEvent.id}/edit`}>Editar evento</Link>
                </Button>
              )}
              {isOrganizer && <Button onClick={onDelete}>Eliminar evento</Button>}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <EventFeaturedImage
                  name={currentEvent.name}
                  alt={currentEvent.featured_image_alt}
                  smUrl={currentEvent.featured_image_sm_url}
                  mdUrl={currentEvent.featured_image_md_url}
                  lgUrl={currentEvent.featured_image_lg_url}
                  className="h-72 w-full rounded-xl object-cover lg:h-[22rem]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <h2 className="mt-4 text-base font-semibold">Detalle del evento</h2>
                <CardDescription>
                  Rango: {formatEsDateTime(currentEvent.start_date)} -{" "}
                  {formatEsDateTime(currentEvent.end_date)}
                </CardDescription>
                <p className="text-sm">
                  <strong>Organizador del evento:</strong> {currentEvent.organizer_name || "No disponible"}
                </p>
                <span className="inline-flex w-fit rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground">
                  {currentEvent.location || "Sin ubicación"}
                </span>
              </div>

              <div className="flex h-full flex-col gap-3 rounded-xl bg-gradient-to-br from-card/95 via-card/85 to-muted/45 p-4 shadow-[0_28px_80px_-40px_rgba(2,6,23,0.55)] backdrop-blur-sm">
                <div>
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${eventStatusBadgeClass(
                      currentEvent.status
                    )}`}
                  >
                    {eventStatusLabel(currentEvent.status)}
                  </span>
                </div>
                <p className="text-sm"><strong>Capacidad:</strong> {currentEvent.capacity}</p>
                <p className="text-sm"><strong>Sesiones:</strong> {sessions.length}</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Datos de las sesiones:</p>
                  {!sessions.length && (
                    <p className="muted">Este evento no tiene sesiones registradas todavía.</p>
                  )}
                  {!!sessions.length && (
                    <div className="space-y-2">
                      {sessions.slice(0, 4).map((session) => (
                        <div
                          key={`summary-${session.id}`}
                          className="rounded-lg bg-background/85 px-3 py-2 shadow-[0_12px_26px_-18px_rgba(15,23,42,0.55)]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{session.title}</p>
                              <p className="muted">
                                {sessionStatusLabel(session.status)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {renderSessionViewDialog(session)}
                              {isOrganizer && (
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="outline"
                                  aria-label={`Editar sesión ${session.title}`}
                                  onClick={() => onEditSession(session)}
                                  disabled={sessionActionLoading}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {sessions.length > 4 && (
                        <p className="muted">+ {sessions.length - 4} sesiones adicionales.</p>
                      )}
                    </div>
                  )}
                </div>
                {isOrganizer && (
                  <div className="mt-auto flex justify-end gap-2 pt-3">
                    <Dialog
                      open={sessionDialogOpen}
                      onOpenChange={(open) => {
                        setSessionDialogOpen(open);
                        if (!open) {
                          resetSessionForm();
                          setSessionsError(null);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          onClick={() => {
                            resetSessionForm();
                            setSessionDialogOpen(true);
                          }}
                        >
                          Crear sesión
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{editingSessionId ? "Editar sesión" : "Crear sesión"}</DialogTitle>
                          <DialogDescription>
                            La sesión debe quedar dentro del rango del evento.
                          </DialogDescription>
                        </DialogHeader>
                        <form className="mt-3 grid gap-3" onSubmit={onSessionSubmit}>
                          <div className="grid grid-2">
                            <Input
                              type="text"
                              placeholder="Título de la sesión"
                              value={sessionForm.title}
                              onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))}
                              required
                            />
                          </div>
                          <Textarea
                            placeholder="Descripción"
                            value={sessionForm.description}
                            onChange={(e) => setSessionForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={3}
                          />
                          <div className="grid grid-2">
                            <Input
                              type="datetime-local"
                              value={sessionForm.start_time}
                              onChange={(e) => setSessionForm((prev) => ({ ...prev, start_time: e.target.value }))}
                              required
                            />
                            <Input
                              type="datetime-local"
                              value={sessionForm.end_time}
                              onChange={(e) => setSessionForm((prev) => ({ ...prev, end_time: e.target.value }))}
                              required
                            />
                          </div>
                          <select
                            value={sessionForm.status}
                            onChange={(e) =>
                              setSessionForm((prev) => ({
                                ...prev,
                                status: e.target.value as "scheduled" | "in_progress" | "finished" | "cancelled"
                              }))
                            }
                          >
                            <option value="scheduled">{sessionStatusLabel("scheduled")}</option>
                            <option value="in_progress">{sessionStatusLabel("in_progress")}</option>
                            <option value="finished">{sessionStatusLabel("finished")}</option>
                            <option value="cancelled">{sessionStatusLabel("cancelled")}</option>
                          </select>
                          <div className="grid gap-2 rounded-lg border border-border p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">Ponentes de la sesión</p>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={addSessionSpeakerDraft}
                                  disabled={!speakers.length}
                                >
                                  Agregar ponente existente
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowQuickSpeakerForm((prev) => !prev)}
                                >
                                  Agregar ponente externo
                                </Button>
                              </div>
                            </div>
                            {showQuickSpeakerForm && (
                              <div className="grid gap-2 rounded-md border border-dashed border-border p-2 md:grid-cols-[1fr_1fr_auto]">
                                <Input
                                  type="text"
                                  placeholder="Ponente externo (nombre completo)"
                                  value={quickSpeakerName}
                                  onChange={(e) => setQuickSpeakerName(e.target.value)}
                                />
                                <Input
                                  type="email"
                                  placeholder="Correo externo (opcional)"
                                  value={quickSpeakerEmail}
                                  onChange={(e) => setQuickSpeakerEmail(e.target.value)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={onCreateQuickSpeaker}
                                  disabled={quickSpeakerLoading}
                                >
                                  {quickSpeakerLoading ? "Creando..." : "Crear externo"}
                                </Button>
                              </div>
                            )}
                            {!speakers.length && (
                              <p className="muted">No hay ponentes creados. Crea uno primero.</p>
                            )}
                            {!!sessionSpeakerDrafts.length && (
                              <div className="grid gap-2">
                                {sessionSpeakerDrafts.map((draft, index) => (
                                  <div key={`session-speaker-draft-${index}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                    <select
                                      value={draft.speakerId}
                                      onChange={(e) => updateSessionSpeakerDraft(index, { speakerId: e.target.value })}
                                      disabled={!speakers.length}
                                    >
                                      <option value="">Selecciona ponente</option>
                                      {speakers.map((speaker) => (
                                        <option key={`session-draft-speaker-${speaker.id}`} value={speaker.id}>
                                          {speaker.full_name}
                                        </option>
                                      ))}
                                    </select>
                                    <Input
                                      type="text"
                                      placeholder="Rol en sesión (opcional)"
                                      value={draft.roleInSession}
                                      onChange={(e) => updateSessionSpeakerDraft(index, { roleInSession: e.target.value })}
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeSessionSpeakerDraft(index)}
                                    >
                                      Quitar
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {sessionsError && <p className="error">{sessionsError}</p>}
                          <DialogFooter>
                            <Button type="submit" disabled={sessionActionLoading}>
                              {editingSessionId ? "Actualizar sesión" : "Crear sesión"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-5">
              <h3 className="text-base font-semibold">Descripción</h3>
              <p>{currentEvent.description || "Sin descripción"}</p>
            </div>

            <div className="space-y-2 border-t border-border pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/events">
                    <ArrowLeft className="size-4" />
                    Volver a eventos
                  </Link>
                </Button>
              {!isAuthenticated && (
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <Link to="/login">Inicia sesión para poder inscribirte al evento.</Link>
                </Button>
              )}
              </div>
              {regMessage && <p className="success">{regMessage}</p>}
              {regError && <p className="error">{regError}</p>}
            </div>

            {sessionsLoading && <SectionSpinner label="Cargando sesiones..." />}
            {sessionsError && <p className="error">{sessionsError}</p>}
            {sessionMessage && <p className="success">{sessionMessage}</p>}
            {speakerMessage && <p className="success">{speakerMessage}</p>}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
