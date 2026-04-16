import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "../store/authStore";
import { useEventsStore } from "../store/eventsStore";
import { eventStatusLabel } from "../utils/labels";

const initialState = {
  name: "",
  description: "",
  location: "",
  start_date: "",
  end_date: "",
  capacity: 100,
  status: "draft"
};

export function EventFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentEvent, loading, error, fetchEventById, createEvent, updateEvent } = useEventsStore();
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState("");
  const canManageEvents = Boolean(user?.roles?.includes("organizer") || user?.roles?.includes("admin"));

  useEffect(() => {
    if (isEdit && id) fetchEventById(id);
  }, [isEdit, id, fetchEventById]);

  useEffect(() => {
    if (isEdit && currentEvent) {
      setForm({
        name: currentEvent.name,
        description: currentEvent.description || "",
        location: currentEvent.location || "",
        start_date: currentEvent.start_date.slice(0, 16),
        end_date: currentEvent.end_date.slice(0, 16),
        capacity: currentEvent.capacity,
        status: currentEvent.status
      });
    }
  }, [isEdit, currentEvent]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess("");

    const payload = {
      ...form,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      capacity: Number(form.capacity)
    };

    if (isEdit && id) {
      const updated = await updateEvent(id, payload);
      if (updated) {
        setSuccess("Evento actualizado correctamente");
        navigate(`/events/${id}`);
      }
      return;
    }

    const created = await createEvent(payload);
    if (created) {
      setSuccess("Evento creado correctamente");
      navigate(`/events/${created.id}`);
    }
  };

  return (
    <div className="container">
      <h1>{isEdit ? "Editar evento" : "Crear evento"}</h1>
      {!canManageEvents && (
        <Card>
          <CardContent className="pt-4">
          <p className="error">Tu rol actual no permite crear o editar eventos.</p>
          </CardContent>
        </Card>
      )}
      {canManageEvents && (
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Actualizar información del evento" : "Datos del nuevo evento"}</CardTitle>
            <CardDescription>
              Completa los campos principales para publicar o editar el evento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" onSubmit={onSubmit}>
              <Input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <Textarea
                placeholder="Descripción"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
              <Input
                placeholder="Ubicación"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              />

              <div className="grid grid-2">
                <label className="grid gap-1 text-sm">
                  <span className="muted">Inicio</span>
                  <Input
                    type="datetime-local"
                    value={form.start_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="muted">Fin</span>
                  <Input
                    type="datetime-local"
                    value={form.end_date}
                    onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                    required
                  />
                </label>
              </div>

              <div className="grid grid-2">
                <label className="grid gap-1 text-sm">
                  <span className="muted">Capacidad</span>
                  <Input
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="muted">Estado</span>
                  <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
                    <option value="draft">{eventStatusLabel("draft")}</option>
                    <option value="published">{eventStatusLabel("published")}</option>
                    <option value="cancelled">{eventStatusLabel("cancelled")}</option>
                    <option value="finished">{eventStatusLabel("finished")}</option>
                  </select>
                </label>
              </div>

              <div className="actions">
                <Button disabled={loading} type="submit">
                  {isEdit ? "Guardar cambios" : "Crear evento"}
                </Button>
              </div>
              {success && <p className="success">{success}</p>}
              {error && <p className="error">{error}</p>}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
