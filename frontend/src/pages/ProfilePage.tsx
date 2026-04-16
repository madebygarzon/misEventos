import { useEffect, useState } from "react";

import { myRegistrationsRequest } from "../api/registrations";
import { listUsersRequest, updateUserRoleRequest } from "../api/users";
import { useAuthStore } from "../store/authStore";
import type { RegistrationItem } from "../types/registration";
import type { ManagedRole, ManagedUser } from "../types/user";
import { getErrorMessage } from "../utils/errors";
import { registrationStatusLabel, roleLabel } from "../utils/labels";

export function ProfilePage() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<RegistrationItem[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [roleSuccess, setRoleSuccess] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const isAdmin = Boolean(user?.roles?.includes("admin"));
  const visibleUsers = users.filter((item) => item.id !== user?.id);

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

    run();
  }, []);

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

    run();
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

  return (
    <div className="container">
      <h1>Mi perfil</h1>
      <p className="muted">Mis inscripciones actuales.</p>
      <div className="card">
        <p><strong>Nombre:</strong> {user?.full_name || "-"}</p>
        <p><strong>Correo electrónico:</strong> {user?.email || "-"}</p>
        <p><strong>Roles:</strong> {user?.roles ? formatUserRoles(user.roles) : "Sin roles"}</p>
      </div>
      {loading && <p className="muted">Cargando...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !items.length && <p className="muted">No tengo inscripciones todavía.</p>}
      {items.map((item) => (
        <div className="card" key={item.id}>
          <p><strong>Evento:</strong> {item.event_id}</p>
          <p><strong>Estado:</strong> {registrationStatusLabel(item.status)}</p>
          <p className="muted">{new Date(item.registered_at).toLocaleString()}</p>
          {item.notes && <p><strong>Nota:</strong> {item.notes}</p>}
        </div>
      ))}

      {isAdmin && (
        <div className="card">
          <h2>Gestión de usuarios</h2>
          <p className="muted">Como administrador puedo cambiar el rol a Asistente, Organizador o Administrador.</p>
          {usersLoading && <p className="muted">Cargando usuarios...</p>}
          {usersError && <p className="error">{usersError}</p>}
          {roleSuccess && <p className="success">{roleSuccess}</p>}
          {!usersLoading && !visibleUsers.length && <p className="muted">No hay usuarios para mostrar.</p>}
          {!!visibleUsers.length && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px" }}>Nombre</th>
                    <th style={{ textAlign: "left", padding: "8px" }}>Correo electrónico</th>
                    <th style={{ textAlign: "left", padding: "8px" }}>Rol</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: "8px" }}>{item.full_name}</td>
                      <td style={{ padding: "8px" }}>{item.email}</td>
                      <td style={{ padding: "8px" }}>
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
        </div>
      )}
    </div>
  );
}
