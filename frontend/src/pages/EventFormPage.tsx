import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useEventsStore } from "../store/eventsStore";

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
  const { currentEvent, loading, error, fetchEventById, createEvent, updateEvent } = useEventsStore();
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState("");

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
      <form className="card grid" onSubmit={onSubmit}>
        <input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
        <textarea
          placeholder="Descripción"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />
        <input
          placeholder="Ubicación"
          value={form.location}
          onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
        />
        <label>
          Inicio
          <input
            type="datetime-local"
            value={form.start_date}
            onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
            required
          />
        </label>
        <label>
          Fin
          <input
            type="datetime-local"
            value={form.end_date}
            onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
            required
          />
        </label>
        <input
          type="number"
          min={1}
          value={form.capacity}
          onChange={(e) => setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }))}
          required
        />
        <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="finished">Finished</option>
        </select>

        <button disabled={loading} type="submit">{isEdit ? "Guardar cambios" : "Crear evento"}</button>
        {success && <p className="success">{success}</p>}
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
}
