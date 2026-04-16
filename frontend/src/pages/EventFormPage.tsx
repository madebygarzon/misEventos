import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { uploadEventFeaturedImageRequest } from "@/api/uploads";
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
import { notifyError, notifyInfo, notifySuccess } from "@/utils/notifications";
import { useAuthStore } from "../store/authStore";
import { useEventsStore } from "../store/eventsStore";
import { eventStatusLabel } from "../utils/labels";

const initialState = {
  name: "",
  description: "",
  location: "",
  featured_image_sm_url: "",
  featured_image_md_url: "",
  featured_image_lg_url: "",
  featured_image_alt: "",
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
        featured_image_sm_url: currentEvent.featured_image_sm_url || "",
        featured_image_md_url: currentEvent.featured_image_md_url || "",
        featured_image_lg_url: currentEvent.featured_image_lg_url || "",
        featured_image_alt: currentEvent.featured_image_alt || "",
        start_date: currentEvent.start_date.slice(0, 16),
        end_date: currentEvent.end_date.slice(0, 16),
        capacity: currentEvent.capacity,
        status: currentEvent.status
      });
    }
  }, [isEdit, currentEvent]);

  useEffect(() => {
    if (success) notifySuccess(success);
  }, [success]);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  useEffect(() => {
    if (uploadError) notifyError(uploadError);
  }, [uploadError]);

  useEffect(() => {
    if (!canManageEvents) {
      notifyInfo("Tu rol actual no permite crear o editar eventos.");
    }
  }, [canManageEvents]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess("");

    const payload = {
      ...form,
      featured_image_sm_url: form.featured_image_sm_url || null,
      featured_image_md_url: form.featured_image_md_url || null,
      featured_image_lg_url: form.featured_image_lg_url || null,
      featured_image_alt: form.featured_image_alt || null,
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

  const onImageSelected = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploadingImage(true);
    notifyInfo("Procesando y optimizando imagen...");
    try {
      const uploaded = await uploadEventFeaturedImageRequest(file, form.featured_image_alt);
      setForm((prev) => ({
        ...prev,
        featured_image_sm_url: uploaded.featured_image_sm_url,
        featured_image_md_url: uploaded.featured_image_md_url,
        featured_image_lg_url: uploaded.featured_image_lg_url,
        featured_image_alt: uploaded.alt_text || prev.featured_image_alt
      }));
    } catch {
      setUploadError("No fue posible procesar la imagen. Usa JPG, PNG o WebP menores a 8MB.");
    } finally {
      setUploadingImage(false);
    }
  };

  const onRemoveImage = () => {
    setForm((prev) => ({
      ...prev,
      featured_image_sm_url: "",
      featured_image_md_url: "",
      featured_image_lg_url: "",
      featured_image_alt: ""
    }));
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
              <div className="grid gap-2">
                <label className="grid gap-1 text-sm">
                  <span className="muted">Texto alternativo imagen destacada</span>
                  <Input
                    placeholder="Describe la imagen para accesibilidad"
                    value={form.featured_image_alt}
                    onChange={(e) => setForm((prev) => ({ ...prev, featured_image_alt: e.target.value }))}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="muted">
                    Imagen destacada (se optimiza automáticamente a WebP sm/md/lg)
                  </span>
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => onImageSelected(e.target.files?.[0] || null)}
                    disabled={uploadingImage}
                  />
                </label>
                {uploadingImage && <p className="muted">Procesando y comprimiendo imagen...</p>}
                {uploadError && <p className="error">{uploadError}</p>}
                {(form.featured_image_md_url || form.featured_image_lg_url || form.featured_image_sm_url) && (
                  <div className="grid gap-2">
                    <img
                      src={form.featured_image_md_url || form.featured_image_lg_url || form.featured_image_sm_url}
                      alt={form.featured_image_alt || "Vista previa imagen destacada"}
                      className="max-h-60 w-full rounded-lg border border-border object-cover"
                    />
                    <Button type="button" variant="outline" onClick={onRemoveImage} className="w-fit">
                      Quitar imagen
                    </Button>
                  </div>
                )}
              </div>

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
