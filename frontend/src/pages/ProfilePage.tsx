import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionSpinner } from "@/components/SectionSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { getEventRequest, listEventsRequest } from "../api/events";
import { myRegistrationsRequest } from "../api/registrations";
import { listSessionsByEventRequest } from "../api/sessions";
import { listSessionSpeakersRequest } from "../api/speakers";
import { listUsersRequest, updateMyProfileRequest, updateUserRoleRequest } from "../api/users";
import { useAuthStore } from "../store/authStore";
import type { EventItem } from "../types/event";
import type { RegistrationItem } from "../types/registration";
import type { ManagedRole, ManagedUser } from "../types/user";
import { getErrorMessage } from "../utils/errors";
import { eventStatusLabel, registrationStatusLabel, roleLabel } from "../utils/labels";

type ProfileSection = "personal" | "organized" | "scheduled" | "users";

export function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [organizedEvents, setOrganizedEvents] = useState<EventItem[]>([]);
  const [eventDetails, setEventDetails] = useState<
    Record<string, { name: string; organizerName: string; speakers: string[] }>
  >({});
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [organizedLoading, setOrganizedLoading] = useState(false);
  const [organizedError, setOrganizedError] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ProfileSection>("personal");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const isOrganizerRole = Boolean(user?.roles?.includes("organizer"));
  const canViewOrganizerCards = isOrganizerRole || isAdmin;
  const visibleUsers = users.filter((item) => item.id !== user?.id);

  useEffect(() => {
    if (organizedError) notifyError(organizedError);
  }, [organizedError]);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  useEffect(() => {
    if (usersError) notifyError(usersError);
  }, [usersError]);

  useEffect(() => {
    if (roleSuccess) notifySuccess(roleSuccess);
  }, [roleSuccess]);

  useEffect(() => {
    const run = async () => {
      try {
        const data = await myRegistrationsRequest();
        setItems(data.items);
      } catch (err: any) {
        setError(getErrorMessage(err, "No fue posible cargar mis registros"));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    if (!canViewOrganizerCards || !user?.id) {
      setOrganizedEvents([]);
      return;
    }

    const run = async () => {
      setOrganizedLoading(true);
      setOrganizedError(null);
      try {
        const data = await listEventsRequest({ page: 1, limit: 100 });
        setOrganizedEvents(data.items.filter((event) => event.organizer_id === user.id));
      } catch (err: any) {
        setOrganizedError(getErrorMessage(err, "No fue posible cargar mis eventos organizados"));
      } finally {
        setOrganizedLoading(false);
      }
    };

    void run();
  }, [canViewOrganizerCards, user?.id]);

  useEffect(() => {
    const run = async () => {
      if (!items.length) {
        setEventDetails({});
        setDetailsLoading(false);
        return;
      }

      setDetailsLoading(true);
      try {
        const uniqueIds = Array.from(new Set(items.map((item) => item.event_id)));
        const pairs = await Promise.all(
          uniqueIds.map(async (eventId) => {
            try {
              const event = await getEventRequest(eventId);
              let speakers: string[] = [];

              try {
                const sessions = await listSessionsByEventRequest(eventId);
                const sessionSpeakerRows = await Promise.allSettled(
                  sessions.map((sessionItem) => listSessionSpeakersRequest(sessionItem.id))
                );

                speakers = Array.from(
                  new Set(
                    sessionSpeakerRows
                      .filter(
                        (
                          result
                        ): result is PromiseFulfilledResult<
                          Awaited<ReturnType<typeof listSessionSpeakersRequest>>
                        > => result.status === "fulfilled"
                      )
                      .flatMap((result) => result.value)
                      .map((row) => row.speaker.full_name)
                      .filter(Boolean)
                  )
                );
              } catch {
                speakers = [];
              }

              return [
                eventId,
                {
                  name: event.name,
                  organizerName: event.organizer_name || "No disponible",
                  speakers
                }
              ] as const;
            } catch {
              return [
                eventId,
                {
                  name: "Evento no disponible",
                  organizerName: "No disponible",
                  speakers: []
                }
              ] as const;
            }
          })
        );

        setEventDetails(Object.fromEntries(pairs));
      } finally {
        setDetailsLoading(false);
      }
    };

    void run();
  }, [items]);

  useEffect(() => {
    if (!isAdmin) return;
    const run = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const data = await listUsersRequest();
        setUsers(data.items);
      } catch (err: any) {
        setUsersError(getErrorMessage(err, "No fue posible cargar usuarios"));
      } finally {
        setUsersLoading(false);
      }
    };

    void run();
  }, [isAdmin]);

  const getUserRole = (item: ManagedUser): ManagedRole => {
    if (item.roles.includes("admin")) return "admin";
    if (item.roles.includes("organizer")) return "organizer";
    return "attendee";
  };

  const onRoleChange = async (userId: string, role: ManagedRole) => {
    setRoleSuccess(null);
    setUsersError(null);
    setUpdatingUserId(userId);
    try {
      const updated = await updateUserRoleRequest(userId, role);
      setUsers((prev) => prev.map((item) => (item.id === userId ? updated : item)));
      setRoleSuccess(`Rol actualizado a ${roleLabel(role)}.`);
    } catch (err: any) {
      setUsersError(getErrorMessage(err, "No fue posible actualizar el rol"));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const formatUserRoles = (roles: string[]): string => {
    if (!roles.length) return "Sin roles";
    return roles
      .map((role) => roleLabel(role))
      .join(", ");
  };

  const sectionItems: Array<{ key: ProfileSection; label: string; visible: boolean }> = [
    { key: "personal", label: "Información personal", visible: true },
    { key: "organized", label: "Eventos organizados por mí", visible: canViewOrganizerCards },
    { key: "scheduled", label: "Agenda de eventos", visible: true },
    { key: "users", label: "Gestión de usuarios", visible: isAdmin }
  ];

  const visibleSections = sectionItems.filter((item) => item.visible);

  useEffect(() => {
    if (!visibleSections.some((item) => item.key === activeSection)) {
      setActiveSection(visibleSections[0]?.key || "personal");
    }
  }, [activeSection, visibleSections]);

  const resetProfileForm = () => {
    setProfileForm({
      fullName: user?.full_name || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: ""
    });
    setProfileError(null);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const onProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileError(null);

    const fullName = profileForm.fullName.trim();
    const wantsPasswordChange = Boolean(profileForm.currentPassword || profileForm.newPassword || profileForm.confirmNewPassword);

    if (!fullName) {
      setProfileError("El nombre es obligatorio.");
      return;
    }

    if (wantsPasswordChange) {
      if (!profileForm.currentPassword || !profileForm.newPassword || !profileForm.confirmNewPassword) {
        setProfileError("Para cambiar contraseña debes completar contraseña actual y nueva contraseña dos veces.");
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmNewPassword) {
        setProfileError("La nueva contraseña y su confirmación no coinciden.");
        return;
      }
    }

    setProfileSaving(true);
    try {
      const payload: {
        full_name?: string;
        current_password?: string;
        new_password?: string;
      } = {};

      if (fullName !== (user?.full_name || "")) {
        payload.full_name = fullName;
      }
      if (wantsPasswordChange) {
        payload.current_password = profileForm.currentPassword;
        payload.new_password = profileForm.newPassword;
      }

      if (!Object.keys(payload).length) {
        setProfileDialogOpen(false);
        return;
      }

      await updateMyProfileRequest(payload);
      await fetchMe();
      setProfileDialogOpen(false);
      notifySuccess("Datos personales actualizados.");
    } catch (err: any) {
      const message = getErrorMessage(err, "No fue posible actualizar tus datos.");
      setProfileError(message);
      notifyError(message);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="container">
      <h1>Mi perfil</h1>
      <p className="muted">Panel personal con secciones por rol.</p>

      <div className="mt-20 grid gap-4 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Secciones</CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-6 mt-4">
            {visibleSections.map((section) => {
              const isActive = activeSection === section.key;
              return (
                <Button
                  key={section.key}
                  type="button"
                  variant={isActive ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setActiveSection(section.key)}
                >
                  {section.label}
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {activeSection === "personal" && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Información personal</CardTitle>
                  <Dialog
                    open={profileDialogOpen}
                    onOpenChange={(open) => {
                      setProfileDialogOpen(open);
                      if (open) {
                        resetProfileForm();
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button type="button" size="icon-sm" variant="outline" aria-label="Editar información personal">
                        <Pencil className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar datos personales</DialogTitle>
                        <DialogDescription>
                          Puedes actualizar tu nombre. Para cambiar contraseña debes ingresar la actual y la nueva dos veces.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="grid gap-3" onSubmit={onProfileSubmit}>
                        <Input
                          type="text"
                          placeholder="Nombre completo"
                          value={profileForm.fullName}
                          onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                          required
                        />

                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Contraseña actual"
                            value={profileForm.currentPassword}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowCurrentPassword((prev) => !prev)}
                            aria-label={showCurrentPassword ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                          >
                            {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>

                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Nueva contraseña"
                            value={profileForm.newPassword}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            aria-label={showNewPassword ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"}
                          >
                            {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>

                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirma la nueva contraseña"
                            value={profileForm.confirmNewPassword}
                            onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                          />
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="absolute right-1 top-1/2 -translate-y-1/2"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            aria-label={showConfirmPassword ? "Ocultar confirmación de contraseña" : "Mostrar confirmación de contraseña"}
                          >
                            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        </div>

                        {profileError && <p className="error">{profileError}</p>}

                        <DialogFooter>
                          <Button type="submit" disabled={profileSaving}>
                            Guardar cambios
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                <p><strong>Nombre:</strong> {user?.full_name || "-"}</p>
                <p><strong>Correo electrónico:</strong> {user?.email || "-"}</p>
                <p><strong>Rol:</strong> {user?.roles ? formatUserRoles(user.roles) : "Sin roles"}</p>
              </CardContent>
            </Card>
          )}

          {activeSection === "organized" && canViewOrganizerCards && (
            <Card>
              <CardHeader>
                <CardTitle>Eventos organizados por mí</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {organizedLoading && <SectionSpinner label="Cargando eventos organizados..." />}
                {organizedError && <p className="error">{organizedError}</p>}
                {!organizedLoading && !organizedEvents.length && (
                  <p className="muted">Aún no tengo eventos organizados.</p>
                )}
                {organizedEvents.map((event) => (
                  <Card key={event.id} size="sm">
                    <CardContent className="space-y-1">
                      <p><strong>Evento:</strong> {event.name}</p>
                      <p><strong>Estado:</strong> {eventStatusLabel(event.status)}</p>
                      <p className="muted">
                        {new Date(event.start_date).toLocaleString()} - {new Date(event.end_date).toLocaleString()}
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-2 w-fit">
                        <Link to={`/events/${event.id}`}>Ver detalle del evento</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === "scheduled" && (
            <Card>
              <CardHeader>
                <CardTitle>Eventos en los que estoy agendado</CardTitle>
                <CardDescription>Historial de tus registros y detalle de organizador/ponentes.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading && <SectionSpinner label="Cargando..." />}
                {!loading && detailsLoading && <SectionSpinner label="Cargando detalle de eventos..." />}
                {error && <p className="error">{error}</p>}
                {!loading && !items.length && <p className="muted">No tengo inscripciones todavía.</p>}
                {items.map((item) => (
                  <Card key={item.id} size="sm">
                    <CardContent className="space-y-1">
                      <p><strong>Evento:</strong> {eventDetails[item.event_id]?.name || "Evento no disponible"}</p>
                      <p><strong>Organizador:</strong> {eventDetails[item.event_id]?.organizerName || "No disponible"}</p>
                      <p>
                        <strong>Ponentes:</strong>{" "}
                        {eventDetails[item.event_id]?.speakers?.length
                          ? eventDetails[item.event_id].speakers.join(", ")
                          : "Sin ponentes asignados"}
                      </p>
                      <p><strong>Estado:</strong> {registrationStatusLabel(item.status)}</p>
                      <p className="muted">{new Date(item.registered_at).toLocaleString()}</p>
                      {item.notes && <p><strong>Nota:</strong> {item.notes}</p>}
                      <Button asChild variant="outline" size="sm" className="mt-2 w-fit">
                        <Link to={`/events/${item.event_id}`}>Ver detalle del evento</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          {activeSection === "users" && isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Gestión de usuarios</CardTitle>
                <CardDescription>
                  Como administrador puedo cambiar el rol a Asistente, Organizador o Administrador.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {usersLoading && <SectionSpinner label="Cargando usuarios..." />}
                {usersError && <p className="error">{usersError}</p>}
                {roleSuccess && <p className="success">{roleSuccess}</p>}
                {!usersLoading && !visibleUsers.length && <p className="muted">No hay usuarios para mostrar.</p>}
                {!!visibleUsers.length && (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-muted/70">
                          <th className="px-3 py-2 text-left">Nombre</th>
                          <th className="px-3 py-2 text-left">Correo electrónico</th>
                          <th className="px-3 py-2 text-left">Rol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleUsers.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="px-3 py-2">{item.full_name}</td>
                            <td className="px-3 py-2">{item.email}</td>
                            <td className="px-3 py-2">
                              <select
                                value={getUserRole(item)}
                                onChange={(e) => onRoleChange(item.id, e.target.value as ManagedRole)}
                                disabled={updatingUserId === item.id}
                              >
                                <option value="attendee">{roleLabel("attendee")}</option>
                                <option value="organizer">{roleLabel("organizer")}</option>
                                <option value="admin">{roleLabel("admin")}</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
