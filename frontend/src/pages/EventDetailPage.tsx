import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { EventFeaturedImage } from "@/components/EventFeaturedImage";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { currentEvent, loading, error, fetchEventById, deleteEvent } = useEventsStore();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    capacity: 20,
    status: "scheduled"
  });
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);
  const [speakers, setSpeakers] = useState<SpeakerItem[]>([]);
  const [speakerForm, setSpeakerForm] = useState({ full_name: "", email: "" });
  const [speakersLoading, setSpeakersLoading] = useState(false);
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
    setSpeakersLoading(true);
    setSpeakerError(null);
    listSpeakersRequest()
      .then((data) => setSpeakers(data))
      .catch((err: any) => setSpeakerError(getErrorMessage(err, "No fue posible cargar ponentes.")))
      .finally(() => setSpeakersLoading(false));
  }, [isOrganizer]);

  useEffect(() => {
    if (!isOrganizer || !sessions.length) return;
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
  }, [isOrganizer, sessions]);

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
      capacity: 20,
      status: "scheduled"
    });
  };

  const toLocalInputDateTime = (isoDateTime: string): string => {
    const d = new Date(isoDateTime);
    const pad = (v: number) => String(v).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };

  const eventStartLocal = currentEvent ? toLocalInputDateTime(currentEvent.start_date) : "";
  const eventEndLocal = currentEvent ? toLocalInputDateTime(currentEvent.end_date) : "";

  const onSessionSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id) return;

    setSessionActionLoading(true);
    setSessionMessage(null);
    setSessionsError(null);

    try {
      const startIso = new Date(sessionForm.start_time).toISOString();
      const endIso = new Date(sessionForm.end_time).toISOString();

      if (currentEvent) {
        if (startIso < currentEvent.start_date || endIso > currentEvent.end_date) {
          setSessionsError(
            `La sesión debe estar dentro del rango del evento: ${new Date(
              currentEvent.start_date
            ).toLocaleString()} - ${new Date(currentEvent.end_date).toLocaleString()}`
          );
          setSessionActionLoading(false);
          return;
        }
      }

      const payload = {
        ...sessionForm,
        description: sessionForm.description || null,
        capacity: Number(sessionForm.capacity),
        start_time: startIso,
        end_time: endIso
      };

      if (editingSessionId) {
        await updateSessionRequest(editingSessionId, payload);
        setSessionMessage("Sesión actualizada correctamente.");
      } else {
        await createSessionRequest(id, payload);
        setSessionMessage("Sesión creada correctamente.");
      }

      resetSessionForm();
      await loadSessions(id);
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
      capacity: session.capacity,
      status: session.status
    });
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

  const onCreateSpeaker = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isOrganizer) return;

    setSpeakerMessage(null);
    setSpeakerError(null);
    setSpeakersLoading(true);
    try {
      const created = await createSpeakerRequest({
        full_name: speakerForm.full_name,
        email: speakerForm.email || null
      });
      setSpeakers((prev) => [created, ...prev]);
      setSpeakerForm({ full_name: "", email: "" });
      setSpeakerMessage("Ponente creado correctamente.");
    } catch (err: any) {
      setSpeakerError(getErrorMessage(err, "No fue posible crear el ponente."));
    } finally {
      setSpeakersLoading(false);
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

  return (
    <div className="container">
      {loading && <p className="muted">Cargando evento...</p>}
      {error && <p className="error">{error}</p>}

      {currentEvent && (
        <>
          <Card className="mb-4">
            <EventFeaturedImage
              name={currentEvent.name}
              alt={currentEvent.featured_image_alt}
              smUrl={currentEvent.featured_image_sm_url}
              mdUrl={currentEvent.featured_image_md_url}
              lgUrl={currentEvent.featured_image_lg_url}
              className="max-h-80 w-full object-cover"
              sizes="(max-width: 768px) 100vw, 980px"
            />
            <CardHeader>
              <CardTitle>{currentEvent.name}</CardTitle>
              <CardDescription>
                {eventStatusLabel(currentEvent.status)} · {currentEvent.location || "Sin ubicación"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>{currentEvent.description || "Sin descripción"}</p>
              <p className="muted">Capacidad: {currentEvent.capacity}</p>
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              {isAuthenticated && !isRegistered && (
                <Button onClick={onRegister} disabled={regLoading}>Inscribirme</Button>
              )}
              {isAuthenticated && isRegistered && (
                <Button variant="outline" onClick={onCancel} disabled={regLoading}>
                  Cancelar inscripción
                </Button>
              )}
              {isOrganizer && (
                <Button asChild variant="outline">
                  <Link to={`/events/${currentEvent.id}/edit`}>Editar evento</Link>
                </Button>
              )}
              {isOrganizer && <Button onClick={onDelete}>Eliminar evento</Button>}
            </CardFooter>

            {!isAuthenticated && (
              <p className="muted">Inicia sesión para poder inscribirte al evento.</p>
            )}
            {regMessage && <p className="success">{regMessage}</p>}
            {regError && <p className="error">{regError}</p>}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sesiones</CardTitle>
              {currentEvent && (
                <CardDescription>
                Rango del evento: {new Date(currentEvent.start_date).toLocaleString()} -{" "}
                {new Date(currentEvent.end_date).toLocaleString()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
            {isOrganizer && (
              <>
                <form className="grid gap-3" onSubmit={onSessionSubmit}>
                  <div className="grid grid-2">
                    <Input
                      type="text"
                      placeholder="Título de la sesión"
                      value={sessionForm.title}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                    <Input
                      type="number"
                      min={1}
                      placeholder="Capacidad"
                      value={sessionForm.capacity}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
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
                      min={eventStartLocal}
                      max={eventEndLocal}
                      onChange={(e) => setSessionForm((prev) => ({ ...prev, start_time: e.target.value }))}
                      required
                    />
                    <Input
                      type="datetime-local"
                      value={sessionForm.end_time}
                      min={eventStartLocal}
                      max={eventEndLocal}
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
                  <div className="actions">
                    <Button type="submit" disabled={sessionActionLoading}>
                      {editingSessionId ? "Actualizar sesión" : "Crear sesión"}
                    </Button>
                    {editingSessionId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetSessionForm}
                        disabled={sessionActionLoading}
                      >
                        Cancelar edición
                      </Button>
                    )}
                  </div>
                </form>

                <Card className="mt-2">
                  <CardHeader>
                    <CardTitle>Ponentes</CardTitle>
                    <CardDescription>
                    Un ponente puede ser cualquier persona: tú mismo, otro usuario o alguien sin cuenta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                  <form className="grid grid-2" onSubmit={onCreateSpeaker}>
                    <Input
                      type="text"
                      placeholder="Nombre completo del ponente"
                      value={speakerForm.full_name}
                      onChange={(e) => setSpeakerForm((prev) => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Correo (opcional)"
                      value={speakerForm.email}
                      onChange={(e) => setSpeakerForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                    <Button type="submit" disabled={speakersLoading} className="md:w-auto">Crear ponente</Button>
                  </form>
                  </CardContent>
                  {speakerMessage && <p className="success">{speakerMessage}</p>}
                  {speakerError && <p className="error">{speakerError}</p>}
                </Card>
              </>
            )}
            {sessionsLoading && <p className="muted">Cargando sesiones...</p>}
            {sessionsError && <p className="error">{sessionsError}</p>}
            {sessionMessage && <p className="success">{sessionMessage}</p>}
            {!sessions.length && <p className="muted">Este evento no tiene sesiones registradas todavía.</p>}
            {sessions.map((session) => (
              <Card key={session.id} className="mb-2">
                <CardHeader>
                  <CardTitle>{session.title}</CardTitle>
                  <CardDescription>
                    {new Date(session.start_time).toLocaleString()} - {new Date(session.end_time).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p>{session.description || "Sin descripción"}</p>
                  <p className="muted">Estado: {sessionStatusLabel(session.status)} · Capacidad: {session.capacity}</p>
                <div className="mt-2">
                  <p><strong>Ponentes asignados:</strong></p>
                  {!sessionSpeakersMap[session.id]?.length && (
                    <p className="muted">No hay ponentes asignados en esta sesión.</p>
                  )}
                  {!!sessionSpeakersMap[session.id]?.length && (
                    <div className="grid">
                      {sessionSpeakersMap[session.id].map((item) => (
                        <div key={item.id} className="actions" style={{ justifyContent: "space-between" }}>
                          <span>
                            {item.speaker.full_name}
                            {item.role_in_session ? ` · ${item.role_in_session}` : ""}
                          </span>
                          {isOrganizer && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => onRemoveSpeaker(session.id, item.speaker_id)}
                              disabled={assigningSessionId === session.id}
                            >
                              Remover
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {isOrganizer && (
                  <div className="grid" style={{ marginTop: "8px" }}>
                    <div className="grid grid-2">
                      <select
                        value={getDraft(session.id).speakerId}
                        onChange={(e) => updateDraft(session.id, { speakerId: e.target.value })}
                        disabled={!speakers.length || assigningSessionId === session.id}
                      >
                        {!speakers.length && <option value="">No hay ponentes creados</option>}
                        {speakers.map((speaker) => (
                          <option key={speaker.id} value={speaker.id}>{speaker.full_name}</option>
                        ))}
                      </select>
                      <Input
                        type="text"
                        placeholder="Rol en sesión (opcional)"
                        value={getDraft(session.id).roleInSession}
                        onChange={(e) => updateDraft(session.id, { roleInSession: e.target.value })}
                        disabled={assigningSessionId === session.id}
                      />
                    </div>
                    <div className="actions">
                      <Button
                        type="button"
                        onClick={() => onAssignSpeaker(session.id)}
                        disabled={!getDraft(session.id).speakerId || assigningSessionId === session.id}
                      >
                        Asignar ponente
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onEditSession(session)}
                        disabled={sessionActionLoading}
                      >
                        Editar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => onDeleteSession(session.id, session.title)}
                        disabled={sessionActionLoading}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
                </CardContent>
              </Card>
            ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
