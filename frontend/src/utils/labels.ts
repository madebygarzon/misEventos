import type { ManagedRole } from "../types/user";

type EventStatus = "draft" | "published" | "cancelled" | "finished";
type SessionStatus = "scheduled" | "in_progress" | "finished" | "cancelled";
type RegistrationStatus = "registered" | "cancelled" | "waitlist";

const ROLE_LABELS: Record<ManagedRole, string> = {
  attendee: "Asistente",
  organizer: "Organizador",
  admin: "Administrador"
};

const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  cancelled: "Cancelado",
  finished: "Finalizado"
};

const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Programada",
  in_progress: "En progreso",
  finished: "Finalizada",
  cancelled: "Cancelada"
};

const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, string> = {
  registered: "Inscrito",
  cancelled: "Cancelado",
  waitlist: "Lista de espera"
};

export function roleLabel(role: ManagedRole | string): string {
  return ROLE_LABELS[role as ManagedRole] || role;
}

export function eventStatusLabel(status: EventStatus | string): string {
  return EVENT_STATUS_LABELS[status as EventStatus] || status;
}

export function sessionStatusLabel(status: SessionStatus | string): string {
  return SESSION_STATUS_LABELS[status as SessionStatus] || status;
}

export function registrationStatusLabel(status: RegistrationStatus | string): string {
  return REGISTRATION_STATUS_LABELS[status as RegistrationStatus] || status;
}
