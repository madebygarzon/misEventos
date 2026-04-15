import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { cancelRegistrationRequest, myRegistrationsRequest, registerToEventRequest } from "../api/registrations";
import { listSessionsByEventRequest } from "../api/sessions";
import type { RegistrationItem } from "../types/registration";
import type { SessionItem } from "../types/session";
import { useAuthStore } from "../store/authStore";
import { useEventsStore } from "../store/eventsStore";

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { currentEvent, loading, error, fetchEventById, deleteEvent } = useEventsStore();

  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventById(id);
      listSessionsByEventRequest(id)
        .then(setSessions)
        .catch(() => setSessions([]));
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

  const isRegistered = useMemo(() => {
    if (!id) return false;
    return registrations.some((item) => item.event_id === id && item.status === "registered");
  }, [registrations, id]);

  const onDelete = async () => {
    if (!id) return;
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
      setRegError(err?.response?.data?.detail || "No fue posible registrar la inscripción.");
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
      setRegError(err?.response?.data?.detail || "No fue posible cancelar la inscripción.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="container">
      {loading && <p className="muted">Cargando evento...</p>}
      {error && <p className="error">{error}</p>}

      {currentEvent && (
        <>
          <div className="card">
            <h1>{currentEvent.name}</h1>
            <p className="muted">{currentEvent.status} · {currentEvent.location || "Sin ubicación"}</p>
            <p>{currentEvent.description || "Sin descripción"}</p>
            <p className="muted">Capacidad: {currentEvent.capacity}</p>

            <div className="actions">
              {isAuthenticated && !isRegistered && (
                <button onClick={onRegister} disabled={regLoading}>Inscribirme</button>
              )}
              {isAuthenticated && isRegistered && (
                <button className="secondary" onClick={onCancel} disabled={regLoading}>Cancelar inscripción</button>
              )}
              <button onClick={onDelete}>Eliminar evento</button>
            </div>

            {!isAuthenticated && (
              <p className="muted">Inicia sesión para poder inscribirte al evento.</p>
            )}
            {regMessage && <p className="success">{regMessage}</p>}
            {regError && <p className="error">{regError}</p>}
          </div>

          <div className="card">
            <h2>Sesiones</h2>
            {!sessions.length && <p className="muted">Este evento no tiene sesiones registradas todavía.</p>}
            {sessions.map((session) => (
              <div key={session.id} className="card" style={{ margin: "8px 0" }}>
                <h3>{session.title}</h3>
                <p className="muted">{new Date(session.start_time).toLocaleString()} - {new Date(session.end_time).toLocaleString()}</p>
                <p>{session.description || "Sin descripción"}</p>
                <p className="muted">Estado: {session.status} · Capacidad: {session.capacity}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
